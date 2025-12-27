package models

// Représente une machine sur le réseau
type Node struct {
	ID				string `json:"id"`
	IP				string `json:"ip"`
	Hostname 	string `json:"hostname"`
	Type			string `json:"type"` // "router", "server", "pc"
}

// Représente une connexion
type Link struct {
	Source	string `json:"source"` 	// ID du noeud source
	Target	string `json:"target"` 	// ID du noeud cible
	Type		string `json:"type"`		// "http", "ssh"
}

// Type échangé entre front et back
type NetworkGraph struct {
	Nodes []Node `json:"nodes"`
	Links	[]Link `json:"links"`
}