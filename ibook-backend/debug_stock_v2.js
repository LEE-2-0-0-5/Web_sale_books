const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(err => {
    if (err) {
        console.error('Connection Failed:', err);
        process.exit(1);
    }

    console.log('--- Checking Orders and Sold Counts ---');

    // 1. Show all orders with their status
    db.query("SELECT MaDonHang, TrangThai, NgayTao FROM DonHang ORDER BY NgayTao DESC LIMIT 10", (err, orders) => {
        console.table(orders);

        // 2. Show details for these orders
        db.query("SELECT ct.MaDonHang, ct.MaTruyen, ct.SoLuong, dh.TrangThai FROM ChiTietDonHang ct JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang ORDER BY dh.NgayTao DESC LIMIT 10", (err, details) => {
            console.table(details);

            // 3. Show Calculated Sold Count for TT01 (Conan 3? need to verify ID) and others
            // Using the EXACT query from server.js
            const sql = `
                SELECT t.MaTruyen, t.TenSanPham,
                (SELECT IFNULL(SUM(ct.SoLuong), 0) FROM ChiTietDonHang ct JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang WHERE ct.MaTruyen = t.MaTruyen AND dh.TrangThai = 'ThanhCong') as SoLuongDaBan_ServerLogic_ThanhCong,
                (SELECT IFNULL(SUM(ct.SoLuong), 0) FROM ChiTietDonHang ct JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang WHERE ct.MaTruyen = t.MaTruyen AND dh.TrangThai != 'DaHuy') as SoLuongDaBan_OldLogic_NotCancelled
                FROM TruyenTranh t
                WHERE t.MaTruyen IN ('TT01', 'TT04')
            `;

            db.query(sql, (err, products) => {
                console.table(products);
                db.end();
            });
        });
    });
});
