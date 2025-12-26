const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// Define Coupons
const couponsCode = `
// --- COUPONS ---
const COUPONS = [
    { code: '30THANGTU', type: 'percent', value: 0.34, description: 'Giảm 34% giá trị mọi quyển sách' },
    { code: 'NGUOIMOI', type: 'fixed', value: 30000, description: 'Giảm 100% phí giao hàng' }
];

app.get('/api/vouchers', (req, res) => {
    res.json(COUPONS);
});

app.post('/api/coupons/validate', (req, res) => {
    const { code, totalAmount } = req.body;
    const coupon = COUPONS.find(c => c.code === code);

    if (!coupon) {
        return res.status(404).json({ message: 'Mã giảm giá không tồn tại' });
    }

    let discount = 0;
    if (coupon.type === 'percent') {
        discount = totalAmount * coupon.value;
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
    }

    res.json({
        code: coupon.code,
        discount: discount,
        type: coupon.type,
        message: 'Áp dụng mã thành công'
    });
});
`;

// Insert before app.listen
const insertPos = content.lastIndexOf('app.listen');
const newContent = content.substring(0, insertPos) + couponsCode + '\n' + content.substring(insertPos);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Added Coupon endpoints to server.js');
