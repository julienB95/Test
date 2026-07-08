const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Initialisation de la base de données SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS utilisateurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        role TEXT DEFAULT 'Visiteur',
        email TEXT,
        status TEXT DEFAULT 'Actif'
    )`, (err) => {
        if (err) return;
        // Remplir avec les données initiales si la table est vide
        db.get("SELECT COUNT(*) as count FROM utilisateurs", (err, row) => {
            if (!err && row.count === 0) {
                const stmt = db.prepare("INSERT INTO utilisateurs (firstname, lastname, role, email, status) VALUES (?, ?, ?, ?, ?)");
                stmt.run("Sylvain", "Forestier", "Garde forestier", "sylvain.forestier@silva.fr", "Actif");
                stmt.run("Élodie", "Boisée", "Écologue", "elodie.boisee@silva.fr", "Actif");
                stmt.run("Marc", "Arbuste", "Botaniste", "marc.arbuste@silva.fr", "Absent");
                stmt.finalize();
            }
        });
    });
});

const server = http.createServer((req, res) => {
    // API GET : Liste des utilisateurs
    if (req.url === '/api/users' && req.method === 'GET') {
        db.all("SELECT * FROM utilisateurs", [], (err, rows) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        });
        return;
    }

    // API POST : Ajouter un utilisateur
    if (req.url === '/api/users' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { firstname, lastname } = data;
                if (!firstname || !lastname) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Nom et prénom requis' }));
                    return;
                }
                
                // Normalisation de l'email (retrait des accents, minuscules)
                const normFirst = firstname.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const normLast = lastname.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const email = `${normFirst}.${normLast}@silva.fr`;

                const stmt = db.prepare("INSERT INTO utilisateurs (firstname, lastname, role, email, status) VALUES (?, ?, 'Visiteur', ?, 'Actif')");
                stmt.run(firstname, lastname, email, function(err) {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                        return;
                    }
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        id: this.lastID, 
                        firstname, 
                        lastname, 
                        role: 'Visiteur', 
                        email, 
                        status: 'Actif' 
                    }));
                });
                stmt.finalize();
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Format JSON invalide' }));
            }
        });
        return;
    }

    // Serveur de fichiers statiques
    let filePath = req.url === '/' ? './index.html' : '.' + req.url;
    filePath = filePath.split('?')[0].split('#')[0];

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end("Fichier non trouve");
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Écoute sur le port 9999
server.listen(9999, '127.0.0.1', () => {
    console.log('Serveur actif sur http://127.0.0.1:9999');
});