package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Paulpilif/ClarIT/pkg/models"
	"github.com/gin-gonic/gin"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

var driver neo4j.DriverWithContext

func initNeo4j() {
	var err error
	dbUri := os.Getenv("NEO4J_URI")
	dbUser := os.Getenv("NEO4J_USER")
	dbPassword := os.Getenv("NEO4J_PASSWORD")

	driver, err = neo4j.NewDriverWithContext(
		dbUri,
		neo4j.BasicAuth(dbUser, dbPassword, ""),
	)

	if err != nil {
		log.Fatalf("Erreur création driver: %v", err)
	}
	fmt.Printf("Connecté à Neo4j avec succès !\n")
}

func main() {
	initNeo4j()
	initAuthDB()

	defer driver.Close(context.Background())
	if authDB != nil {
		defer authDB.Close()
	}
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "http://localhost:5173" || origin == "http://127.0.0.1:5173" {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, X-API-Token")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Route POST pour recevoir les données
	r.POST("/api/v1/ingest", func(c *gin.Context) {
		apiToken := c.GetHeader("X-API-Token")
		if apiToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing_api_token"})
			return
		}

		allowed, err := isPremiumToken(c.Request.Context(), authDB, apiToken)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "auth_database_error"})
			return
		}
		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "premium_required"})
			return
		}

		companyName, err := getCompanyNameByToken(c.Request.Context(), authDB, apiToken)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "auth_database_error"})
			return
		}
		if companyName == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_api_token"})
			return
		}

		var graphData models.NetworkGraph
		if err := c.ShouldBindJSON(&graphData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err = PersistGraph(c.Request.Context(), driver, graphData, companyName)

		if err != nil {
			fmt.Printf("Erreur: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "processed", "nodes": len(graphData.Nodes)})
	})

	r.GET("/api/v1/graph", func(c *gin.Context) {
		graph, err := GetGraph(c.Request.Context(), driver)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, graph)
	})

	r.GET("/api/v1/graph/company/:name", func(c *gin.Context) {
		companyName := c.Param("name")
		if companyName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing_company"})
			return
		}

		graph, err := GetGraphByCompany(c.Request.Context(), driver, companyName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, graph)
	})

	r.POST("/api/v1/login", loginHandler(authDB))
	r.POST("/api/v1/users", createUserHandler(authDB))
	r.POST("/api/v1/premium", addPremiumTokenHandler(authDB))
	r.PATCH("/api/v1/premium/subscription-type", updatePremiumSubscriptionTypeHandler(authDB))
	r.PATCH("/api/v1/premium/last-payment", updatePremiumLastPaymentHandler(authDB))
	r.GET("/api/v1/premium/status", premiumStatusHandler(authDB))
	r.GET("/api/v1/health", healthHandler(authDB))

	r.Run(":8080")
}
