const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database');

    const sql = `
        CREATE TABLE IF NOT EXISTS TruyenGiamGia (
            MaGiamGia INT AUTO_INCREMENT PRIMARY KEY,
            MaTruyen VARCHAR(50) NOT NULL,
            PhanTramGiam INT NOT NULL CHECK (PhanTramGiam > 0 AND PhanTramGiam <= 100),
            FOREIGN KEY (MaTruyen) REFERENCES TruyenTranh(MaTruyen) ON DELETE CASCADE
        )
    `;

    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log('Table TruyenGiamGia created or already exists');

        // Insert sample data
        const insertSql = `
            INSERT INTO TruyenGiamGia (MaTruyen, PhanTramGiam)
            SELECT MaTruyen, ? FROM TruyenTranh WHERE TenSanPham LIKE ?
            ON DUPLICATE KEY UPDATE PhanTramGiam = VALUES(PhanTramGiam);
        `;

        // Helper to insert
        const insertDiscount = (percent, pattern) => {
            return new Promise((resolve, reject) => {
                db.query(insertSql, [percent, pattern], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        };

        Promise.all([
            insertDiscount(10, '%Dragon Ball%'),
            insertDiscount(20, '%Totoro%'),
            insertDiscount(20, '%Ghibli%'),
            insertDiscount(50, '%Conan%')
        ]).then(() => {
            console.log('Sample discounts inserted');
            process.exit();
        }).catch(err => {
            console.error('Error inserting discounts:', err);
            process.exit(1);
        });
    });
});
