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
    console.log('Connected to DB');

    const queries = [
        `CREATE TABLE IF NOT EXISTS YeuThich (
            MaYeuThich INT AUTO_INCREMENT PRIMARY KEY,
            MaKhachHang VARCHAR(50),
            MaTruyen VARCHAR(50),
            NgayThem DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang) ON DELETE CASCADE,
            FOREIGN KEY (MaTruyen) REFERENCES TruyenTranh(MaTruyen) ON DELETE CASCADE,
            UNIQUE(MaKhachHang, MaTruyen)
        )`,
        `CREATE TABLE IF NOT EXISTS ThongBao (
            MaThongBao INT AUTO_INCREMENT PRIMARY KEY,
            MaNguoiDung VARCHAR(50),
            TieuDe VARCHAR(255),
            NoiDung TEXT,
            DaXem BOOLEAN DEFAULT FALSE,
            NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
        )`
    ];

    let completed = 0;
    queries.forEach(query => {
        db.query(query, (err) => {
            if (err) console.error('Query failed:', err);
            else console.log('Table created/verified');
            completed++;
            if (completed === queries.length) {
                console.log('Schema update complete');
                db.end();
            }
        });
    });
});
