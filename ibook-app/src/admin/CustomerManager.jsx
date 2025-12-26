import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import { useToast } from '../components/Toast';

const CustomerManager = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '', phone: '', email: '', address: '', balance: 0
    });

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || user.role === 'CUSTOMER') {
            navigate('/admin/login');
            return;
        }
        if (user.role === 'CHAT') {
            navigate('/chat', { replace: true });
            return;
        }
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get('/api/admin/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleStatus = async (id) => {
        if (!window.confirm('Bạn có chắc muốn khóa/mở khóa tài khoản này?')) return;
        try {
            await axios.delete(`/api/admin/customers/${id}`);
            fetchCustomers();
            toast.success('Đã thay đổi trạng thái');
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi thay đổi trạng thái');
        }
    };

    const handleEditClick = (c) => {
        setSelectedCustomer(c);
        setEditForm({
            name: c.HoTen || '',
            phone: c.SoDienThoai || '',
            email: c.Email || c.TaiKhoan || '',
            address: c.DiaChi || '',
            balance: c.SoDu || 0
        });
    };

    const handleEditSave = async () => {
        try {
            await axios.put(`/api/admin/customers/${selectedCustomer.MaKhachHang}`, editForm);
            toast.success('Cập nhật thông tin thành công');
            fetchCustomers();
            setSelectedCustomer(null);
        } catch (error) {
            toast.error('Cập nhật thất bại');
            console.error(error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="admin-container">
            <AdminSidebar active="customers" />

            <div className="admin-content">
                <div className="admin-header">
                    <h2 className="page-title">Quản lý Khách Hàng</h2>
                    <div className="header-actions">
                        <div className="user-avatar">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        </div>
                    </div>
                </div>

                <div className="products-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Mã KH</th>
                                <th>Tên Khách Hàng</th>
                                <th>Email</th>
                                <th>SĐT</th>
                                <th>Số đơn</th>
                                <th>Chi tiêu</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr><td colSpan="8" className="text-center">Chưa có khách hàng nào</td></tr>
                            ) : (
                                customers.map(c => (
                                    <tr key={c.MaKhachHang}>
                                        <td>{c.MaKhachHang}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img src={c.AnhDaiDien || `https://ui-avatars.com/api/?name=${c.HoTen}&background=random`} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                                {c.HoTen}
                                            </div>
                                        </td>
                                        <td>{c.Email || c.TaiKhoan}</td>
                                        <td>{c.SoDienThoai || '-'}</td>
                                        <td className="text-center">{c.OrderCount}</td>
                                        <td className="text-right" style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                                            {parseInt(c.TotalSpent).toLocaleString('vi-VN')}đ
                                        </td>
                                        <td>
                                            {c.IsActive === 1 ? (
                                                <span className="status-badge status-success">Hoạt động</span>
                                            ) : (
                                                <span className="status-badge status-cancelled">Đã khóa</span>
                                            )}
                                        </td>
                                        <td>
                                            <button className="icon-btn" onClick={() => handleEditClick(c)} title="Sửa thông tin">✏️</button>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => handleToggleStatus(c.MaKhachHang)}
                                                style={{ padding: '5px 10px', fontSize: '10px', marginLeft: '10px', background: c.IsActive === 1 ? '#e74c3c' : '#2ecc71', color: 'white', border: 'none' }}
                                            >
                                                {c.IsActive === 1 ? 'Khóa' : 'Mở'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edit Modal */}
                {selectedCustomer && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Sửa thông tin khách hàng</h3>

                            <div className="form-group">
                                <label>Họ tên:</label>
                                <input className="admin-input" name="name" value={editForm.name} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Email:</label>
                                <input className="admin-input" name="email" value={editForm.email} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại:</label>
                                <input className="admin-input" name="phone" value={editForm.phone} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ:</label>
                                <input className="admin-input" name="address" value={editForm.address} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Số dư ví (VND):</label>
                                <input type="number" className="admin-input" name="balance" value={editForm.balance} onChange={handleChange} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button className="btn-cancel" onClick={() => setSelectedCustomer(null)}>Hủy</button>
                                <button className="btn-primary" onClick={handleEditSave}>Lưu thay đổi</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerManager;
