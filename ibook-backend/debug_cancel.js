const axios = require('axios');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db'
});

async function testCancel() {
    // 1. Find a success candidate
    db.connect();
    db.query("SELECT MaDonHang FROM DonHang WHERE TrangThai = 'ChoXuLy' LIMIT 1", async (err, results) => {
        if (err) {
            console.error('DB Error:', err);
            process.exit(1);
        }
        if (results.length === 0) {
            console.log('No pending orders found to test cancellation.');
            process.exit(0);
        }

        const orderId = results[0].MaDonHang;
        console.log(`Testing cancellation for Order ID: ${orderId}`);

        try {
            const response = await axios.put(`http://localhost:3000/api/orders/${orderId}/cancel`, {
                reason: 'Test cancel script'
            });
            console.log('Success:', response.data);
        } catch (error) {
            console.error('API Fail:', error.response ? error.response.data : error.message);
        }
        db.end();
    });
}

testCancel();
