const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Chemin du fichier stockage utilisateurs
const usersFilePath = path.join(__dirname, 'users.json');

// Initialiser le fichier users.json s'il n'existe pas
const initializeUsersFile = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
  }
};

// Lire les utilisateurs du fichier
const readUsers = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erreur lors de la lecture des utilisateurs:', err);
    return [];
  }
};

// Écrire les utilisateurs dans le fichier
const writeUsers = (users) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde des utilisateurs:', err);
  }
};

// Route: Récupérer tous les utilisateurs
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// Route: Créer un nouvel utilisateur
app.post('/api/users', (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username et password requis' });
  }

  const users = readUsers();

  // Vérifier si l'utilisateur existe déjà
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Utilisateur déjà existant' });
  }

  // Créer le nouvel utilisateur
  const newUser = {
    id: Date.now(),
    username: username.trim(),
    password: password, // En production, hasher le mot de passe!
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  res.status(201).json({ message: 'Utilisateur créé avec succès', user: { username: newUser.username } });
});

// Route: Authentification
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username et password requis' });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  res.json({ 
    message: 'Authentification réussie',
    user: { 
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    }
  });
});

// Route: Supprimer un utilisateur
app.delete('/api/users/:username', (req, res) => {
  const { username } = req.params;

  let users = readUsers();
  const userIndex = users.findIndex(u => u.username === username);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  users.splice(userIndex, 1);
  writeUsers(users);

  res.json({ message: 'Utilisateur supprimé avec succès' });
});

// Démarrer le serveur
initializeUsersFile();
app.listen(PORT, () => {
  console.log(`Serveur d'authentification démarré sur http://localhost:${PORT}`);
});
