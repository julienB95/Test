const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Si on demande la racine, on donne l'index.html
    let filePath = req.url === '/' ? './index.html' : '.' + req.url;

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end("Fichier non trouve");
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
        }
    });
});

// On écoute sur le port 9999
server.listen(9999, '127.0.0.1', () => {
    console.log('Serveur actif sur http://127.0.0.1:9999');
});