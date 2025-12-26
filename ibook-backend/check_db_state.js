const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
    console.log('Connected to DB. Checking table counts...');

    const tables = [
        'NguoiDung', 'KhachHang', 'TheLoai', 'TruyenTranh',
        'DonHang', 'ChiTietDonHang', 'YeuThich', 'ThongBao',
        'GiaoDich', 'DieuKienApDung', 'PhieuGiamGia'
    ];

    let completed = 0;
    tables.forEach(table => {
        db.query(`SELECT COUNT(*) as count FROM ${table}`, (err, results) => {
            if (err) {
                if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.log(`${table}: TABLE NOT FOUND`);
                } else {
                    console.log(`${table}: Error - ${err.message}`);
                }
            } else {
                console.log(`${table}: ${results[0].count} rows`);
            }
            completed++;
            if (completed === tables.length) {
                db.end();
            }
        });
    });
});
