const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(async (err) => {
    if (err) throw err;
    console.log('Connected to database');

    const sql = "SELECT * FROM TruyenTranh WHERE MaTruyen = 'TT01'";
    db.query(sql, (err, results) => {
        if (err) throw err;
        console.log(JSON.stringify(results, null, 2));
        process.exit();
    });
});
