import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h3>VỀ IBOOK</h3>
                        <ul>
                            <li><a href="#">Giới thiệu</a></li>
                            <li><a href="#">Tuyển dụng</a></li>
                            <li><a href="#">Chính sách bảo mật</a></li>
                            <li><a href="#">Điều khoản sử dụng</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>HỖ TRỢ KHÁCH HÀNG</h3>
                        <ul>
                            <li><a href="#">Hướng dẫn mua hàng</a></li>
                            <li><a href="#">Phương thức thanh toán</a></li>
                            <li><a href="#">Chính sách đổi trả</a></li>
                            <li><a href="#">Câu hỏi thường gặp</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>LIÊN HỆ</h3>
                        <ul>
                            <li><i className="icon">📍</i> Số 1 Đại Cồ Việt, Hà Nội</li>
                            <li><i className="icon">📧</i> support@ibook.com</li>
                            <li><i className="icon">📞</i> 1900 1234</li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h3>KẾT NỐI VỚI CHÚNG TÔI</h3>
                        <div className="social-links">
                            <a href="#" className="social-icon">F</a>
                            <a href="#" className="social-icon">Y</a>
                            <a href="#" className="social-icon">I</a>
                        </div>
                        <div className="newsletter">
                            <p>Đăng ký nhận tin khuyến mãi</p>
                            <div className="newsletter-form">
                                <input type="email" placeholder="Email của bạn" />
                                <button>Gửi</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Ibook.com. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
