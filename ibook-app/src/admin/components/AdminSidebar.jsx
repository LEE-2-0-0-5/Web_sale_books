import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = ({ active }) => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('user'));
    const role = user ? user.role : '';

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/admin/login');
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            {showLogoutConfirm && (
                <div className="logout-overlay">
                    <div className="logout-confirm-box">
                        <h3>Đăng xuất</h3>
                        <p>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</p>
                        <div className="logout-actions">
                            <button className="btn-cancel-modal" onClick={cancelLogout}>Không</button>
                            <button className="btn-confirm-modal" onClick={confirmLogout}>Có</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-sidebar">
                <div className="admin-logo">Ibook<span>.com</span></div>
                <ul className="admin-menu">
                    {role === 'ADMIN' && (
                        <>
                            <li className="admin-menu-item" onClick={() => navigate('/admin/dashboard')}>
                                <span className={`admin-menu-link ${active === 'dashboard' ? 'active' : ''}`}>
                                    <span className="admin-menu-icon">📊</span>Bảng điều khiển
                                </span>
                            </li>
                            <li className="admin-menu-item" onClick={() => navigate('/admin/products')}>
                                <span className={`admin-menu-link ${active === 'products' ? 'active' : ''}`}>
                                    <span className="admin-menu-icon">📚</span>QL sản phẩm
                                </span>
                            </li>
                            <li className="admin-menu-item" onClick={() => navigate('/admin/orders')}>
                                <span className={`admin-menu-link ${active === 'orders' ? 'active' : ''}`}>
                                    <span className="admin-menu-icon">📄</span>QL đơn hàng
                                </span>
                            </li>
                            <li className="admin-menu-item" onClick={() => navigate('/admin/coupons')}>
                                <span className={`admin-menu-link ${active === 'coupons' ? 'active' : ''}`}>
                                    <span className="admin-menu-icon">🎟️</span>QL Mã Giảm Giá
                                </span>
                            </li>
                            <li className="admin-menu-item" onClick={() => navigate('/admin/customers')}>
                                <span className={`admin-menu-link ${active === 'customers' ? 'active' : ''}`}>
                                    <span className="admin-menu-icon">👥</span>QL Khách Hàng
                                </span>
                            </li>
                            <li className="admin-menu-item" onClick={() => navigate('/admin/settings')}>
                                <span className={`admin-menu-link ${active === 'settings' ? 'active' : ''}`}>
                                    <span className="admin-menu-icon">⚙️</span>Cấu hình
                                </span>
                            </li>
                        </>
                    )}
                    <li className="admin-menu-item" onClick={() => navigate('/chat')}>
                        <span className={`admin-menu-link ${active === 'chat' ? 'active' : ''}`}>
                            <span className="admin-menu-icon">💬</span>CSKH / Chat
                        </span>
                    </li>
                    <li className="admin-menu-item" onClick={handleLogoutClick}>
                        <span className="admin-menu-link">
                            <span className="admin-menu-icon">🚪</span>Đăng xuất
                        </span>
                    </li>
                </ul>
            </div>
        </>
    );
};

export default AdminSidebar;
