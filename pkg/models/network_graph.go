package models

// Info de service détectée
type Service struct {
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
	Name     string `json:"name"`
	Version  string `json:"version,omitempty"`
}

// Représente une machine sur le réseau
type Node struct {
	ID       string    `json:"id"`
	IP       string    `json:"ip"`
	Hostname string    `json:"hostname"`
	Type     string    `json:"type"` // "router", "server", "pc"
	Services []Service `json:"services,omitempty"`
	Risk     string    `json:"risk,omitempty"`
	Status   string    `json:"status,omitempty"`
	CreatedAt int64    `json:"created_at,omitempty"`
	LastSeen int64     `json:"last_seen,omitempty"`
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