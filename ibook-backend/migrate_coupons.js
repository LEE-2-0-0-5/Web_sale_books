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

    const sqlStatements = [
        // 1. Drop the temporary tables I created previously
        "DROP TABLE IF EXISTS GiamGia_KhachHang",
        "DROP TABLE IF EXISTS GiamGia",

        // 2. Upgrade PhieuGiamGia to support Percentages
        "ALTER TABLE PhieuGiamGia ADD COLUMN LoaiGiamGia ENUM('Tien', 'PhanTram') DEFAULT 'Tien'",

        // 3. Upgrade DieuKienApDung to allow longer JSON Conditions
        "ALTER TABLE DieuKienApDung MODIFY COLUMN GiaTriYeuCau TEXT",

        // 4. Create User Wallet for PhieuGiamGia (as requested)
        `CREATE TABLE IF NOT EXISTS PhieuGiamGia_KhachHang (
            Id INT AUTO_INCREMENT PRIMARY KEY,
            MaPGG_ID VARCHAR(50),
            MaKhachHang VARCHAR(50),
            TrangThai VARCHAR(20) DEFAULT 'ChuaDung', -- 'ChuaDung', 'DaDung'
            NgayLuu DATETIME DEFAULT CURRENT_TIMESTAMP,
            NgaySuDung DATETIME,
            FOREIGN KEY (MaPGG_ID) REFERENCES PhieuGiamGia(MaPGG_ID) ON DELETE CASCADE,
            FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang) ON DELETE CASCADE,
            UNIQUE(MaPGG_ID, MaKhachHang)
        )`
    ];

    const runQueries = async () => {
        for (const sql of sqlStatements) {
            await new Promise((resolve) => {
                db.query(sql, (err) => {
                    if (err && err.code !== 'ER_DUP_FIELDNAME') console.log(`Step error (${sql.substr(0, 30)}...):`, err.message);
                    else console.log(`Executed: ${sql.substr(0, 50)}...`);
                    resolve();
                });
            });
        }
        console.log('Migration to PhieuGiamGia structure complete.');
        db.end();
    };

    runQueries();
});
