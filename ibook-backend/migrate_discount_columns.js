const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(async (err) => {
    if (err) throw err;
    console.log('Connected to database');

    const runQuery = (sql) => {
        return new Promise((resolve, reject) => {
            db.query(sql, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    };

    try {
        // 1. Add columns isGiamGia and PhanTramGiam if not existing
        // We use a safe approach by checking or just ALTER IGNORE logic usually, but here distinct queries are safer.
        console.log("Checking/Adding columns...");

        // Add isGiamGia
        try {
            await runQuery("ALTER TABLE TruyenTranh ADD COLUMN isGiamGia TINYINT DEFAULT 0");
            console.log("Added isGiamGia column");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("isGiamGia already exists");
            else throw e;
        }

        // Add PhanTramGiam
        try {
            await runQuery("ALTER TABLE TruyenTranh ADD COLUMN PhanTramGiam INT DEFAULT 0");
            console.log("Added PhanTramGiam column");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("PhanTramGiam already exists");
            else throw e;
        }

        // 2. Populate sample data
        console.log("Populating sample discount data...");
        await runQuery("UPDATE TruyenTranh SET isGiamGia = 0, PhanTramGiam = 0"); // Reset first

        await runQuery("UPDATE TruyenTranh SET isGiamGia = 1, PhanTramGiam = 10 WHERE TenSanPham LIKE '%Dragon Ball%'");
        await runQuery("UPDATE TruyenTranh SET isGiamGia = 1, PhanTramGiam = 20 WHERE TenSanPham LIKE '%Totoro%' OR TenSanPham LIKE '%Ghibli%'");
        await runQuery("UPDATE TruyenTranh SET isGiamGia = 1, PhanTramGiam = 50 WHERE TenSanPham LIKE '%Conan%'");

        // 3. Drop old table if exists
        try {
            await runQuery("DROP TABLE IF EXISTS TruyenGiamGia");
            console.log("Dropped old TruyenGiamGia table");
        } catch (e) {
            console.log("Error dropping table (might not exist):", e.message);
        }

        console.log("Migration completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
});
