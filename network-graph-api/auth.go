package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
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

type addPremiumTokenRequest struct {
	APIToken         string `json:"api_token"`
	StartDate        string `json:"start_date"`
	LastPaymentDate  string `json:"last_payment_date"`
	SubscriptionType string `json:"subscription_type"`
}

type updatePremiumSubscriptionTypeRequest struct {
	APIToken         string `json:"api_token"`
	SubscriptionType string `json:"subscription_type"`
}

type updatePremiumLastPaymentRequest struct {
	APIToken        string `json:"api_token"`
	LastPaymentDate string `json:"last_payment_date"`
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

func addPremiumTokenHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req addPremiumTokenRequest
		if err := c.ShouldBindJSON(&req); err != nil || req.APIToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_api_token"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		var startDate sql.NullTime
		if req.StartDate != "" {
			parsed, err := time.Parse("2006-01-02", req.StartDate)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_start_date"})
				return
			}
			startDate = sql.NullTime{Time: parsed, Valid: true}
		}

		var lastPaymentDate sql.NullTime
		if req.LastPaymentDate != "" {
			parsed, err := time.Parse("2006-01-02", req.LastPaymentDate)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_last_payment_date"})
				return
			}
			lastPaymentDate = sql.NullTime{Time: parsed, Valid: true}
		}

		subscriptionType := strings.ToLower(strings.TrimSpace(req.SubscriptionType))
		if subscriptionType != "" && subscriptionType != "mensuel" && subscriptionType != "annuel" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_subscription_type"})
			return
		}

		var subscriptionTypeValue sql.NullString
		if subscriptionType != "" {
			subscriptionTypeValue = sql.NullString{String: subscriptionType, Valid: true}
		}

		_, err := db.ExecContext(
			ctx,
			"INSERT INTO premium_whitelist (valid_token, start_date, last_payment_date, subscription_type) VALUES ($1, $2, $3, $4)",
			req.APIToken,
			startDate,
			lastPaymentDate,
			subscriptionTypeValue,
		)
		if err != nil {
			var pqErr *pq.Error
			if errors.As(err, &pqErr) && pqErr.Code == "23505" {
				c.JSON(http.StatusConflict, gin.H{"error": "token_exists"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"status": "added"})
	}
}

func updatePremiumSubscriptionTypeHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req updatePremiumSubscriptionTypeRequest
		if err := c.ShouldBindJSON(&req); err != nil || req.APIToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_api_token"})
			return
		}

		subscriptionType := strings.ToLower(strings.TrimSpace(req.SubscriptionType))
		if subscriptionType != "mensuel" && subscriptionType != "annuel" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_subscription_type"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		res, err := db.ExecContext(
			ctx,
			"UPDATE premium_whitelist SET subscription_type = $2 WHERE valid_token = $1",
			req.APIToken,
			subscriptionType,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
			return
		}

		rows, err := res.RowsAffected()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
			return
		}
		if rows == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "token_not_found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "updated"})
	}
}

func updatePremiumLastPaymentHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req updatePremiumLastPaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil || req.APIToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_api_token"})
			return
		}

		if req.LastPaymentDate == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_last_payment_date"})
			return
		}

		parsed, err := time.Parse("2006-01-02", req.LastPaymentDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_last_payment_date"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		res, err := db.ExecContext(
			ctx,
			"UPDATE premium_whitelist SET last_payment_date = $2 WHERE valid_token = $1",
			req.APIToken,
			parsed,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
			return
		}

		rows, err := res.RowsAffected()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
			return
		}
		if rows == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "token_not_found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "updated"})
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

func premiumStatusHandler(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		apiToken := c.GetHeader("X-API-Token")
		if apiToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_api_token"})
			return
		}

		allowed, err := isPremiumToken(c.Request.Context(), db, apiToken)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"premium": allowed,
		})
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
			valid_token UUID PRIMARY KEY,
			start_date DATE,
			last_payment_date DATE,
			subscription_type TEXT
		);`,
		`ALTER TABLE premium_whitelist ADD COLUMN IF NOT EXISTS start_date DATE;`,
		`ALTER TABLE premium_whitelist ADD COLUMN IF NOT EXISTS last_payment_date DATE;`,
		`ALTER TABLE premium_whitelist ADD COLUMN IF NOT EXISTS subscription_type TEXT;`,
	}

	for _, q := range queries {
		if _, err := db.ExecContext(ctx, q); err != nil {
			return err
		}
	}

	return nil
}

func isPremiumToken(ctx context.Context, db *sql.DB, token string) (bool, error) {
	if db == nil || token == "" {
		return false, nil
	}

	var lastPaymentDate sql.NullTime
	var subscriptionType sql.NullString
	if err := db.QueryRowContext(
		ctx,
		"SELECT last_payment_date, subscription_type FROM premium_whitelist WHERE valid_token = $1",
		token,
	).Scan(&lastPaymentDate, &subscriptionType); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	if !lastPaymentDate.Valid || !subscriptionType.Valid {
		return true, nil
	}

	now := time.Now().UTC()
	var expiry time.Time
	switch strings.ToLower(strings.TrimSpace(subscriptionType.String)) {
	case "mensuel":
		expiry = lastPaymentDate.Time.AddDate(0, 1, 0)
	case "annuel":
		expiry = lastPaymentDate.Time.AddDate(1, 0, 0)
	default:
		return false, nil
	}

	if now.After(expiry) {
		return false, nil
	}

	return true, nil
}

func getCompanyNameByToken(ctx context.Context, db *sql.DB, token string) (string, error) {
	if db == nil || token == "" {
		return "", nil
	}

	var companyName string
	if err := db.QueryRowContext(ctx, "SELECT company_name FROM companies WHERE api_token = $1", token).Scan(&companyName); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil
		}
		return "", err
	}

	return companyName, nil
}
