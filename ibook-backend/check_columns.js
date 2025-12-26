const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');

    db.query('DESCRIBE KhachHang', (err, results) => {
        if (err) {
            console.error('Error describing table:', err);
        } else {
            console.log('Columns in KhachHang table:');
            results.forEach(col => {
                console.log(`- ${col.Field} (${col.Type})`);
            });
        }
        process.exit();
    });
});
