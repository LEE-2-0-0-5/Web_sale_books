const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to DB. Checking columns...');

    const sql = "ALTER TABLE DonHang ADD COLUMN GhiChu TEXT";

    db.query(sql, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column GhiChu already exists. All good.');
            } else {
                console.error('Error adding column:', err.message);
            }
        } else {
            console.log('Successfully added GhiChu column to DonHang.');
        }
        process.exit();
    });
});
