const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "app.put('/api/admin/orders/:id/status', (req, res) => {";
const endMarker = "// Stats: Top Buyers";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find start or end marker');
    process.exit(1);
}

const newCode = `// Admin: Update Order Status
app.put('/api/admin/orders/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body; // e.g., 'DangXuLy', 'DangGiao', 'ThanhCong', 'DaHuy'

    db.query('UPDATE DonHang SET TrangThai = ? WHERE MaDonHang = ?', [status, orderId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json({ message: 'Cập nhật trạng thái thành công' });
    });
});

`;

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const newContent = before + newCode + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully replaced admin status endpoint');
