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

    const createCartSql = `
        CREATE TABLE IF NOT EXISTS GioHang (
            MaGioHang INT AUTO_INCREMENT PRIMARY KEY,
            MaKhachHang VARCHAR(50),
            NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
            NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang) ON DELETE CASCADE,
            UNIQUE(MaKhachHang)
        )
    `;

    const createCartItemSql = `
        CREATE TABLE IF NOT EXISTS ChiTietGioHang (
            Id INT AUTO_INCREMENT PRIMARY KEY,
            MaGioHang INT,
            MaTruyen VARCHAR(50),
            SoLuong INT DEFAULT 1,
            FOREIGN KEY (MaGioHang) REFERENCES GioHang(MaGioHang) ON DELETE CASCADE,
            FOREIGN KEY (MaTruyen) REFERENCES TruyenTranh(MaTruyen) ON DELETE CASCADE,
            UNIQUE(MaGioHang, MaTruyen)
        )
    `;

    db.query(createCartSql, (err) => {
        if (err) console.error('Error creating GioHang:', err);
        else console.log('GioHang table created.');

        db.query(createCartItemSql, (err) => {
            if (err) console.error('Error creating ChiTietGioHang:', err);
            else console.log('ChiTietGioHang table created.');
            db.end();
        });
    });
});
