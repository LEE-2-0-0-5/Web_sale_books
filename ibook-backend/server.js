const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Test route
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ibook_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Auto-migration: Add columns if not exists
const migrateDatabase = () => {
    const migrations = [
        { table: 'KhachHang', column: 'AnhDaiDien', type: 'TEXT' },
        { table: 'KhachHang', column: 'Email', type: 'VARCHAR(100)' },
        { table: 'DonHang', column: 'GhiChu', type: 'TEXT' },
        { table: 'TruyenTranh', column: 'NhaXuatBan', type: 'VARCHAR(100)' },
        { table: 'TruyenTranh', column: 'NgayXuatBan', type: 'DATE' },
        { table: 'DonHang', column: 'MaPGG_ID', type: 'VARCHAR(50)' },
        // MoTa exists? Ensure it.
    ];

    migrations.forEach(m => {
        const sql = `SHOW COLUMNS FROM ${m.table} LIKE '${m.column}'`;
        db.query(sql, (err, results) => {
            if (err) return console.error(`Migration check failed for ${m.column} in ${m.table}:`, err);
            if (results.length === 0) {
                const alterSql = `ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`;
                db.query(alterSql, (err) => {
                    if (err) console.error(`Migration failed for ${m.column}:`, err);
                    else console.log(`Migrated: Added ${m.column} column to ${m.table}`);
                });
            }
        });
    });
};

// Email Transporter Configuration (Placeholders)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hethongibook@gmail.com', // Replace with your email
        pass: 'zdib gqby uyvt dgtj'     // Replace with your Google App Password
    },
    tls: {
        rejectUnauthorized: false
    }
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');

    // Create OTPs table if not exists
    connection.query(`
        CREATE TABLE IF NOT EXISTS OTPs (
            email VARCHAR(100) NOT NULL,
            code VARCHAR(10),
            expires_at TIMESTAMP,
            PRIMARY KEY (email)
        )
    `, (e) => {
        if (e) console.error("Error creating OTP table", e);
    });

    // Create SystemSettings table if not exists
    connection.query(`
        CREATE TABLE IF NOT EXISTS SystemSettings (
            setting_key VARCHAR(50) PRIMARY KEY,
            setting_value VARCHAR(255)
        )
    `, (e) => {
        if (e) console.error("Error creating SystemSettings table", e);
        else {
            // Insert default if not exists
            connection.query(`INSERT IGNORE INTO SystemSettings (setting_key, setting_value) VALUES ('snow_effect', 'false')`);
        }
    });

    migrateDatabase();
    connection.release();
});

// --- SETTINGS API ---
app.get('/api/settings', (req, res) => {
    db.query('SELECT * FROM SystemSettings', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const settings = {};
        results.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    db.query('INSERT INTO SystemSettings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)], (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ success: true });
        });
});

// Helper to generate IDs
const generateId = (prefix) => {
    return prefix + Math.floor(Math.random() * 1000000);
};

// Get all products (TruyenTranh)
app.get('/api/products', (req, res) => {
    const sql = `
        SELECT t.*, l.TenTheLoai,
        (SELECT IFNULL(SUM(ct.SoLuong), 0) FROM ChiTietDonHang ct JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang WHERE ct.MaTruyen = t.MaTruyen AND dh.TrangThai = 'ThanhCong') as SoLuongDaBan
        FROM TruyenTranh t 
        LEFT JOIN TheLoai l ON t.TLID = l.TLID
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            res.status(500).json({ message: 'Server error' });
            return;
        }
        const products = results.map(p => {
            let image = '';
            try {
                const images = JSON.parse(p.AnhBia);
                image = Array.isArray(images) ? images[0] : images;
            } catch (e) {
                image = p.AnhBia;
            }

            const discount = p.isGiamGia ? p.PhanTramGiam : 0;
            const finalPrice = discount > 0 ? p.GiaBan * (100 - discount) / 100 : p.GiaBan;

            return {
                ...p,
                id: p.MaTruyen,
                title: p.TenSanPham,
                price: finalPrice,
                originalPrice: p.GiaBan,
                discount: discount,
                stock: p.TonKho,
                sold: parseInt(p.SoLuongDaBan) || 0,
                image: image,
                description: p.MoTa,
                author: p.TacGia,
                genre: p.TenTheLoai,
                publisher: p.NhaXuatBan,
                publishDate: p.NgayXuatBan
            };
        });
        res.json(products);
    });
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
    const sql = `
        SELECT t.*, l.TenTheLoai,
        (SELECT IFNULL(SUM(ct.SoLuong), 0) FROM ChiTietDonHang ct JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang WHERE ct.MaTruyen = t.MaTruyen AND dh.TrangThai = 'ThanhCong') as SoLuongDaBan
        FROM TruyenTranh t LEFT JOIN TheLoai l ON t.TLID = l.TLID 
        WHERE t.MaTruyen = ?
    `;
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

            const discount = p.isGiamGia ? p.PhanTramGiam : 0;
            const finalPrice = discount > 0 ? p.GiaBan * (100 - discount) / 100 : p.GiaBan;

            const product = {
                ...p,
                id: p.MaTruyen,
                title: p.TenSanPham,
                price: finalPrice,
                originalPrice: p.GiaBan,
                discount: discount,
                image: image,
                description: p.MoTa,
                author: p.TacGia,
                genre: p.TenTheLoai,
                rating: 5,
                reviewCount: 0,
                stock: p.TonKho,
                sold: Number(p.SoLuongDaBan) || 0,
                publisher: p.NhaXuatBan,
                publishDate: p.NgayXuatBan
            };
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    });
});

// Create Product (Auto ID)
app.post('/api/products', (req, res) => {
    const { title, author, price, stock, categoryId, publisher, description, image, isGiamGia, PhanTramGiam } = req.body;

    if (!title || !price) return res.status(400).json({ message: 'Missing required fields' });

    // Generate ID: Get Max TTxx
    db.query("SELECT MaTruyen FROM TruyenTranh WHERE MaTruyen LIKE 'TT%' ORDER BY LENGTH(MaTruyen) DESC, MaTruyen DESC LIMIT 1", (err, results) => {
        if (err) return res.status(500).json({ message: 'ID Generation Failed' });

        let newId = 'TT01';
        if (results.length > 0) {
            const lastId = results[0].MaTruyen;
            const matches = lastId.match(/(\d+)$/);
            if (matches) {
                const num = parseInt(matches[0]) + 1;
                newId = 'TT' + num.toString().padStart(2, '0');
            }
        }

        const anhBia = JSON.stringify([image || '/assets/default_book.jpg']);
        const sql = `
            INSERT INTO TruyenTranh (MaTruyen, TenSanPham, TacGia, GiaBan, TonKho, TLID, NhaXuatBan, MoTa, AnhBia, isGiamGia, PhanTramGiam)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [newId, title, author, price, stock || 0, categoryId || 1, publisher, description, anhBia, isGiamGia || 0, PhanTramGiam || 0], (err) => {
            if (err) {
                console.error('Create product Error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            res.json({ message: 'Thêm sản phẩm thành công', id: newId });
        });
    });
});

// Update Product
app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const { title, author, price, stock, categoryId, publisher, description, image, isGiamGia, PhanTramGiam } = req.body;

    let sql = `UPDATE TruyenTranh SET TenSanPham=?, TacGia=?, GiaBan=?, TonKho=?, TLID=?, NhaXuatBan=?, MoTa=?, isGiamGia=?, PhanTramGiam=?`;
    const params = [title, author, price, stock, categoryId, publisher, description, isGiamGia || 0, PhanTramGiam || 0];

    if (image) {
        sql += `, AnhBia=?`;
        params.push(JSON.stringify([image]));
    }
    sql += ` WHERE MaTruyen=?`;
    params.push(id);

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ message: 'Update failed', error: err });
        res.json({ message: 'Cập nhật thành công' });
    });
});

// Delete Product
app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM TruyenTranh WHERE MaTruyen = ?', [req.params.id], (err) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: 'Không thể xóa sản phẩm đã có đơn hàng' });
            }
            return res.status(500).json({ message: 'Delete failed', error: err });
        }
        res.json({ message: 'Xóa thành công' });
    });
});

// Get User Profile
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    const sql = `
        SELECT nd.TaiKhoan, kh.*,
               (SELECT COUNT(*) FROM DonHang WHERE MaKhachHang = kh.MaKhachHang AND (TrangThai = 'ThanhCong' OR TrangThai = 'DangGiao')) as RealOrdersCount,
               (SELECT IFNULL(SUM(TongTien), 0) FROM DonHang WHERE MaKhachHang = kh.MaKhachHang AND TrangThai = 'ThanhCong') as RealTotalSpent
        FROM NguoiDung nd 
        LEFT JOIN KhachHang kh ON nd.MaNguoiDung = kh.MaNguoiDung 
        WHERE nd.MaNguoiDung = ?
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        res.json({
            id: user.MaNguoiDung,
            username: user.TaiKhoan,
            name: user.HoTen,
            email: user.Email || user.TaiKhoan,
            phone: user.SoDienThoai,
            address: user.DiaChi,
            gender: user.GioiTinh,
            dob: user.NgaySinh,
            avatar: user.AnhDaiDien,
            rank: user.HangKhachHang,
            ordersCount: user.RealOrdersCount,
            totalSpent: user.RealTotalSpent,
            balance: user.SoDu || 0
        });
    });
});

// Update User Profile
app.put('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    const { name, phone, address, gender, dob, avatar, email } = req.body;
    const sql = `
        UPDATE KhachHang 
        SET HoTen = ?, SoDienThoai = ?, DiaChi = ?, GioiTinh = ?, NgaySinh = ?, AnhDaiDien = ?, Email = ?
        WHERE MaNguoiDung = ?
    `;
    db.query(sql, [name, phone, address, gender, dob || null, avatar, email, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Update failed', error: err.message });
        res.json({ message: 'Cập nhật thành công', user: req.body });
    });
});

// Register
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    db.query('SELECT * FROM NguoiDung WHERE TaiKhoan = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length > 0) return res.status(400).json({ message: 'Email/Tài khoản đã tồn tại' });

        const userId = generateId('ND');
        const customerId = generateId('KH');

        db.getConnection((err, conn) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            conn.beginTransaction((err) => {
                if (err) { conn.release(); return res.status(500).json({ message: 'Transaction error' }); }
                conn.query('INSERT INTO NguoiDung (MaNguoiDung, TaiKhoan, MatKhau, TrangThai) VALUES (?, ?, ?, 1)', [userId, email, password], (err) => {
                    if (err) return conn.rollback(() => { conn.release(); res.status(500).json({ message: 'Error creating user' }); });

                    const customerSql = 'INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, Email, MaNguoiDung) VALUES (?, ?, ?, ?, ?)';
                    const isPhone = /^[0-9]+$/.test(email);
                    conn.query(customerSql, [customerId, name, isPhone ? email : '', isPhone ? '' : email, userId], (err) => {
                        if (err) return conn.rollback(() => { conn.release(); res.status(500).json({ message: 'Error creating customer' }); });
                        conn.commit((err) => {
                            if (err) return conn.rollback(() => { conn.release(); res.status(500).json({ message: 'Commit error' }); });
                            res.json({ message: 'Đăng ký thành công', userId: userId });
                            conn.release();
                        });
                    });
                });
            });
        });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT nd.*, kh.HoTen FROM NguoiDung nd LEFT JOIN KhachHang kh ON nd.MaNguoiDung = kh.MaNguoiDung WHERE nd.TaiKhoan = ? AND nd.MatKhau = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (results.length > 0) {
            const user = results[0];

            if (user.TrangThai !== 1) {
                return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
            }

            res.json({
                message: 'Đăng nhập thành công',
                user: {
                    id: user.MaNguoiDung,
                    name: user.HoTen || user.TaiKhoan,
                    email: user.TaiKhoan,
                    role: user.VaiTro || 'CUSTOMER' // Return Role
                }
            });
        } else {
            res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
        }
    });
});

// Change Password
app.post('/api/user/:id/password', (req, res) => {
    const userId = req.params.id;
    const { oldPassword, newPassword } = req.body;
    db.query('SELECT MatKhau FROM NguoiDung WHERE MaNguoiDung = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });
        if (results[0].MatKhau !== oldPassword) return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });

        db.query('UPDATE NguoiDung SET MatKhau = ? WHERE MaNguoiDung = ?', [newPassword, userId], (err) => {
            if (err) return res.status(500).json({ message: 'Update failed' });
            res.json({ message: 'Đổi mật khẩu thành công' });
        });
    });
});

// Forgot Password - Send OTP
app.post('/api/forgot-password/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    // Check if user exists (by Email or TaiKhoan - assuming generic lookup)
    // Note: Our schema has Email in KhachHang or TaiKhoan (which is email usually) in NguoiDung
    const checkUserSql = `
        SELECT nd.TaiKhoan, kh.Email 
        FROM NguoiDung nd 
        LEFT JOIN KhachHang kh ON nd.MaNguoiDung = kh.MaNguoiDung 
        WHERE nd.TaiKhoan = ? OR kh.Email = ?
    `;
    db.query(checkUserSql, [email, email], (err, results) => {
        if (err) return res.status(500).json({ message: 'DB Error' });
        if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này' });

        const targetEmail = results[0].Email || results[0].TaiKhoan; // Prefer Customer Email
        // If targetEmail is not an actual email (e.g. phone), this will fail sending, but logic stands.

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

        // Save OTP
        // Using ON DUPLICATE KEY UPDATE
        const saveOtpSql = "INSERT INTO OTPs (email, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code=?, expires_at=?";
        db.query(saveOtpSql, [email, otp, expiresAt, otp, expiresAt], (err) => {
            if (err) return res.status(500).json({ message: 'Error saving OTP' });

            // Send Email
            if (!targetEmail || !targetEmail.includes('@')) {
                // Mock send for non-email usernames
                console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
                return res.json({ message: 'OTP generated (Console Logged because no valid email)' });
            }

            const mailOptions = {
                from: 'ibook.notify@gmail.com',
                to: targetEmail,
                subject: 'Mã xác thực quên mật khẩu - Ibook',
                text: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending email:', error);
                    // Return 500 so frontend knows it failed
                    return res.status(500).json({
                        message: 'Gửi email thất bại. Hãy chắc chắn bạn đã dùng "Mật khẩu ứng dụng" (App Password) thay vì mật khẩu thường.',
                        debugOtp: otp, // For testing purposes
                        error: error.message
                    });
                }
                console.log('Email sent: ' + info.response);
                res.json({ message: 'Đã gửi mã OTP qua email' });
            });
        });
    });
});

// Forgot Password - Verify OTP
app.post('/api/forgot-password/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    db.query('SELECT * FROM OTPs WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'DB Error' });
        if (results.length === 0) return res.status(400).json({ message: 'Yêu cầu OTP trước' });

        const record = results[0];
        if (record.code !== otp) return res.status(400).json({ message: 'Mã OTP không đúng' });
        if (new Date() > new Date(record.expires_at)) return res.status(400).json({ message: 'Mã OTP đã hết hạn' });

        res.json({ message: 'Xác thực thành công' });
    });
});

// Forgot Password - Reset Password
app.post('/api/forgot-password/reset', (req, res) => {
    const { email, otp, newPassword } = req.body;

    // Validate OTP again securely
    db.query('SELECT * FROM OTPs WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0 || results[0].code !== otp) return res.status(400).json({ message: 'Invalid Request' });

        // Update password
        // Identify User ID from Email
        const userSql = "SELECT nd.MaNguoiDung FROM NguoiDung nd LEFT JOIN KhachHang kh ON nd.MaNguoiDung = kh.MaNguoiDung WHERE nd.TaiKhoan = ? OR kh.Email = ?";
        db.query(userSql, [email, email], (err, users) => {
            if (users.length === 0) return res.status(404).json({ message: 'User not found' });
            const userId = users[0].MaNguoiDung;

            db.query('UPDATE NguoiDung SET MatKhau = ? WHERE MaNguoiDung = ?', [newPassword, userId], (err) => {
                if (err) return res.status(500).json({ message: 'Update failed' });

                // Clear OTP
                db.query('DELETE FROM OTPs WHERE email = ?', [email]);
                res.json({ message: 'Đặt lại mật khẩu thành công' });
            });
        });
    });
});

// --- CHAT SYSTEM APIs ---

// Get active conversation for a user
app.get('/api/chat/active/:userId', (req, res) => {
    const sql = 'SELECT * FROM HoiThoai WHERE MaNguoiDung = ? ORDER BY NgayTao DESC LIMIT 1';
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results.length > 0 ? results[0] : null);
    });
});

// Get messages for a conversation
app.get('/api/chat/messages/:convId', (req, res) => {
    const sql = 'SELECT * FROM TinNhan WHERE MaHoiThoai = ? ORDER BY ThoiGian ASC';
    db.query(sql, [req.params.convId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Send a message
app.post('/api/chat/send', (req, res) => {
    const { userId, role, content, conversationId } = req.body; // userId is sender's ID

    const saveMessage = (convId) => {
        const sql = 'INSERT INTO TinNhan (MaHoiThoai, NguoiGui, NoiDung) VALUES (?, ?, ?)';
        db.query(sql, [convId, userId, content], (err) => {
            if (err) return res.status(500).json(err);

            // Mark conversation as needing attention if sent by customer, or handled if by support
            if (role === 'CUSTOMER') {
                db.query("UPDATE HoiThoai SET TrangThai='ChuaXuLy' WHERE MaHoiThoai=?", [convId]);
            }
            res.json({ message: 'Sent', conversationId: convId });
        });
    };

    if (conversationId) {
        saveMessage(conversationId);
    } else {
        // Create new conversation if customer sending first message
        db.query("INSERT INTO HoiThoai (MaNguoiDung, TrangThai) VALUES (?, 'ChuaXuLy')", [userId], (err, result) => {
            if (err) return res.status(500).json(err);
            saveMessage(result.insertId);
        });
    }
});

// Admin: Get all conversations
app.get('/api/admin/chat/conversations', (req, res) => {
    const sql = `
        SELECT ht.*, kh.HoTen, kh.AnhDaiDien,
        (SELECT NoiDung FROM TinNhan WHERE MaHoiThoai = ht.MaHoiThoai ORDER BY ThoiGian DESC LIMIT 1) as LastMessage,
        (SELECT ThoiGian FROM TinNhan WHERE MaHoiThoai = ht.MaHoiThoai ORDER BY ThoiGian DESC LIMIT 1) as LastTime
        FROM HoiThoai ht
        JOIN NguoiDung nd ON ht.MaNguoiDung = nd.MaNguoiDung
        LEFT JOIN KhachHang kh ON nd.MaNguoiDung = kh.MaNguoiDung
        ORDER BY LastTime DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get User Orders
app.get('/api/user/:id/orders', (req, res) => {
    const userId = req.params.id;
    const sql = `
        SELECT dh.MaDonHang, dh.NgayTao, dh.TongTien, dh.TrangThai, 
               ct.MaTruyen, tt.TenSanPham, tt.AnhBia, ct.SoLuong, ct.DonGia
        FROM DonHang dh
        JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
        JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
        JOIN TruyenTranh tt ON ct.MaTruyen = tt.MaTruyen
        WHERE kh.MaNguoiDung = ?
        ORDER BY dh.NgayTao DESC
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        const orders = {};
        results.forEach(row => {
            if (!orders[row.MaDonHang]) orders[row.MaDonHang] = { id: row.MaDonHang, date: row.NgayTao, total: row.TongTien, status: row.TrangThai, items: [] };
            let image = row.AnhBia;
            try { image = JSON.parse(row.AnhBia)[0] || row.AnhBia; } catch (e) { }
            orders[row.MaDonHang].items.push({ productId: row.MaTruyen, name: row.TenSanPham, image, quantity: row.SoLuong, price: row.DonGia });
        });
        res.json(Object.values(orders));
    });
});

// Get Favorites
app.get('/api/user/:id/favorites', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT tt.* FROM YeuThich yt JOIN KhachHang kh ON yt.MaKhachHang = kh.MaKhachHang JOIN TruyenTranh tt ON yt.MaTruyen = tt.MaTruyen WHERE kh.MaNguoiDung = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        const products = results.map(p => {
            let image = p.AnhBia;
            try { image = JSON.parse(p.AnhBia)[0] || p.AnhBia; } catch (e) { }
            return { id: p.MaTruyen, title: p.TenSanPham, price: p.GiaBan, image };
        });
        res.json(products);
    });
});

// Add Favorite
app.post('/api/user/:id/favorites', (req, res) => {
    const userId = req.params.id;
    const { productId } = req.body;
    db.query('SELECT MaKhachHang FROM KhachHang WHERE MaNguoiDung = ?', [userId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'User not found' });
        db.query('INSERT INTO YeuThich (MaKhachHang, MaTruyen) VALUES (?, ?)', [results[0].MaKhachHang, productId], (err) => {
            if (err && err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Đã có trong yêu thích' });
            if (err) return res.status(500).json({ message: 'Error' });
            res.json({ message: 'Đã thêm' });
        });
    });
});

// Get Notifications
app.get('/api/user/:id/notifications', (req, res) => {
    db.query('SELECT * FROM ThongBao WHERE MaNguoiDung = ? ORDER BY NgayTao DESC', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(results);
    });
});

// Deposit
app.post('/api/user/:id/deposit', (req, res) => {
    const { amount, content } = req.body;
    db.query('SELECT MaKhachHang, SoDu FROM KhachHang WHERE MaNguoiDung = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'User not found' });
        const customer = results[0];
        const newBalance = (parseFloat(customer.SoDu) || 0) + parseFloat(amount);

        db.getConnection((err, conn) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            conn.beginTransaction(err => {
                if (err) { conn.release(); return res.status(500).json({ message: 'Trans error' }); }
                conn.query('INSERT INTO GiaoDich (MaKhachHang, LoaiGiaoDich, SoTien, NoiDung, TrangThai) VALUES (?, "NapTien", ?, ?, "ThanhCong")', [customer.MaKhachHang, amount, content || 'Nạp tiền'], err => {
                    if (err) return conn.rollback(() => { conn.release(); res.status(500).end(); });
                    conn.query('UPDATE KhachHang SET SoDu = ? WHERE MaKhachHang = ?', [newBalance, customer.MaKhachHang], err => {
                        if (err) return conn.rollback(() => { conn.release(); res.status(500).end(); });
                        conn.commit(err => {
                            if (err) return conn.rollback(() => { conn.release(); res.status(500).end(); });
                            res.json({ message: 'Nạp tiền thành công', newBalance });
                            conn.release();
                        });
                    });
                });
            });
        });
    });
});

// Webhook
app.post('/api/payment-webhook', (req, res) => {
    let transactions = [];
    if (req.body.transferAmount) transactions.push({ description: req.body.content, amount: req.body.transferAmount });
    else if (Array.isArray(req.body.data)) transactions = req.body.data;
    else return res.status(400).json({ message: 'Invalid format' });

    transactions.forEach(trans => {
        const match = trans.description.match(/IBOOK\s+NAP\s+(\w+)/i);
        if (match && match[1]) {
            const userId = match[1];
            db.query('SELECT MaKhachHang, SoDu FROM KhachHang WHERE MaNguoiDung = ?', [userId], (err, results) => {
                if (!err && results.length > 0) {
                    const cust = results[0];
                    const newBal = (parseFloat(cust.SoDu) || 0) + parseFloat(trans.amount);
                    db.query('INSERT INTO GiaoDich (MaKhachHang, LoaiGiaoDich, SoTien, NoiDung, TrangThai) VALUES (?, "NapTien", ?, ?, "ThanhCong")',
                        [cust.MaKhachHang, trans.amount, trans.description], () => {
                            db.query('UPDATE KhachHang SET SoDu = ? WHERE MaKhachHang = ?', [newBal, cust.MaKhachHang]);
                        });
                }
            });
        }
    });
    res.json({ error: 0, message: 'Webhook received' });
});

// Get Transactions
app.get('/api/user/:id/transactions', (req, res) => {
    db.query('SELECT * FROM GiaoDich gd JOIN KhachHang kh ON gd.MaKhachHang = kh.MaKhachHang WHERE kh.MaNguoiDung = ? ORDER BY gd.NgayGiaoDich DESC', [req.params.id], (err, r) => {
        if (err) return res.status(500);
        res.json(r);
    });
});

// Create Order
// Create Order
app.post('/api/orders', (req, res) => {
    const { customer, items, total, couponCode } = req.body;
    const userId = customer.userId;
    let uQ = 'SELECT MaKhachHang, SoDu FROM KhachHang WHERE MaNguoiDung = ?';
    let uP = [userId];
    if (!userId) { uQ = 'SELECT MaKhachHang, SoDu FROM KhachHang WHERE SoDienThoai = ?'; uP = [customer.phone]; }

    db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ message: 'Database connection error' });

        conn.query(uQ, uP, (err, resUser) => {
            if (err || resUser.length === 0) {
                conn.release();
                return res.status(400).json({ message: 'User not found' });
            }
            const custId = resUser[0].MaKhachHang;
            if ((parseFloat(resUser[0].SoDu) || 0) < total) {
                conn.release();
                return res.status(400).json({ message: 'Số dư không đủ' });
            }

            const orderId = generateId('DH');
            conn.beginTransaction(err => {
                if (err) {
                    conn.release();
                    return res.status(500).json({ message: 'Transaction error' });
                }

                conn.query('INSERT INTO DonHang (MaDonHang, TongTien, TrangThai, NgayTao, MaKhachHang, MaPGG_ID) VALUES (?, ?, "ChoXuLy", NOW(), ?, ?)', [orderId, total, custId, couponCode || null], err => {
                    if (err) return conn.rollback(() => { conn.release(); res.status(500).json({ message: 'Error creating order' }); });

                    const details = items.map(i => [orderId, i.id, i.quantity, i.price]);
                    conn.query('INSERT INTO ChiTietDonHang (MaDonHang, MaTruyen, SoLuong, DonGia) VALUES ?', [details], err => {
                        if (err) return conn.rollback(() => { conn.release(); res.status(500).json({ message: 'Error inserting order details' }); });

                        // Update Stock
                        const stockP = items.map(i => new Promise((resolve, reject) => {
                            conn.query('UPDATE TruyenTranh SET TonKho = TonKho - ? WHERE MaTruyen = ? AND TonKho >= ?', [i.quantity, i.id, i.quantity], (err, r) => {
                                if (err || r.affectedRows === 0) reject(); else resolve();
                            });
                        }));

                        // Update Coupon Quantity if used
                        if (couponCode) {
                            stockP.push(new Promise((resolve, reject) => {
                                conn.query('UPDATE PhieuGiamGia SET SoLuong = SoLuong - 1 WHERE MaPGG_ID = ? AND SoLuong > 0', [couponCode], (err, r) => {
                                    if (err || r.affectedRows === 0) reject(); else resolve();
                                });
                            }));
                        }

                        Promise.all(stockP).then(() => {
                            conn.query('UPDATE KhachHang SET SoDu = SoDu - ? WHERE MaKhachHang = ?', [total, custId], err => {
                                if (err) return conn.rollback(() => { conn.release(); res.status(500).json({ message: 'Error updating balance' }); });

                                conn.query('INSERT INTO GiaoDich (MaKhachHang, LoaiGiaoDich, SoTien, NoiDung, TrangThai) VALUES (?, "ThanhToan", ?, ?, "ThanhCong")',
                                    [custId, total, `Thanh toán ${orderId}`], err => {
                                        if (err) return conn.rollback(() => { conn.release(); res.status(500).json({ message: 'Error logging transaction' }); });
                                        conn.commit(err => {
                                            if (err) return conn.rollback(() => { conn.release(); res.status(500).json({ message: 'Commit error' }); });
                                            conn.release();
                                            res.json({ message: 'Success', orderId });
                                        });
                                    });
                            });
                        }).catch(() => conn.rollback(() => { conn.release(); res.status(400).json({ message: 'Hết hàng hoặc mã giảm giá không hợp lệ/hết lượt dùng' }); }));
                    });
                });
            });
        });
    });
});

// Cancel Order
app.put('/api/orders/:id/cancel', (req, res) => {
    const orderId = req.params.id;
    const { reason } = req.body;
    db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        conn.beginTransaction(err => {
            if (err) { conn.release(); return res.status(500).json({ message: 'Trans error' }); }

            conn.query('SELECT * FROM DonHang WHERE MaDonHang = ? FOR UPDATE', [orderId], (err, results) => {
                if (err || results.length === 0) return conn.rollback(() => { conn.release(); res.status(404).json({ message: 'Not found' }); });
                const order = results[0];
                if (order.TrangThai !== 'ChoXuLy') return conn.rollback(() => { conn.release(); res.status(400).json({ message: 'Cannot cancel' }); });

                conn.query('SELECT MaTruyen, SoLuong FROM ChiTietDonHang WHERE MaDonHang = ?', [orderId], (err, items) => {
                    if (err) return conn.rollback(() => { conn.release(); res.status(500).end(); });

                    const restoreP = items.map(i => new Promise((resolve, reject) => {
                        conn.query('UPDATE TruyenTranh SET TonKho = TonKho + ? WHERE MaTruyen = ?', [i.SoLuong, i.MaTruyen], (err) => err ? reject(err) : resolve());
                    }));

                    Promise.all(restoreP).then(() => {
                        conn.query('UPDATE DonHang SET TrangThai = "DaHuy", GhiChu = ? WHERE MaDonHang = ?', [reason, orderId], err => {
                            if (err) return conn.rollback(() => { conn.release(); res.status(500).end(); });

                            conn.query('UPDATE KhachHang SET SoDu = SoDu + ? WHERE MaKhachHang = ?', [order.TongTien, order.MaKhachHang], err => {
                                if (err) return conn.rollback(() => { conn.release(); res.status(500).end(); });

                                conn.query('INSERT INTO GiaoDich (MaKhachHang, LoaiGiaoDich, SoTien, NoiDung, TrangThai) VALUES (?, "HoanTien", ?, ?, "ThanhCong")',
                                    [order.MaKhachHang, order.TongTien, `Hoàn tiền ${orderId}`], err => {
                                        if (err) return conn.rollback(() => { conn.release(); res.status(500).end(); });
                                        conn.commit(() => {
                                            conn.release();
                                            res.json({ message: 'Cancelled' });
                                        });
                                    });
                            });
                        });
                    }).catch(() => conn.rollback(() => { conn.release(); res.status(500).end(); }));
                });
            });
        });
    });
});

// Admin Orders
app.get('/api/admin/orders', (req, res) => {
    const sql = `
        SELECT dh.MaDonHang, dh.NgayTao, dh.TongTien, dh.TrangThai, dh.GhiChu,
               kh.HoTen, kh.SoDienThoai, kh.DiaChi, kh.Email,
               ct.MaTruyen, tt.TenSanPham, tt.AnhBia, ct.SoLuong, ct.DonGia
        FROM DonHang dh
        LEFT JOIN KhachHang kh ON dh.MaKhachHang = kh.MaKhachHang
        LEFT JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
        LEFT JOIN TruyenTranh tt ON ct.MaTruyen = tt.MaTruyen
        ORDER BY dh.NgayTao DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const orders = {};
        results.forEach(row => {
            if (!orders[row.MaDonHang]) {
                orders[row.MaDonHang] = {
                    id: row.MaDonHang, date: row.NgayTao, total: row.TongTien, status: row.TrangThai, note: row.GhiChu,
                    customer: { name: row.HoTen, phone: row.SoDienThoai, address: row.DiaChi, email: row.Email },
                    items: []
                };
            }
            if (row.MaTruyen) {
                let image = row.AnhBia; try { image = JSON.parse(image)[0] || image; } catch (e) { }
                orders[row.MaDonHang].items.push({ productId: row.MaTruyen, name: row.TenSanPham, image, quantity: row.SoLuong, price: row.DonGia });
            }
        });
        res.json(Object.values(orders));
    });
});

app.put('/api/admin/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    db.query('SELECT MaKhachHang, TongTien, TrangThai FROM DonHang WHERE MaDonHang = ?', [id], (err, results) => {
        if (err || results.length === 0) return res.status(500).json(err || { message: 'Order not found' });
        const order = results[0];

        db.query('UPDATE DonHang SET TrangThai = ? WHERE MaDonHang = ?', [status, id], (err) => {
            if (err) return res.status(500).json(err);

            // If status changed to 'ThanhCong' (Success) and wasn't before, update Customer stats
            if (status === 'ThanhCong' && order.TrangThai !== 'ThanhCong') {
                const updateSql = 'UPDATE KhachHang SET SoLanMua = SoLanMua + 1, SoTienDaMua = SoTienDaMua + ? WHERE MaKhachHang = ?';
                db.query(updateSql, [order.TongTien, order.MaKhachHang], (updateErr) => {
                    if (updateErr) console.error('Failed to update customer stats:', updateErr);
                    res.json({ message: 'Success', statsUpdated: true });
                });
            } else {
                res.json({ message: 'Success' });
            }
        });
    });
});

// --- Coupon Management (Official Schema) ---
app.get('/api/vouchers', (req, res) => {
    const sql = `
        SELECT p.*, d.GiaTriYeuCau as DieuKienJSON
        FROM PhieuGiamGia p
        LEFT JOIN DieuKienApDung d ON p.MaDieuKien = d.MaDieuKien
        WHERE p.NgayKetThuc >= CURDATE() AND p.SoLuong > 0
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        const mapped = results.map(r => ({
            code: r.MaPGG_ID,
            discount: r.GiaTriGiam,
            type: r.LoaiGiamGia,
            description: r.TenPhieuGiamGia,
            conditions: r.DieuKienJSON
        }));
        res.json(mapped);
    });
});

app.post('/api/vouchers/apply', (req, res) => {
    const { code, totalAmount } = req.body;
    if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã' });

    const sql = `
        SELECT p.*, d.GiaTriYeuCau as DieuKienJSON
        FROM PhieuGiamGia p
        LEFT JOIN DieuKienApDung d ON p.MaDieuKien = d.MaDieuKien
        WHERE p.MaPGG_ID = ? AND p.SoLuong > 0 AND p.NgayBatDau <= NOW() AND p.NgayKetThuc >= NOW()
    `;
    db.query(sql, [code], (err, results) => {
        if (err) return res.status(500).json({ message: 'Lỗi server' });
        if (results.length === 0) return res.status(404).json({ message: 'Mã giảm giá không tồn tại hoặc đã hết hạn/hết lượt dùng' });

        const voucher = results[0];
        let conditions = {};
        try { conditions = JSON.parse(voucher.DieuKienJSON); } catch (e) { }

        if (conditions.minBill && totalAmount < conditions.minBill) {
            return res.status(400).json({ message: `Đơn hàng tối thiểu để áp dụng là ${parseInt(conditions.minBill).toLocaleString('vi-VN')}đ` });
        }

        let discount = 0;
        if (voucher.LoaiGiamGia === 'PhanTram') {
            discount = (totalAmount * voucher.GiaTriGiam) / 100;
            if (conditions.maxDiscount && discount > conditions.maxDiscount) {
                discount = conditions.maxDiscount;
            }
        } else {
            discount = voucher.GiaTriGiam;
        }

        if (discount > totalAmount) discount = totalAmount; // Cannot discount more than total

        res.json({
            success: true,
            discount: discount,
            finalTotal: totalAmount - discount,
            code: voucher.MaPGG_ID,
            message: 'Áp dụng mã giảm giá thành công'
        });
    });
});

app.get('/api/admin/coupons', (req, res) => {
    const sql = `
        SELECT p.*, d.GiaTriYeuCau as DieuKienJSON
        FROM PhieuGiamGia p
        LEFT JOIN DieuKienApDung d ON p.MaDieuKien = d.MaDieuKien
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        const mapped = results.map(r => ({
            MaGiamGia: r.MaPGG_ID,
            PhanTramGiam: r.LoaiGiamGia === 'PhanTram' ? r.GiaTriGiam : 0,
            GiaTriGiam: r.LoaiGiamGia === 'Tien' ? r.GiaTriGiam : 0,
            NgayBatDau: r.NgayBatDau,
            NgayHetHan: r.NgayKetThuc,
            SoLuong: r.SoLuong,
            MoTa: r.TenPhieuGiamGia,
            DieuKien: r.DieuKienJSON
        }));
        res.json(mapped);
    });
});

app.post('/api/admin/coupons', (req, res) => {
    const { code, percent, startDate, expiry, quantity, description, conditions } = req.body;
    if (!code || !percent || !expiry) return res.status(400).json({ message: 'Missing fields' });

    const validStartDate = startDate || new Date();
    const condId = 'DK_' + code.toUpperCase();

    db.query('SELECT * FROM PhieuGiamGia WHERE MaPGG_ID = ?', [code], (err, ex) => {
        if (!err && ex.length > 0) return res.status(400).json({ message: 'Code exists' });

        const condSql = "INSERT INTO DieuKienApDung (MaDieuKien, TenDieuKien, LoaiDieuKien, GiaTriYeuCau) VALUES (?, ?, 'JSON', ?) ON DUPLICATE KEY UPDATE GiaTriYeuCau=?";
        db.query(condSql, [condId, 'Điều kiện cho ' + code, conditions || '{}', conditions || '{}'], (err) => {
            if (err) { console.error(err); return res.status(500).json(err); }

            const couponSql = 'INSERT INTO PhieuGiamGia (MaPGG_ID, TenPhieuGiamGia, GiaTriGiam, LoaiGiamGia, NgayBatDau, NgayKetThuc, SoLuong, MaDieuKien) VALUES (?, ?, ?, "PhanTram", ?, ?, ?, ?)';
            db.query(couponSql, [code.toUpperCase(), description, percent, validStartDate, expiry, quantity || 100, condId], (err) => {
                if (err) { console.error(err); return res.status(500).json(err); }
                res.json({ message: 'Coupon created' });
            });
        });
    });
});

app.put('/api/admin/coupons/:code', (req, res) => {
    const { percent, startDate, expiry, quantity, description, conditions } = req.body;
    const code = req.params.code;
    const condId = 'DK_' + code;

    const condSql = "INSERT INTO DieuKienApDung (MaDieuKien, LoaiDieuKien, GiaTriYeuCau) VALUES (?, 'JSON', ?) ON DUPLICATE KEY UPDATE GiaTriYeuCau=?";
    db.query(condSql, [condId, conditions || '{}', conditions || '{}'], (err) => {
        if (err) return res.status(500).json(err);

        const sql = 'UPDATE PhieuGiamGia SET GiaTriGiam=?, TenPhieuGiamGia=?, NgayBatDau=?, NgayKetThuc=?, SoLuong=?, MaDieuKien=? WHERE MaPGG_ID=?';
        db.query(sql, [percent, description, startDate, expiry, quantity, condId, code], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Updated' });
        });
    });
});

app.delete('/api/admin/coupons/:code', (req, res) => {
    db.query('DELETE FROM PhieuGiamGia WHERE MaPGG_ID = ?', [req.params.code], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Deleted' });
    });
});

// --- Customer Management ---
app.get('/api/admin/customers', (req, res) => {
    const sql = `
        SELECT kh.*, nd.TaiKhoan, nd.TrangThai as IsActive,
        (SELECT COUNT(*) FROM DonHang WHERE MaKhachHang = kh.MaKhachHang AND TrangThai = 'ThanhCong') as OrderCount,
        (SELECT IFNULL(SUM(TongTien), 0) FROM DonHang WHERE MaKhachHang = kh.MaKhachHang AND TrangThai = 'ThanhCong') as TotalSpent
        FROM KhachHang kh
        LEFT JOIN NguoiDung nd ON kh.MaNguoiDung = nd.MaNguoiDung
        ORDER BY TotalSpent DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.put('/api/admin/customers/:id', (req, res) => {
    const { name, phone, email, address, balance } = req.body;
    const sql = 'UPDATE KhachHang SET HoTen=?, SoDienThoai=?, Email=?, DiaChi=?, SoDu=? WHERE MaKhachHang=?';
    db.query(sql, [name, phone, email, address, balance, req.params.id], (err) => {
        if (err) { console.error('Update User Failed:', err); return res.status(500).json(err); }
        res.json({ message: 'Updated' });
    });
});

app.delete('/api/admin/customers/:id', (req, res) => {
    const id = req.params.id;
    const sql = `UPDATE NguoiDung SET TrangThai = CASE WHEN TrangThai = 1 THEN 0 ELSE 1 END 
                 WHERE MaNguoiDung = (SELECT MaNguoiDung FROM KhachHang WHERE MaKhachHang = ?)`;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Toggled Status' });
    });
});

// --- Cart Management ---

// Helper: Get Customer ID from User ID
const getCustomerId = (userId) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT MaKhachHang FROM KhachHang WHERE MaNguoiDung = ?', [userId], (err, results) => {
            if (err) return reject(err);
            if (results.length === 0) return resolve(null);
            resolve(results[0].MaKhachHang);
        });
    });
};

// Get Cart
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const custId = await getCustomerId(req.params.userId);
        if (!custId) return res.json([]);

        const sql = `
            SELECT ct.MaTruyen, ct.SoLuong, t.TenSanPham, t.GiaBan, t.AnhBia, t.TonKho
            FROM GioHang gh
            JOIN ChiTietGioHang ct ON gh.MaGioHang = ct.MaGioHang
            JOIN TruyenTranh t ON ct.MaTruyen = t.MaTruyen
            WHERE gh.MaKhachHang = ?
        `;
        db.query(sql, [custId], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            const items = results.map(r => {
                let image = r.AnhBia;
                try { image = JSON.parse(r.AnhBia)[0] || r.AnhBia; } catch (e) { }
                return {
                    id: r.MaTruyen,
                    title: r.TenSanPham,
                    price: r.GiaBan,
                    image: image,
                    quantity: r.SoLuong,
                    stock: r.TonKho
                };
            });
            res.json(items);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to Cart
app.post('/api/cart/add', async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        let custId = await getCustomerId(userId);

        if (!custId) {
            // Create a new customer record
            custId = await new Promise((resolve, reject) => {
                db.query('SELECT HoTen FROM NguoiDung WHERE MaNguoiDung = ?', [userId], (err, users) => {
                    if (err) return reject(err);
                    const customerName = (users && users.length > 0) ? users[0].HoTen : ('Customer ' + userId);
                    db.query('INSERT INTO KhachHang (MaNguoiDung, TenKhachHang) VALUES (?, ?)',
                        [userId, customerName], (err, result) => {
                            if (err) return reject(err);
                            resolve(result.insertId);
                        });
                });
            });
        }

        proceedToAddToCart(custId, res);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

    function proceedToAddToCart(finalCustId, res) {
        // Get or Create Cart
        db.query('SELECT MaGioHang FROM GioHang WHERE MaKhachHang = ?', [finalCustId], (err, results) => {
            if (err) return res.status(500).json(err);

            const processCartItem = (cartId) => {

                db.query('SELECT * FROM ChiTietGioHang WHERE MaGioHang = ? AND MaTruyen = ?', [cartId, productId], (err, items) => {
                    if (err) return res.status(500).json(err);
                    if (items.length > 0) {
                        // Update quantity
                        const newQty = items[0].SoLuong + (quantity || 1);
                        db.query('UPDATE ChiTietGioHang SET SoLuong = ? WHERE Id = ?', [newQty, items[0].Id], (err) => {
                            if (err) return res.status(500).json(err);
                            res.json({ message: 'Updated quantity' });
                        });
                    } else {
                        // Insert new item
                        db.query('INSERT INTO ChiTietGioHang (MaGioHang, MaTruyen, SoLuong) VALUES (?, ?, ?)', [cartId, productId, quantity || 1], (err) => {
                            if (err) return res.status(500).json(err);
                            res.json({ message: 'Added to cart' });
                        });
                    }
                });
            };

            if (results.length === 0) {
                db.query('INSERT INTO GioHang (MaKhachHang) VALUES (?)', [finalCustId], (err, result) => {
                    if (err) return res.status(500).json(err);
                    processCartItem(result.insertId);
                });
            } else {
                processCartItem(results[0].MaGioHang);
            }
        });
    }
});

// Update Cart Item Quantity
app.put('/api/cart/update', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    try {
        const custId = await getCustomerId(userId);
        if (!custId) return res.status(404).json({ message: 'User not found' });

        const sql = `
            UPDATE ChiTietGioHang ct
            JOIN GioHang gh ON ct.MaGioHang = gh.MaGioHang
            SET ct.SoLuong = ?
            WHERE gh.MaKhachHang = ? AND ct.MaTruyen = ?
        `;
        db.query(sql, [quantity, custId, productId], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Updated' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear Cart
app.delete('/api/cart/clear', async (req, res) => {
    const { userId } = req.body;
    try {
        const custId = await getCustomerId(userId);
        if (!custId) return res.status(404).json({ message: 'User not found' });

        db.query('SELECT MaGioHang FROM GioHang WHERE MaKhachHang = ?', [custId], (err, results) => {
            if (err) return res.status(500).json(err);
            if (results.length === 0) return res.json({ message: 'Cart empty' });

            db.query('DELETE FROM ChiTietGioHang WHERE MaGioHang = ?', [results[0].MaGioHang], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ message: 'Cart cleared' });
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove Cart Item
app.delete('/api/cart/remove', async (req, res) => {
    const { userId, productId } = req.body;
    try {
        const custId = await getCustomerId(userId);
        if (!custId) return res.status(404).json({ message: 'User not found' });

        const sql = `
            DELETE ct FROM ChiTietGioHang ct
            JOIN GioHang gh ON ct.MaGioHang = gh.MaGioHang
            WHERE gh.MaKhachHang = ? AND ct.MaTruyen = ?
        `;
        db.query(sql, [custId, productId], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Removed' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
