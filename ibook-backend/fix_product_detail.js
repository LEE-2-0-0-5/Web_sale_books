const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "app.get('/api/products/:id', (req, res) => {";
const endMarker = "// Get User Profile";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find start or end marker');
    process.exit(1);
}

const newCode = `// Get product by ID
app.get('/api/products/:id', (req, res) => {
    const sql = \`
        SELECT t.*, l.TenTheLoai,
        (SELECT IFNULL(SUM(ct.SoLuong), 0) FROM ChiTietDonHang ct JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang WHERE ct.MaTruyen = t.MaTruyen AND dh.TrangThai = 'ThanhCong') as SoLuongDaBan
        FROM TruyenTranh t LEFT JOIN TheLoai l ON t.TLID = l.TLID 
        WHERE t.MaTruyen = ?
    \`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            res.status(500).json({ message: 'Server error' });
            return;
        }
        if (results.length > 0) {
            const p = results[0];
            let image = '';
            try {
                const images = JSON.parse(p.AnhBia);
                image = Array.isArray(images) ? images[0] : images;
            } catch (e) {
                image = p.AnhBia;
            }

            const product = {
                ...p,
                id: p.MaTruyen,
                title: p.TenSanPham,
                price: p.GiaBan,
                image: image,
                description: p.MoTa,
                author: p.TacGia,
                genre: p.TenTheLoai,
                rating: 5, // Mock
                reviewCount: 0, // Mock
                stock: p.TonKho,
                sold: Number(p.SoLuongDaBan) || 0
            };
            console.log(\`[DEBUG] Product Detail \${p.MaTruyen}: Sold=\${product.sold}\`);
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    });
});

`;

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const newContent = before + newCode + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully replaced product detail endpoint');
