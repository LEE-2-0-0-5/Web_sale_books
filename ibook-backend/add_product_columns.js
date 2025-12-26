const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

db.connect(err => {
    if (err) {
        console.error('Connect failed:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    const alterations = [
        "ALTER TABLE TruyenTranh ADD COLUMN NhaXuatBan VARCHAR(100)",
        "ALTER TABLE TruyenTranh ADD COLUMN NgayXuatBan DATE"
    ];

    let completed = 0;
    alterations.forEach(sql => {
        db.query(sql, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else {
                    console.error('Error altering table:', err);
                }
            } else {
                console.log('Success:', sql);
            }
            completed++;
            if (completed === alterations.length) {
                console.log('Done');
                process.exit(0);
            }
        });
    });
});
