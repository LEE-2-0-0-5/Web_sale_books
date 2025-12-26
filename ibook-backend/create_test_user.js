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

    const userSql = "INSERT IGNORE INTO NguoiDung (MaNguoiDung, TaiKhoan, MatKhau, TrangThai) VALUES ('USER_TEST', 'testuser', '1', TRUE)";
    const customerSql = "INSERT IGNORE INTO KhachHang (MaKhachHang, HoTen, Email, SoDu, MaNguoiDung) VALUES ('KH_TEST', 'Khách Hàng Test', 'test@ibook.com', 10000000, 'USER_TEST')";

    db.query(userSql, (err) => {
        if (err) console.error('Error creating test user:', err);
        else console.log('Test user created (or already exists)');

        db.query(customerSql, (err) => {
            if (err) console.error('Error creating test customer:', err);
            else console.log('Test customer created (or already exists) with 10,000,000 VND balance');
            process.exit();
        });
    });
});
