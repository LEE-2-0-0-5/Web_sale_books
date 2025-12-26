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

    // 1. Create GiamGia table
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS GiamGia (
            MaGiamGia VARCHAR(50) PRIMARY KEY,
            PhanTramGiam INT NOT NULL,
            NgayHetHan DATE NOT NULL,
            SoLuong INT DEFAULT 0,
            MoTa TEXT
        )
    `;

    db.query(createTableSql, (err) => {
        if (err) {
            console.error('Failed to create GiamGia table:', err);
        } else {
            console.log('Table GiamGia ensured.');

            // 2. See Data
            const seedingSql = `
                INSERT IGNORE INTO GiamGia (MaGiamGia, PhanTramGiam, NgayHetHan, SoLuong, MoTa) VALUES 
                ('WELCOME20', 20, '2025-12-31', 100, 'Giảm 20% cho đơn đầu tiên'),
                ('IBOOK50', 50, '2025-06-30', 10, 'Siêu giảm giá 50%'),
                ('FREESHIP', 100, '2024-12-31', 50, 'Mã miễn phí vận chuyển (Test)')
            `;
            db.query(seedingSql, (err) => {
                if (err) console.error('Seeding failed:', err);
                else console.log('GiamGia seeded.');
            });
        }
    });

    // 3. Check Customers
    db.query("SELECT * FROM KhachHang", (err, results) => {
        if (err) console.error(err);
        else {
            console.log(`Found ${results.length} customers.`);
            if (results.length === 0) {
                console.log('Injecting dummy customer...');
                const dummySql = `
                    INSERT IGNORE INTO KhachHang (MaKhachHang, HoTen, Email, SoDienThoai, SoDu, MaNguoiDung)
                    VALUES ('KH_DEMO', 'Nguyen Van A', 'demo@gmail.com', '0912345678', 500000, 'ND_DEMO')
                `;
                // Note: Needs NguoiDung first usually, but let's try.
                // Actually logic in server.js implies Foreign Key.
                const dummyUser = "INSERT IGNORE INTO NguoiDung (MaNguoiDung, TaiKhoan, MatKhau, TrangThai) VALUES ('ND_DEMO', 'demo@gmail.com', '123', 1)";

                db.query(dummyUser, (err) => {
                    if (!err) db.query(dummySql);
                });
            }
        }
        db.end();
    });
});
