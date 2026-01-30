package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var authDB *sql.DB

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type createUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func initAuthDB() {
	host := getEnvOrDefault("AUTH_DB_HOST", "auth-db")
	port := getEnvOrDefault("AUTH_DB_PORT", "5432")
	name := os.Getenv("AUTH_DB_NAME")
	user := os.Getenv("AUTH_DB_USER")
	password := os.Getenv("AUTH_DB_PASSWORD")
	sslMode := getEnvOrDefault("AUTH_DB_SSLMODE", "disable")

	if name == "" || user == "" || password == "" {
		log.Fatalf("AUTH_DB_NAME, AUTH_DB_USER et AUTH_DB_PASSWORD sont requis")
	}

	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host,
		port,
		user,
		password,
		name,
		sslMode,
	)

	var err error
	authDB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Erreur ouverture Postgres: %v", err)
	}

	var lastErr error
	for attempt := 1; attempt <= 10; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		lastErr = authDB.PingContext(ctx)
		cancel()
		if lastErr == nil {
			break
		}
		time.Sleep(2 * time.Second)
	}
	if lastErr != nil {
		log.Fatalf("Erreur connexion Postgres: %v", lastErr)
	}

	if err := ensureAuthSchema(authDB); err != nil {
		log.Fatalf("Erreur migration Postgres: %v", err)
	}

	log.Printf("Connecté à Postgres (auth) avec succès !")
}

func loginHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req loginRequest
		if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" || req.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_credentials"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		var companyName string
		var passwordHash string
		var apiToken string

		err := db.QueryRowContext(
			ctx,
			"SELECT company_name, password_hash, api_token FROM companies WHERE company_name = $1",
			req.Username,
		).Scan(&companyName, &passwordHash, &apiToken)

		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
			return
		}

		if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)) != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":      "ok",
			"companyName": companyName,
			"apiToken":    apiToken,
		})
	}
}

func createUserHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req createUserRequest
		if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" || req.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_credentials"})
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "hash_error"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		var id string
		var apiToken string
		err = db.QueryRowContext(
			ctx,
			"INSERT INTO companies (company_name, password_hash, api_token) VALUES ($1, $2, uuid_generate_v4()) RETURNING id, api_token",
			req.Username,
			string(hash),
		).Scan(&id, &apiToken)

		if err != nil {
			var pqErr *pq.Error
			if errors.As(err, &pqErr) && pqErr.Code == "23505" {
				c.JSON(http.StatusConflict, gin.H{"error": "user_exists"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"status":      "created",
			"id":          id,
			"companyName": req.Username,
			"apiToken":    apiToken,
		})
	}
}

func healthHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "down", "error": "auth_db_not_initialized"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		if err := db.PingContext(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "down", "error": "auth_db_unreachable"})
			return
		}

		var exists int
		err := db.QueryRowContext(ctx, "SELECT 1 FROM companies LIMIT 1").Scan(&exists)
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "down", "error": "companies_table_missing"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

func getEnvOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func ensureAuthSchema(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
		`CREATE TABLE IF NOT EXISTS companies (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			company_name TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			api_token UUID NOT NULL UNIQUE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_companies_api_token ON companies (api_token);`,
		`CREATE TABLE IF NOT EXISTS premium_whitelist (
			valid_token UUID PRIMARY KEY
		);`,
	}

	for _, q := range queries {
		if _, err := db.ExecContext(ctx, q); err != nil {
			return err
		}
	}

	return nil
}
