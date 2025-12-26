const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to DB');

    // 1. Create/Update ADMIN User
    const adminUser = {
        id: 'ADMIN01',
        username: 'khanh@gmail.com',
        password: '1',
        role: 'ADMIN',
        name: 'Super Admin'
    };

    const upsertUser = (u) => {
        return new Promise((resolve, reject) => {
            // Check if exists by username
            db.query('SELECT * FROM NguoiDung WHERE TaiKhoan = ?', [u.username], (err, results) => {
                if (err) return reject(err);

                if (results.length > 0) {
                    // Update
                    const sql = 'UPDATE NguoiDung SET MatKhau = ?, VaiTro = ? WHERE TaiKhoan = ?';
                    db.query(sql, [u.password, u.role, u.username], (err) => {
                        if (err) return reject(err);
                        console.log(`Updated user ${u.username} to ${u.role}`);
                        resolve();
                    });
                } else {
                    // Insert
                    const sql = 'INSERT INTO NguoiDung (MaNguoiDung, TaiKhoan, MatKhau, TrangThai, VaiTro) VALUES (?, ?, ?, 1, ?)';
                    db.query(sql, [u.id, u.username, u.password, u.role], (err) => {
                        if (err) return reject(err);
                        console.log(`Created user ${u.username} as ${u.role}`);

                        // Also create dummy customer record for name consistency if needed
                        db.query('INSERT IGNORE INTO KhachHang (MaNguoiDung, TenKhachHang, Email) VALUES (?, ?, ?)',
                            [u.id, u.name, u.username], (err) => {
                                if (err) console.log('Customer record linked (or ignored)');
                                resolve();
                            });
                    });
                }
            });
        });
    };

    // 2. Create/Update SUPPORT User
    const supportUser = {
        id: 'SUPPORT01',
        username: 'chat',
        password: '1',
        role: 'SUPPORT',
        name: 'Support Staff'
    };

    Promise.all([upsertUser(adminUser), upsertUser(supportUser)])
        .then(() => {
            console.log('All users processed successfully');
            process.exit();
        })
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
});
