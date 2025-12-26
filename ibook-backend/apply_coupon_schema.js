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

    const queries = [
        `CREATE TABLE IF NOT EXISTS DieuKienApDung (
            MaDieuKien VARCHAR(50) PRIMARY KEY,
            TenDieuKien VARCHAR(255),
            LoaiDieuKien VARCHAR(50),
            GiaTriYeuCau VARCHAR(255)
        )`,
        `CREATE TABLE IF NOT EXISTS PhieuGiamGia (
            MaPGG_ID VARCHAR(50) PRIMARY KEY,
            TenPhieuGiamGia VARCHAR(255),
            GiaTriGiam DECIMAL(15, 2),
            NgayBatDau DATETIME,
            NgayKetThuc DATETIME,
            SoLuong INT,
            MaDieuKien VARCHAR(50),
            FOREIGN KEY (MaDieuKien) REFERENCES DieuKienApDung(MaDieuKien)
        )`,
        `ALTER TABLE DonHang ADD COLUMN MaPGG_ID VARCHAR(50)`,
        `ALTER TABLE DonHang ADD CONSTRAINT FK_DonHang_PGG FOREIGN KEY (MaPGG_ID) REFERENCES PhieuGiamGia(MaPGG_ID)`,
        `INSERT IGNORE INTO DieuKienApDung (MaDieuKien, TenDieuKien, LoaiDieuKien, GiaTriYeuCau) VALUES ('DK01', 'Đơn hàng từ 0đ', 'TongTienToiThieu', '0')`,
        `INSERT IGNORE INTO PhieuGiamGia (MaPGG_ID, TenPhieuGiamGia, GiaTriGiam, NgayBatDau, NgayKetThuc, SoLuong, MaDieuKien) VALUES ('GIAM50K', 'Giảm 50k cho mọi đơn hàng', 50000, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'DK01')`
    ];

    let completed = 0;
    queries.forEach((query, index) => {
        db.query(query, (err) => {
            if (err) {
                // Ignore duplicate column/key errors
                if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_DUP_KEYNAME' && err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.error(`Error executing query ${index}:`, err.message);
                }
            } else {
                console.log(`Query ${index} executed successfully`);
            }
            completed++;
            if (completed === queries.length) {
                console.log('Schema update complete');
                process.exit();
            }
        });
    });
});
