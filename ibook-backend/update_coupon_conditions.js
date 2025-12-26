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

    // 1. Add DieuKien (JSON) column to GiamGia
    const addColSql = "ALTER TABLE GiamGia ADD COLUMN DieuKien JSON DEFAULT NULL";

    db.query(addColSql, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.log('Column DieuKien might already exist or error:', err.message);
        } else {
            console.log('Column DieuKien added/ensured.');
        }

        // 2. Create GiamGia_KhachHang table (User Wallet)
        // Tracks which user has saved/used which coupon
        const createWalletSql = `
            CREATE TABLE IF NOT EXISTS GiamGia_KhachHang (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                MaGiamGia VARCHAR(50),
                MaKhachHang VARCHAR(50),
                TrangThai VARCHAR(20) DEFAULT 'ChuaDung', -- 'ChuaDung', 'DaDung'
                NgayLuu DATETIME DEFAULT CURRENT_TIMESTAMP,
                NgaySuDung DATETIME,
                FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang) ON DELETE CASCADE,
                FOREIGN KEY (MaGiamGia) REFERENCES GiamGia(MaGiamGia) ON DELETE CASCADE,
                UNIQUE(MaGiamGia, MaKhachHang)
            )
        `;

        db.query(createWalletSql, (err) => {
            if (err) console.error('Failed to create GiamGia_KhachHang:', err);
            else console.log('Table GiamGia_KhachHang (User Storage) created.');

            // Seed a complex coupon check
            // Example: 83% off for Female on 8/3
            // Condition JSON: { "gender": "Nu", "month": 3, "day": 8 }
            const seedSql = `
                INSERT IGNORE INTO GiamGia (MaGiamGia, PhanTramGiam, NgayBatDau, NgayHetHan, SoLuong, MoTa, DieuKien)
                VALUES (
                    'WOMEN83', 
                    83, 
                    '2025-03-01', 
                    '2025-03-10', 
                    100, 
                    'Mừng 8/3 giảm 83% cho phái nữ', 
                    '{"gioiTinh": "Nữ", "thang": 3, "ngay": 8}'
                )
            `;
            db.query(seedSql, (err) => {
                if (err) console.log("Seeding failed (might exist):", err.message);
                else console.log("Seeded WOMEN83 coupon.");
                db.end();
            });
        });
    });
});
