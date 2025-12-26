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
        // Add SoDu column if not exists
        `SELECT count(*) as count FROM information_schema.columns WHERE table_schema = 'ibook_db' AND table_name = 'KhachHang' AND column_name = 'SoDu'`,
        // Create GiaoDich table
        `CREATE TABLE IF NOT EXISTS GiaoDich (
            MaGiaoDich INT AUTO_INCREMENT PRIMARY KEY,
            MaKhachHang VARCHAR(50),
            LoaiGiaoDich VARCHAR(20), -- 'NapTien', 'ThanhToan', 'HoanTien'
            SoTien DECIMAL(15, 2),
            NoiDung TEXT,
            NgayGiaoDich DATETIME DEFAULT CURRENT_TIMESTAMP,
            TrangThai VARCHAR(20) DEFAULT 'ThanhCong',
            FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang) ON DELETE CASCADE
        )`
    ];

    // Check and add SoDu column
    db.query(queries[0], (err, results) => {
        if (err) console.error('Error checking SoDu column:', err);
        else if (results[0].count === 0) {
            db.query("ALTER TABLE KhachHang ADD COLUMN SoDu DECIMAL(15, 2) DEFAULT 0", (err) => {
                if (err) console.error('Error adding SoDu column:', err);
                else console.log('Added SoDu column to KhachHang');
            });
        } else {
            console.log('SoDu column already exists');
        }
    });

    // Create GiaoDich table
    db.query(queries[1], (err) => {
        if (err) console.error('Error creating GiaoDich table:', err);
        else console.log('GiaoDich table checked/created');

        // Add sample data if table was just created (or empty)
        db.query("SELECT COUNT(*) as count FROM GiaoDich", (err, results) => {
            if (!err && results[0].count === 0) {
                const sampleSql = `
                    INSERT INTO GiaoDich (MaKhachHang, LoaiGiaoDich, SoTien, NoiDung, NgayGiaoDich)
                    SELECT MaKhachHang, 'NapTien', 500000, 'Nạp tiền vào tài khoản', NOW()
                    FROM KhachHang LIMIT 1
                `;
                db.query(sampleSql, (err) => {
                    if (err) console.error('Error adding sample transaction:', err);
                    else console.log('Added sample transaction');

                    // Update balance for sample
                    db.query("UPDATE KhachHang SET SoDu = 500000 WHERE MaKhachHang = (SELECT MaKhachHang FROM GiaoDich LIMIT 1)", (err) => {
                        if (err) console.error('Error updating sample balance:', err);
                        else console.log('Updated sample balance');
                        process.exit();
                    });
                });
            } else {
                process.exit();
            }
        });
    });
});
