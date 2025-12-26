import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../pages/Auth.css'; // Reuse the split-screen styles

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Using the same login endpoint, but we'll enforce role checks here
            const response = await axios.post('/api/login', formData);
            const user = response.data.user;

            if (user.role === 'CUSTOMER') {
                setError('Tài khoản này không có quyền truy cập trang quản trị.');
                return;
            }

            // Save user info
            sessionStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event('authChange'));

            // Specific Redirect Logic
            console.log('User Role:', user.role);
            if (user.role === 'ADMIN') {
                navigate('/admin/products');
            } else if (user.role === 'CHAT') {
                navigate('/chat', { replace: true });
            } else {
                navigate('/admin/products'); // Fallback
            }

        } catch (error) {
            setError(error.response?.data?.message || 'Đăng nhập thất bại');
        }
    };

    return (
        <div className="admin-login-page">
            <nav className="simple-navbar">
                <div className="container">
                    <span className="logo-text">Ibook<span className="logo-dot">.com</span></span>
                </div>
            </nav>

            <div className="container login-content-wrapper">
                <div className="login-card">
                    <div className="login-image-side">
                        {/* We'll use a background image in CSS */}
                    </div>

                    <div className="login-form-side">
                        <div className="form-content">
                            <h2 className="login-heading">Welcome back to Ibook.com</h2>
                            <p className="login-subheading">Enter your details below</p>

                            {error && <div className="error-message">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="input-group-underlined">
                                    <input
                                        type="text"
                                        name="email"
                                        placeholder="Username"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="input-group-underlined">
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="login-btn-primary">Log In</button>
                                    <a href="#" className="forgot-link">Forgot Password?</a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="simple-footer">
                <div className="container">
                    <div className="footer-columns">
                        <div className="footer-column">
                            <h3>Exclusive</h3>
                            <p className="subscribe-text">Subscribe</p>
                            <p>Get 10% off your first order</p>
                            <div className="email-input-box">
                                <input type="email" placeholder="Enter your email" />
                                <button>&gt;</button>
                            </div>
                        </div>
                        <div className="footer-column">
                            <h3>Support</h3>
                            <p>123, Imperial Ha Noi, Hoang Mai, Ha Noi</p>
                            <p>duykhanhworking@gmail.com</p>
                            <p>+84374-801-034</p>
                        </div>
                        <div className="footer-column">
                            <h3>Account</h3>
                            <p>My Account</p>
                            <p>Login / Register</p>
                            <p>Cart</p>
                            <p>Wishlist</p>
                            <p>Shop</p>
                        </div>
                        <div className="footer-column">
                            <h3>Quick Link</h3>
                            <p>Privacy Policy</p>
                            <p>Terms Of Use</p>
                            <p>FAQ</p>
                            <p>Contact</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AdminLogin;
