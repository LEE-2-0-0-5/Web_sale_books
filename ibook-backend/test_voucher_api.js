const http = require('http');

const url = 'http://localhost:3001/api/vouchers';

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
