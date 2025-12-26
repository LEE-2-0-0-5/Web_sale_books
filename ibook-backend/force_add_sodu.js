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

    const sql = "ALTER TABLE KhachHang ADD COLUMN SoDu DECIMAL(15, 2) DEFAULT 0";

    db.query(sql, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column SoDu already exists (Duplicate field name)');
            } else {
                console.error('Error adding SoDu column:', err);
            }
        } else {
            console.log('Successfully added SoDu column to KhachHang');
        }

        // Also ensure GiaoDich exists
        const tableSql = `CREATE TABLE IF NOT EXISTS GiaoDich (
            MaGiaoDich INT AUTO_INCREMENT PRIMARY KEY,
            MaKhachHang VARCHAR(50),
            LoaiGiaoDich VARCHAR(20),
            SoTien DECIMAL(15, 2),
            NoiDung TEXT,
            NgayGiaoDich DATETIME DEFAULT CURRENT_TIMESTAMP,
            TrangThai VARCHAR(20) DEFAULT 'ThanhCong',
            FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang) ON DELETE CASCADE
        )`;

        db.query(tableSql, (err) => {
            if (err) console.error('Error creating GiaoDich table:', err);
            else console.log('GiaoDich table checked/created');
            process.exit();
        });
    });
});
