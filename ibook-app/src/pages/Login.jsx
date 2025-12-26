import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { useToast } from '../components/Toast';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/login`, formData);

            // Save user info
            const user = response.data.user;
            sessionStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event('authChange'));

            if (user.role === 'ADMIN' || user.role === 'SUPPORT') {
                navigate('/admin/products');
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
        }
    };

    return (
        <div className="user-auth-page">
            <div className="user-auth-container">
                <div className="auth-tabs">
                    <Link to="/login" className="auth-tab active">Đăng nhập</Link>
                    <Link to="/register" className="auth-tab">Đăng ký</Link>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="user-form-group">
                        <label>Số điện thoại/Email</label>
                        <input
                            type="text"
                            name="email"
                            placeholder="Nhập số điện thoại hoặc Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="user-form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Nhập mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>


                    <Link to="/forgot-password" className="forgot-password-link">Quên mật khẩu?</Link>

                    <button type="submit" className="user-submit-btn">Đăng nhập</button>

                    <div className="auth-divider">
                        <span>Hoặc đăng nhập bằng</span>
                    </div>

                    <div className="social-buttons">
                        <button type="button" className="social-btn facebook-btn">
                            <span className="social-icon">f</span> Facebook
                        </button>
                        <button type="button" className="social-btn google-btn">
                            <span className="social-icon">G+</span> Google
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
