const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('--- Searching for Endpoint Definitions in server.js ---');
lines.forEach((line, index) => {
    if (line.includes("app.get('/api/products/:id'") || line.includes('app.get("/api/products/:id"')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
    if (line.includes("app.get('/api/products'") || line.includes('app.get("/api/products"')) {
        // Exclude :id matches
        if (!line.includes(":id")) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    }
    if (line.includes("app.listen")) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
