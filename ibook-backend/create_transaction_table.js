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

    const sql = `
        CREATE TABLE IF NOT EXISTS GiaoDich (
            MaGiaoDich INT AUTO_INCREMENT PRIMARY KEY,
            MaKhachHang VARCHAR(50),
            LoaiGiaoDich VARCHAR(50),
            SoTien DECIMAL(15, 2),
            NoiDung TEXT,
            TrangThai VARCHAR(50),
            NgayGiaoDich DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang)
        );
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table GiaoDich created or already exists');
        }
        db.end();
    });
});
