const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected');

    // 1. Alter table to allow 'CHAT' or just make it VARCHAR
    const alterSql = "ALTER TABLE NguoiDung MODIFY COLUMN VaiTro VARCHAR(50) DEFAULT 'CUSTOMER'";

    db.query(alterSql, (err) => {
        if (err) {
            console.error('Error modifying column:', err);
        } else {
            console.log('Column VaiTro modified to VARCHAR(50)');
        }

        // 2. Update user 'chat' to have role 'CHAT'
        const updateSql = "UPDATE NguoiDung SET VaiTro = 'CHAT' WHERE TaiKhoan = 'chat'";
        db.query(updateSql, (err, result) => {
            if (err) console.error(err);
            else console.log('Updated user "chat" role to CHAT');
            process.exit();
        });
    });
});
