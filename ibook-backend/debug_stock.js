const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection Failed:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    // 1. Check Orders
    db.query('SELECT MaDonHang, TrangThai FROM DonHang LIMIT 5', (err, orders) => {
        console.log('--- Orders ---');
        console.table(orders);

        // 2. Check Details
        db.query('SELECT * FROM ChiTietDonHang LIMIT 5', (err, details) => {
            console.log('--- Order Details ---');
            console.table(details);

            // 3. Check Product Sold Count Query
            const sql = `
                SELECT t.MaTruyen, t.TenSanPham,
                (SELECT IFNULL(SUM(ct.SoLuong), 0) 
                 FROM ChiTietDonHang ct 
                 JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang 
                 WHERE ct.MaTruyen = t.MaTruyen AND dh.TrangThai != 'DaHuy') as SoLuongDaBan
                FROM TruyenTranh t
                LIMIT 5
            `;
            db.query(sql, (err, products) => {
                console.log('--- Products Sold Count Calculation ---');
                console.table(products);
                db.end();
            });
        });
    });
});
