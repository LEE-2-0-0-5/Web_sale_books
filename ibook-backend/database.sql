-- ⚠️ Đã tắt lệnh DROP DATABASE để bảo vệ dữ liệu cũ của bạn.
-- DROP DATABASE IF EXISTS ibook_db; 
CREATE DATABASE IF NOT EXISTS ibook_db;
USE ibook_db;

-- 1. Bảng Người Dùng (User base)
CREATE TABLE IF NOT EXISTS NguoiDung (
    MaNguoiDung VARCHAR(50) PRIMARY KEY,
    TaiKhoan VARCHAR(100) NOT NULL UNIQUE, -- Email hoặc Username
    MatKhau VARCHAR(255) NOT NULL,
    TrangThai BOOLEAN DEFAULT TRUE
);

-- 2. Bảng Khách Hàng (Customer)
CREATE TABLE IF NOT EXISTS KhachHang (
    MaKhachHang VARCHAR(50) PRIMARY KEY,
    HoTen VARCHAR(100),
    NgaySinh DATE,
    GioiTinh VARCHAR(10),
    SoDienThoai VARCHAR(20),
    Email VARCHAR(100),
    DiaChi TEXT,
    SoLanMua INT DEFAULT 0,
    SoTienDaMua DECIMAL(15, 2) DEFAULT 0,
    HangKhachHang VARCHAR(50) DEFAULT 'Thành viên',
    AnhDaiDien TEXT, -- Avatar URL
    SoDu DECIMAL(15, 2) DEFAULT 0, -- Số dư ví
    MaNguoiDung VARCHAR(50),
    FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
);

-- 3. Bảng Thể Loại (Category)
CREATE TABLE IF NOT EXISTS TheLoai (
    TLID INT AUTO_INCREMENT PRIMARY KEY,
    TenTheLoai VARCHAR(100) NOT NULL,
    MoTa TEXT
);

-- 4. Bảng Truyện Tranh (Product)
CREATE TABLE IF NOT EXISTS TruyenTranh (
    MaTruyen VARCHAR(50) PRIMARY KEY,
    TenSanPham VARCHAR(255) NOT NULL,
    TacGia VARCHAR(100),
    GiaBan DECIMAL(15, 2) NOT NULL,
    AnhBia JSON, -- Lưu đường dẫn ảnh dưới dạng mảng JSON
    MoTa TEXT,
    TonKho INT DEFAULT 100,
    TLID INT,
    FOREIGN KEY (TLID) REFERENCES TheLoai(TLID)
);

-- 5. Bảng Đơn Hàng (Order)
CREATE TABLE IF NOT EXISTS DonHang (
    MaDonHang VARCHAR(50) PRIMARY KEY,
    TongTien DECIMAL(15, 2) NOT NULL,
    TrangThai VARCHAR(50) DEFAULT 'Chờ xử lý',
    MaVanDon VARCHAR(50),
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    MaKhachHang VARCHAR(50),
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang)
);

-- 6. Bảng Chi Tiết Đơn Hàng (Order Details)
CREATE TABLE IF NOT EXISTS ChiTietDonHang (
    MaDonHang VARCHAR(50),
    MaTruyen VARCHAR(50),
    SoLuong INT NOT NULL,
    DonGia DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (MaDonHang, MaTruyen),
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    FOREIGN KEY (MaTruyen) REFERENCES TruyenTranh(MaTruyen)
);

-- Dữ liệu mẫu (Sử dụng IGNORE để không ghi đè dữ liệu cũ nếu đã tồn tại)
INSERT IGNORE INTO TheLoai (TenTheLoai, MoTa) VALUES 
('Trinh thám', 'Truyện điều tra phá án'),
('Hài hước', 'Truyện vui nhộn'),
('Phiêu lưu', 'Hành trình khám phá'),
('Đời thường', 'Câu chuyện cuộc sống');

INSERT IGNORE INTO TruyenTranh (MaTruyen, TenSanPham, TacGia, GiaBan, AnhBia, MoTa, TLID) VALUES
('TT01', 'Thám tử lừng danh Conan tập 3', 'Gosho Aoyama', 25000, '["/assets/tham-tu-lung-danh-conan-tap-3-tai-ban-2023-_125766_1.jpg"]', 'Tập 3 của series Conan', 1),
('TT02', 'Mèo mốc - và xuân lại về', 'Mèo Mốc', 150000, '["/assets/unnamed_12.jpg"]', 'Truyện tranh hài hước về Mèo Mốc', 2),
('TT03', 'Tây du hí - Tập 5', 'Phan Kim Thanh', 80000, '["/assets/Gemini_Generated_Image_qtrz6oqtrz6oqtrz.png"]', 'Hài hước Tây Du Ký', 3),
('TT04', 'Người bà tài giỏi vùng Saga - Tập 5', 'Yoshichi Shimada', 200000, '["/assets/z7225188289039_d894fab289e1cb184dcc60bf661fd179.jpg"]', 'Câu chuyện cảm động', 4),
('TT05', 'Thám tử lừng danh Conan - Tập 34', 'Gosho Aoyama', 55000, '["/assets/tham-tu-lung-danh-conan-tap-34-_127670_1.jpg"]', 'Vụ án tại New York', 1);

-- 7. Bảng Yêu Thích (Favorites)
CREATE TABLE IF NOT EXISTS YeuThich (
    MaYeuThich INT AUTO_INCREMENT PRIMARY KEY,
    MaKhachHang VARCHAR(50),
    MaTruyen VARCHAR(50),
    NgayThem DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang) ON DELETE CASCADE,
    FOREIGN KEY (MaTruyen) REFERENCES TruyenTranh(MaTruyen) ON DELETE CASCADE,
    UNIQUE(MaKhachHang, MaTruyen)
);

-- 8. Bảng Thông Báo (Notifications)
CREATE TABLE IF NOT EXISTS ThongBao (
    MaThongBao INT AUTO_INCREMENT PRIMARY KEY,
    MaNguoiDung VARCHAR(50),
    TieuDe VARCHAR(255),
    NoiDung TEXT,
    DaXem BOOLEAN DEFAULT FALSE,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
);

-- Dữ liệu mẫu cho Yêu Thích
INSERT IGNORE INTO YeuThich (MaKhachHang, MaTruyen) VALUES 
((SELECT MaKhachHang FROM KhachHang LIMIT 1), 'TT01'),
((SELECT MaKhachHang FROM KhachHang LIMIT 1), 'TT05');

-- 11. Bảng Giao Dịch (Transactions)
CREATE TABLE IF NOT EXISTS GiaoDich (
    MaGiaoDich INT AUTO_INCREMENT PRIMARY KEY,
    MaKhachHang VARCHAR(50),
    LoaiGiaoDich VARCHAR(50), -- 'NapTien', 'ThanhToan', 'HoanTien'
    SoTien DECIMAL(15, 2),
    NoiDung TEXT,
    TrangThai VARCHAR(50), -- 'ThanhCong', 'ThatBai', 'ChoXuLy'
    NgayGiaoDich DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang)
);

-- Dữ liệu mẫu cho Thông Báo
INSERT IGNORE INTO ThongBao (MaNguoiDung, TieuDe, NoiDung) VALUES 
((SELECT MaNguoiDung FROM NguoiDung LIMIT 1), 'Khuyến mãi', 'Giảm giá 50% cho tất cả truyện tranh trinh thám');

-- 9. Bảng Điều Kiện Áp Dụng (Applicable Conditions)
CREATE TABLE IF NOT EXISTS DieuKienApDung (
    MaDieuKien VARCHAR(50) PRIMARY KEY,
    TenDieuKien VARCHAR(255),
    LoaiDieuKien VARCHAR(50),
    GiaTriYeuCau VARCHAR(255)
);

-- 10. Bảng Phiếu Giảm Giá (Coupons)
CREATE TABLE IF NOT EXISTS PhieuGiamGia (
    MaPGG_ID VARCHAR(50) PRIMARY KEY,
    TenPhieuGiamGia VARCHAR(255),
    GiaTriGiam DECIMAL(15, 2),
    NgayBatDau DATETIME,
    NgayKetThuc DATETIME,
    SoLuong INT,
    MaDieuKien VARCHAR(50),
    FOREIGN KEY (MaDieuKien) REFERENCES DieuKienApDung(MaDieuKien)
);

-- Dữ liệu mẫu: Tài khoản Test
INSERT IGNORE INTO NguoiDung (MaNguoiDung, TaiKhoan, MatKhau, TrangThai) VALUES 
('USER_TEST', 'testuser', '1', TRUE);

INSERT IGNORE INTO KhachHang (MaKhachHang, HoTen, Email, SoDu, MaNguoiDung) VALUES 
('KH_TEST', 'Khách Hàng Test', 'test@ibook.com', 10000000, 'USER_TEST');

-- Dữ liệu mẫu: Phiếu giảm giá
INSERT IGNORE INTO DieuKienApDung (MaDieuKien, TenDieuKien, LoaiDieuKien, GiaTriYeuCau) VALUES
('DK01', 'Đơn hàng từ 0đ', 'TongTienToiThieu', '0');

INSERT IGNORE INTO PhieuGiamGia (MaPGG_ID, TenPhieuGiamGia, GiaTriGiam, NgayBatDau, NgayKetThuc, SoLuong, MaDieuKien) VALUES
('GIAM50K', 'Giảm 50k cho mọi đơn hàng', 50000, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'DK01'),
('TEST10', 'Giảm 10k test', 10000, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'DK01');
