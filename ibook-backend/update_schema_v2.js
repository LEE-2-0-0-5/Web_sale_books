const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    // Add NgayBatDau column
    const sql = "ALTER TABLE GiamGia ADD COLUMN NgayBatDau DATE DEFAULT NULL"; // Default null for existing

    db.query(sql, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column NgayBatDau already exists.');
            } else {
                console.error('Failed to alter table:', err);
            }
        } else {
            console.log('Added NgayBatDau column to GiamGia.');
            // Update existing to have StartDate = Today
            db.query("UPDATE GiamGia SET NgayBatDau = CURDATE() WHERE NgayBatDau IS NULL");
        }
        db.end();
    });
});
