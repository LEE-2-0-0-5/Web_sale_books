import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { useToast } from '../components/Toast';
import './Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        const emailPhoneRegex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})|([0-9]{10,11})$/;

        if (!formData.email) {
            newErrors.email = 'Vui lòng nhập Email hoặc Số điện thoại';
        } else if (!emailPhoneRegex.test(formData.email)) {
            newErrors.email = 'Email hoặc Số điện thoại không hợp lệ';
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            const payload = {
                name: formData.email.split('@')[0] || 'User',
                email: formData.email,
                password: formData.password
            };

            const response = await axios.post(`${API_URL}/register`, payload);
            toast.success(response.data.message);
            navigate('/login');
        } catch (error) {
            console.error(error);
            const serverMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại';
            toast.error(`Lỗi: ${serverMessage}. Vui lòng kiểm tra lại kết nối server hoặc database.`);
        }
    };

    return (
        <div className="user-auth-page">
            <div className="user-auth-container">
                <div className="auth-tabs">
                    <Link to="/login" className="auth-tab">Đăng nhập</Link>
                    <Link to="/register" className="auth-tab active">Đăng ký</Link>
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
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className="error-message" style={{ color: 'red', fontSize: '0.8rem' }}>{errors.email}</span>}
                    </div>
                    <div className="user-form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Nhập mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'input-error' : ''}
                        />
                        {errors.password && <span className="error-message" style={{ color: 'red', fontSize: '0.8rem' }}>{errors.password}</span>}
                    </div>
                    <div className="user-form-group">
                        <label>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={errors.confirmPassword ? 'input-error' : ''}
                        />
                        {errors.confirmPassword && <span className="error-message" style={{ color: 'red', fontSize: '0.8rem' }}>{errors.confirmPassword}</span>}
                    </div>

                    <button type="submit" className="user-submit-btn">Đăng ký</button>

                </form>
            </div>
        </div>
    );
};

export default Register;
