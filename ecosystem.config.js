const http = require('http');
const fs = require('fs');
const path = require('path');

module.exports = {
    apps: [{
        name: "mon-site-test",
        script: "server.js", // On va créer ce petit fichier juste après
        watch: false
    }]
}