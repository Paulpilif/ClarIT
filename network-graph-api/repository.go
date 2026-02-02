package main

import (
	"context"
	"fmt"
	"time"

	"github.com/Paulpilif/ClarIT/pkg/models"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

func PersistGraph(ctx context.Context, driver neo4j.DriverWithContext, graph models.NetworkGraph, companyName string) error {
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
				"risk":     n.Risk,
			})
		}

		var servicesAsMap []map[string]any
		for _, n := range graph.Nodes {
			for _, s := range n.Services {
				servicesAsMap = append(servicesAsMap, map[string]any{
					"machineId": n.ID,
					"port":      s.Port,
					"protocol":  s.Protocol,
					"name":      s.Name,
					"version":   s.Version,
				})
			}
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
			m.risk = item.risk,
			m.company_name = $companyName,
			m.last_seen = $now,   // <-- Le point clé
			m.status = 'ONLINE'   // Si elle revient, elle repasse ONLINE

		// Gestion des Labels dynamiques
		REMOVE m:Router:Server:PC:Firewall:Hypervisor:NetworkDevice:DomainController:DatabaseServer:WebServer:ApplicationServer:Bastion:Workstation:Unknown
		FOREACH (_ IN CASE WHEN item.type = 'router' THEN [1] ELSE [] END | SET m:Router)
		FOREACH (_ IN CASE WHEN item.type = 'server' THEN [1] ELSE [] END | SET m:Server)
		FOREACH (_ IN CASE WHEN item.type = 'pc' THEN [1] ELSE [] END | SET m:PC)
		FOREACH (_ IN CASE WHEN item.type = 'firewall' THEN [1] ELSE [] END | SET m:Firewall)
		FOREACH (_ IN CASE WHEN item.type = 'hypervisor' THEN [1] ELSE [] END | SET m:Hypervisor)
		FOREACH (_ IN CASE WHEN item.type = 'network-device' THEN [1] ELSE [] END | SET m:NetworkDevice)
		FOREACH (_ IN CASE WHEN item.type = 'domain-controller' THEN [1] ELSE [] END | SET m:DomainController)
		FOREACH (_ IN CASE WHEN item.type = 'database-server' THEN [1] ELSE [] END | SET m:DatabaseServer)
		FOREACH (_ IN CASE WHEN item.type = 'web-server' THEN [1] ELSE [] END | SET m:WebServer)
		FOREACH (_ IN CASE WHEN item.type = 'application-server' THEN [1] ELSE [] END | SET m:ApplicationServer)
		FOREACH (_ IN CASE WHEN item.type = 'bastion' THEN [1] ELSE [] END | SET m:Bastion)
		FOREACH (_ IN CASE WHEN item.type = 'workstation' THEN [1] ELSE [] END | SET m:Workstation)
		FOREACH (_ IN CASE WHEN item.type = 'unknown' THEN [1] ELSE [] END | SET m:Unknown)

		WITH m
		MERGE (c:Company {name: $companyName})
		ON CREATE SET c.created_at = $now
		SET c.last_seen = $now
		MERGE (c)-[r:OWNS]->(m)
		SET r.last_seen = $now
		`

		paramsNodes := map[string]any{
			"batchNodes": nodesAsMap,
			"now":        ingestTime,
			"companyName": companyName,
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

		queryServices := `
		UNWIND $batchServices AS svc
		MATCH (m:Machine {id: svc.machineId})
		MERGE (s:Service {machine_id: svc.machineId, port: svc.port, protocol: svc.protocol, name: svc.name})
		SET s.version = svc.version, s.last_seen = $now
		MERGE (m)-[r:HAS_SERVICE]->(s)
		SET r.last_seen = $now
		`

		paramsServices := map[string]any{
			"batchServices": servicesAsMap,
			"now":           ingestTime,
		}

		if _, err := tx.Run(ctx, queryServices, paramsServices); err != nil {
			return nil, fmt.Errorf("erreur batch services: %w", err)
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
		queryNodes := `
		MATCH (n:Machine)
		OPTIONAL MATCH (n)-[:HAS_SERVICE]->(s:Service)
		RETURN n, collect(s) AS services
		`

		result, err := tx.Run(ctx, queryNodes, nil)
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
				Risk:     getString(sourceProps, "risk"),
			}

			servicesObj, _ := record.Get("services")
			if servicesObj != nil {
				if list, ok := servicesObj.([]any); ok {
					for _, item := range list {
						if item == nil {
							continue
						}
						dbService := item.(neo4j.Node)
						serviceProps := dbService.Props
						service := models.Service{
							Port:     getInt(serviceProps, "port"),
							Protocol: getString(serviceProps, "protocol"),
							Name:     getString(serviceProps, "name"),
							Version:  getString(serviceProps, "version"),
						}
						n.Services = append(n.Services, service)
					}
				}
			}
			uniqueNodes[n.ID] = n
		}
		if err := result.Err(); err != nil {
			return nil, err
		}

		queryLinks := `
		MATCH (n:Machine)-[r:CONNECTED_TO]->(m:Machine)
		RETURN n, r, m
		`

		linksResult, err := tx.Run(ctx, queryLinks, nil)
		if err != nil {
			return nil, err
		}

		for linksResult.Next(ctx) {
			record := linksResult.Record()

			sourceObj, _ := record.Get("n")
			targetObj, _ := record.Get("m")
			relObj, _ := record.Get("r")
			if sourceObj == nil || targetObj == nil || relObj == nil {
				continue
			}

			sourceNode := sourceObj.(neo4j.Node)
			targetNode := targetObj.(neo4j.Node)
			rel := relObj.(neo4j.Relationship)

			sourceProps := sourceNode.Props
			targetProps := targetNode.Props

			link := models.Link{
				Source: sourceProps["id"].(string),
				Target: targetProps["id"].(string),
				Type:   getString(rel.Props, "type"),
			}
			resultGraph.Links = append(resultGraph.Links, link)
		}

		return nil, linksResult.Err()
	})

	if err != nil {
		return resultGraph, err
	}

	for _, n := range uniqueNodes {
		resultGraph.Nodes = append(resultGraph.Nodes, n)
	}

	return resultGraph, nil
}

func GetGraphByCompany(ctx context.Context, driver neo4j.DriverWithContext, companyName string) (models.NetworkGraph, error) {
	session := driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	resultGraph := models.NetworkGraph{
		Nodes: []models.Node{},
		Links: []models.Link{},
	}

	uniqueNodes := make(map[string]models.Node)

	_, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		queryNodes := `
		MATCH (c:Company)
		WHERE toLower(c.name) = toLower($companyName)
		MATCH (c)-[:OWNS]->(n:Machine)
		OPTIONAL MATCH (n)-[:HAS_SERVICE]->(s:Service)
		RETURN n, collect(s) AS services
		`

		result, err := tx.Run(ctx, queryNodes, map[string]any{"companyName": companyName})
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
				Risk:     getString(sourceProps, "risk"),
			}

			servicesObj, _ := record.Get("services")
			if servicesObj != nil {
				if list, ok := servicesObj.([]any); ok {
					for _, item := range list {
						if item == nil {
							continue
						}
						dbService := item.(neo4j.Node)
						serviceProps := dbService.Props
						service := models.Service{
							Port:     getInt(serviceProps, "port"),
							Protocol: getString(serviceProps, "protocol"),
							Name:     getString(serviceProps, "name"),
							Version:  getString(serviceProps, "version"),
						}
						n.Services = append(n.Services, service)
					}
				}
			}
			uniqueNodes[n.ID] = n
		}
		if err := result.Err(); err != nil {
			return nil, err
		}

		queryLinks := `
		MATCH (c:Company)
		WHERE toLower(c.name) = toLower($companyName)
		MATCH (c)-[:OWNS]->(n:Machine)
		MATCH (c)-[:OWNS]->(m:Machine)
		MATCH (n)-[r:CONNECTED_TO]->(m)
		RETURN n, r, m
		`

		linksResult, err := tx.Run(ctx, queryLinks, map[string]any{"companyName": companyName})
		if err != nil {
			return nil, err
		}

		for linksResult.Next(ctx) {
			record := linksResult.Record()

			sourceObj, _ := record.Get("n")
			targetObj, _ := record.Get("m")
			relObj, _ := record.Get("r")
			if sourceObj == nil || targetObj == nil || relObj == nil {
				continue
			}

			sourceNode := sourceObj.(neo4j.Node)
			targetNode := targetObj.(neo4j.Node)
			rel := relObj.(neo4j.Relationship)

			sourceProps := sourceNode.Props
			targetProps := targetNode.Props

			link := models.Link{
				Source: sourceProps["id"].(string),
				Target: targetProps["id"].(string),
				Type:   getString(rel.Props, "type"),
			}
			resultGraph.Links = append(resultGraph.Links, link)
		}

		return nil, linksResult.Err()
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

func getInt(props map[string]any, key string) int {
	if val, ok := props[key]; ok && val != nil {
		switch typed := val.(type) {
		case int:
			return typed
		case int64:
			return int(typed)
		case float64:
			return int(typed)
		}
	}
	return 0
}
