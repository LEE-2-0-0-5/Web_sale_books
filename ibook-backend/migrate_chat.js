const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');

    // 1. Add Role column to NguoiDung
    const addRoleSql = "ALTER TABLE NguoiDung ADD COLUMN VaiTro ENUM('CUSTOMER', 'ADMIN', 'SUPPORT') DEFAULT 'CUSTOMER'";
    db.query(addRoleSql, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') console.log('Role column error:', err.message);
        else console.log('Role column check passed');

        // Set admin role for specific accounts (e.g., admin accounts if any, otherwise logic will be needed)
        // For now, let's assume we manually set existing admins or rely on a specific account
        // Let's create a Support User for testing: user 'support' pass '123'
        // And ensure 'admin' exists

        // 2. Create HoiThoai table
        const createConvSql = `
            CREATE TABLE IF NOT EXISTS HoiThoai (
                MaHoiThoai INT AUTO_INCREMENT PRIMARY KEY,
                MaNguoiDung VARCHAR(50),
                TrangThai ENUM('DaXuLy', 'ChuaXuLy') DEFAULT 'ChuaXuLy',
                NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
            )
        `;
        db.query(createConvSql, (err) => {
            if (err) throw err;
            console.log('HoiThoai table created');

            // 3. Create TinNhan table
            const createMsgSql = `
                CREATE TABLE IF NOT EXISTS TinNhan (
                    MaTinNhan INT AUTO_INCREMENT PRIMARY KEY,
                    MaHoiThoai INT,
                    NguoiGui VARCHAR(50), -- MaNguoiDung
                    NoiDung TEXT,
                    ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
                    DaXem BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (MaHoiThoai) REFERENCES HoiThoai(MaHoiThoai) ON DELETE CASCADE
                )
            `;
            db.query(createMsgSql, (err) => {
                if (err) throw err;
                console.log('TinNhan table created');
                process.exit();
            });
        });
    });
});
