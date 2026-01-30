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

	// Route POST pour recevoir les données
	r.POST("/api/v1/ingest", func(c *gin.Context) {
		var graphData models.NetworkGraph
		if err := c.ShouldBindJSON(&graphData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := PersistGraph(c.Request.Context(), driver, graphData)

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

	r.POST("/api/v1/login", loginHandler(authDB))
	r.POST("/api/v1/users", createUserHandler(authDB))
	r.GET("/api/v1/health", healthHandler(authDB))

	r.Run(":8080")
}
