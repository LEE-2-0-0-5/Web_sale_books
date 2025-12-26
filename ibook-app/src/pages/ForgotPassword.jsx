import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { useToast } from '../components/Toast';
import './Auth.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']); // Array of 6 digits
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.warning('Vui lòng nhập Email hoặc Số điện thoại');
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/forgot-password/send-otp`, { email });
            toast.success('Mã OTP đã được gửi đến email của bạn! (Nếu không thấy, vui lòng kiểm tra mục Spam)');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        const otpValue = otpArray.join('');
        if (otpValue.length < 6) {
            toast.warning('Vui lòng nhập đủ 6 số OTP');
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/forgot-password/verify-otp`, { email, otp: otpValue });
            setStep(3); // Move to Reset Password step
        } catch (error) {
            toast.error(error.response?.data?.message || 'Mã OTP không đúng');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const otpValue = otpArray.join('');
        if (!newPass || !confirmPass) {
            toast.warning('Vui lòng nhập đầy đủ mật khẩu');
            return;
        }
        if (newPass !== confirmPass) {
            toast.warning('Mật khẩu xác nhận không khớp');
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/forgot-password/reset`, { email, otp: otpValue, newPassword: newPass });
            toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper for OTP Change
    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otpArray];
        newOtp[index] = element.value;
        setOtpArray(newOtp);

        // Focus next input
        if (element.value && element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (!otpArray[index] && e.target.previousSibling) {
                e.target.previousSibling.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').trim();
        if (!/^\d+$/.test(data)) return; // Only numbers

        const chars = data.split('').slice(0, 6);
        const newOtp = [...otpArray];
        chars.forEach((c, i) => newOtp[i] = c);
        setOtpArray(newOtp);
    };

    return (
        <div className="user-auth-page">
            <div className="user-auth-container" style={{ textAlign: 'center', maxWidth: '600px' }}>
                <h3 className="auth-title" style={{ fontSize: '24px', marginBottom: '30px', fontWeight: 'bold' }}>
                    {step === 1 ? 'Quên mật khẩu' : step === 2 ? 'Mã OTP' : 'Tạo mật khẩu mới'}
                </h3>

                {step === 1 && (
                    <form onSubmit={handleSendOtp}>
                        <p style={{ marginBottom: '20px', color: '#666' }}>Vui lòng nhập email hoặc số điện thoại đăng ký tài khoản của bạn để nhận mã xác thực.</p>
                        <div className="user-form-group">
                            <input
                                type="text"
                                placeholder="Nhập số điện thoại hoặc Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ textAlign: 'center', fontSize: '16px', padding: '15px' }}
                            />
                        </div>
                        <button type="submit" className="auth-blue-btn" disabled={isLoading}>
                            {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp}>
                        <p style={{ marginBottom: '20px', color: '#666' }}>Mã OTP đã được gửi đến <strong>{email}</strong></p>
                        <div className="user-form-group">
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                {otpArray.map((data, index) => {
                                    return (
                                        <input
                                            className="otp-field"
                                            type="text"
                                            name="otp"
                                            maxLength="1"
                                            key={index}
                                            value={data}
                                            onChange={e => handleOtpChange(e.target, index)}
                                            onKeyDown={e => handleKeyDown(e, index)}
                                            onPaste={handlePaste}
                                            onFocus={e => e.target.select()}
                                            placeholder="-"
                                            style={{
                                                width: '45px',
                                                height: '45px',
                                                textAlign: 'center',
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                        <button type="submit" className="auth-blue-btn" disabled={isLoading}>
                            {isLoading ? 'Đang xác thực...' : 'Xác nhận mã OTP'}
                        </button>
                        <p style={{ marginTop: '20px', fontSize: '14px', cursor: 'pointer', color: '#3498db' }} onClick={() => setStep(1)}>Gửi lại OTP</p>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <p style={{ marginBottom: '20px', color: '#666' }}>Nhập mật khẩu mới cho tài khoản của bạn.</p>
                        <div className="user-form-group">
                            <input
                                type="password"
                                placeholder="Mật khẩu mới"
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                style={{ padding: '15px' }}
                            />
                        </div>
                        <div className="user-form-group">
                            <input
                                type="password"
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                style={{ padding: '15px' }}
                            />
                        </div>
                        <button type="submit" className="auth-blue-btn" disabled={isLoading}>
                            {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
