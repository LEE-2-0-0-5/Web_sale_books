const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(err => {
    if (err) throw err;
    const sql = "DESCRIBE TruyenTranh";
    db.query(sql, (err, results) => {
        if (err) throw err;
        console.log(JSON.stringify(results, null, 2));
        process.exit();
    });
});
