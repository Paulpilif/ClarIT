package main

import (
	"context"
	"fmt"
	"time"

	"github.com/Paulpilif/ClarIT/pkg/models"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

func PersistGraph(ctx context.Context, driver neo4j.DriverWithContext, graph models.NetworkGraph) error {
	session := driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	ingestTime := time.Now().Unix()
	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		var nodesAsMap []map[string]any
		for _, n := range graph.Nodes {
			nodesAsMap = append(nodesAsMap, map[string]any{
				"id":       n.ID,
				"ip":       n.IP,
				"hostname": n.Hostname,
				"type":     n.Type,
			})
		}

		var linksAsMap []map[string]any
		for _, l := range graph.Links {
			linksAsMap = append(linksAsMap, map[string]any{
				"source": l.Source,
				"target": l.Target,
				"type":   l.Type,
			})
		}

		queryNodes := `
		UNWIND $batchNodes AS item
		MERGE (m:Machine {id: item.id})
		ON CREATE SET 
			m.created_at = $now,
			m.status = 'ONLINE'  // Nouveau status par défaut
		
		// Qu'on le crée ou qu'on le retrouve, on met à jour ces champs :
		SET 
			m.ip = item.ip, 
			m.hostname = item.hostname, 
			m.type = item.type,
			m.last_seen = $now,   // <-- Le point clé
			m.status = 'ONLINE'   // Si elle revient, elle repasse ONLINE

		// Gestion des Labels dynamiques
		REMOVE m:Router:Server:PC
		FOREACH (_ IN CASE WHEN item.type = 'router' THEN [1] ELSE [] END | SET m:Router)
		FOREACH (_ IN CASE WHEN item.type = 'server' THEN [1] ELSE [] END | SET m:Server)
		FOREACH (_ IN CASE WHEN item.type = 'pc' THEN [1] ELSE [] END | SET m:PC)
		`

		paramsNodes := map[string]any{
			"batchNodes": nodesAsMap,
			"now":        ingestTime,
		}

		if _, err := tx.Run(ctx, queryNodes, paramsNodes); err != nil {
			return nil, fmt.Errorf("erreur batch noeuds: %w", err)
		}

		queryLinks := `
		UNWIND $batchLinks AS link
		MATCH (source:Machine {id: link.source})
		MATCH (target:Machine {id: link.target})
		MERGE (source)-[r:CONNECTED_TO]->(target)
		SET r.type = link.type, r.last_seen = $now
		`

		paramsLink := map[string]any{
			"batchLinks": linksAsMap,
			"now":        ingestTime,
		}

		if _, err := tx.Run(ctx, queryLinks, paramsLink); err != nil {
			return nil, fmt.Errorf("erreur batch liens: %w", err)
		}

		queryMissing := `
		MATCH (m:Machine)
		WHERE m.last_seen < $now
		SET m.status = 'MISSING'
		`

		if _, err := tx.Run(ctx, queryMissing, map[string]any{"now": ingestTime}); err != nil {
			return nil, fmt.Errorf("erreur calcul diff: %w", err)
		}

		return nil, nil
	})

	return err
}

func GetGraph(ctx context.Context, driver neo4j.DriverWithContext) (models.NetworkGraph, error) {
	session := driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	resultGraph := models.NetworkGraph{
		Nodes: []models.Node{},
		Links: []models.Link{},
	}

	uniqueNodes := make(map[string]models.Node)

	_, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		query := `
		MATCH (n:Machine)
		OPTIONAL MATCH (n)-[r:CONNECTED_TO]->(m:Machine)
		RETURN n, r, m
		`

		result, err := tx.Run(ctx, query, nil)
		if err != nil {
			return nil, err
		}

		for result.Next(ctx) {
			record := result.Record()

			nodeObj, _ := record.Get("n")
			if nodeObj == nil {
				continue
			}

			dbNode := nodeObj.(neo4j.Node)
			sourceProps := dbNode.Props
			n := models.Node{
				ID:       sourceProps["id"].(string),
				IP:       getString(sourceProps, "ip"),
				Hostname: getString(sourceProps, "hostname"),
				Type:     getString(sourceProps, "type"),
			}
			uniqueNodes[n.ID] = n

			relObj, _ := record.Get("r")
			targetObj, _ := record.Get("m")

			if relObj != nil && targetObj != nil {
				dbRel := relObj.(neo4j.Relationship)
				dbTarget := targetObj.(neo4j.Node)

				targetProps := dbTarget.Props
				t := models.Node{
					ID:       targetProps["id"].(string),
					IP:       getString(targetProps, "ip"),
					Hostname: getString(targetProps, "hostname"),
					Type:     getString(targetProps, "type"),
				}
				uniqueNodes[t.ID] = t
				link := models.Link{
					Source: sourceProps["id"].(string),
					Target: targetProps["id"].(string),
					Type:   getString(dbRel.Props, "type"),
				}
				resultGraph.Links = append(resultGraph.Links, link)
			}
		}

		return nil, result.Err()
	})

	if err != nil {
		return resultGraph, err
	}

	for _, n := range uniqueNodes {
		resultGraph.Nodes = append(resultGraph.Nodes, n)
	}

	return resultGraph, nil
}

func getString(props map[string]any, key string) string {
	if val, ok := props[key]; ok && val != nil {
		return val.(string)
	}
	return ""
}
