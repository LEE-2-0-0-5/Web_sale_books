import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import { useToast } from '../components/Toast';

const CouponManager = () => {
    // ... (rest of the component state/logic unchanged)
    const navigate = useNavigate();
    const toast = useToast();
    const [coupons, setCoupons] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [conditionMode, setConditionMode] = useState('all'); // 'all' or 'custom'
    const [formData, setFormData] = useState({
        code: '', percent: '', startDate: '', expiry: '', quantity: '', description: '', conditions: ''
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
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await axios.get('/api/admin/coupons');
            setCoupons(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (c) => {
        let condValues = '';
        let mode = 'all';

        try {
            if (c.DieuKien) {
                // Check if it's empty JSON or meaningful
                const parsed = typeof c.DieuKien === 'object' ? c.DieuKien : JSON.parse(c.DieuKien);
                if (Object.keys(parsed).length > 0 && JSON.stringify(parsed) !== '{}') {
                    mode = 'custom';
                    condValues = JSON.stringify(parsed);
                }
            }
        } catch (e) {
            // If string and not empty, assume custom
            if (c.DieuKien && c.DieuKien !== '{}') {
                mode = 'custom';
                condValues = c.DieuKien;
            }
        }

        setConditionMode(mode);
        setFormData({
            code: c.MaGiamGia,
            percent: c.PhanTramGiam,
            startDate: c.NgayBatDau ? new Date(c.NgayBatDau).toISOString().split('T')[0] : '',
            expiry: c.NgayHetHan ? new Date(c.NgayHetHan).toISOString().split('T')[0] : '',
            quantity: c.SoLuong,
            description: c.MoTa || '',
            conditions: condValues
        });
        setIsEditing(true);
        document.querySelector('.product-form-card').scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancel = () => {
        setFormData({ code: '', percent: '', startDate: '', expiry: '', quantity: '', description: '', conditions: '' });
        setConditionMode('all');
        setIsEditing(false);
    };

    const handleSubmit = async () => {
        try {
            // Validate JSON if Custom Mode
            let payloadConditions = null;
            if (conditionMode === 'custom') {
                if (!formData.conditions) {
                    toast.warning('Vui lòng nhập điều kiện hoặc chuyển sang chế độ "Áp dụng tất cả"');
                    return;
                }
                try {
                    JSON.parse(formData.conditions);
                } catch (e) {
                    toast.error('Điều kiện phải là đúng định dạng JSON!');
                    return;
                }
                payloadConditions = formData.conditions;
            } else {
                payloadConditions = '{}'; // Empty JSON for 'All'
            }

            const payload = { ...formData, conditions: payloadConditions };

            if (isEditing) {
                await axios.put(`/api/admin/coupons/${formData.code}`, payload);
                toast.success('Cập nhật mã giảm giá thành công');
            } else {
                await axios.post('/api/admin/coupons', payload);
                toast.success('Thêm mã giảm giá thành công');
            }
            fetchCoupons();
            handleCancel();
        } catch (error) {
            console.error('Coupon Error:', error);
            // Show detailed error if available
            const msg = error.response?.data?.sqlMessage || error.response?.data?.message || JSON.stringify(error.response?.data) || 'Lỗi thao tác';
            toast.error('Lỗi: ' + msg);
        }
    };

    const handleDelete = async (code) => {
        if (!window.confirm('Xóa mã này?')) return;
        try {
            await axios.delete(`/api/admin/coupons/${code}`);
            fetchCoupons();
            toast.success('Xóa thành công');
        } catch (error) {
            console.error(error);
            toast.error('Không thể xóa: ' + (error.response?.data?.message || 'Lỗi hệ thống'));
        }
    };

    return (
        <div className="admin-container">
            <AdminSidebar active="coupons" />

            <div className="admin-content">
                <div className="admin-header">
                    <h2 className="page-title">Quản lý Mã Giảm Giá</h2>
                    <div className="header-actions">
                        <div className="user-avatar">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="card product-form-card" style={{ width: '100%' }}>
                        <h3 className="section-title">{isEditing ? 'Cập Nhật Mã' : 'Thêm Mã Mới'}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Mã Code (Ví dụ: SALE50):</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    className="admin-input"
                                    style={{ textTransform: 'uppercase', backgroundColor: isEditing ? '#eee' : 'white' }}
                                    disabled={isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phần trăm giảm (%):</label>
                                <input type="number" name="percent" value={formData.percent} onChange={handleInputChange} className="admin-input" />
                            </div>
                            <div className="form-group">
                                <label>Ngày bắt đầu:</label>
                                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="admin-input" />
                            </div>
                            <div className="form-group">
                                <label>Ngày hết hạn:</label>
                                <input type="date" name="expiry" value={formData.expiry} onChange={handleInputChange} className="admin-input" />
                            </div>
                            <div className="form-group">
                                <label>Số lượng:</label>
                                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} className="admin-input" placeholder="100" />
                            </div>
                            <div className="form-group full-width">
                                <label>Mô tả:</label>
                                <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="admin-input" />
                            </div>

                            {/* Condition Dropdown and Visual Builder */}
                            <div className="form-group full-width" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                                <label style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px', display: 'block' }}>Phạm vi áp dụng:</label>
                                <select
                                    className="admin-input"
                                    value={conditionMode}
                                    onChange={(e) => {
                                        setConditionMode(e.target.value);
                                        // Reset JSON if switching to ALL
                                        if (e.target.value === 'all') {
                                            setFormData(prev => ({ ...prev, conditions: '{}' }));
                                        }
                                    }}
                                    style={{ marginBottom: '15px' }}
                                >
                                    <option value="all">Áp dụng cho tất cả (Mặc định)</option>
                                    <option value="custom">Tùy chỉnh điều kiện (Giới tính, Hạng, Ngày...)</option>
                                </select>

                                {conditionMode === 'custom' && (
                                    <div className="condition-builder" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        {/* Gender */}
                                        <div className="cb-item">
                                            <label style={{ fontSize: '0.9rem' }}>Giới tính:</label>
                                            <select
                                                className="admin-input"
                                                value={formData.conditions ? (JSON.parse(formData.conditions || '{}').gioiTinh || '') : ''}
                                                onChange={(e) => {
                                                    const current = JSON.parse(formData.conditions || '{}');
                                                    if (e.target.value) current.gioiTinh = e.target.value;
                                                    else delete current.gioiTinh;
                                                    setFormData(prev => ({ ...prev, conditions: JSON.stringify(current) }));
                                                }}
                                            >
                                                <option value="">Tất cả</option>
                                                <option value="Nam">Nam</option>
                                                <option value="Nữ">Nữ</option>
                                            </select>
                                        </div>

                                        {/* Rank */}
                                        <div className="cb-item">
                                            <label style={{ fontSize: '0.9rem' }}>Hạng thành viên:</label>
                                            <select
                                                className="admin-input"
                                                value={formData.conditions ? (JSON.parse(formData.conditions || '{}').hang || '') : ''}
                                                onChange={(e) => {
                                                    const current = JSON.parse(formData.conditions || '{}');
                                                    if (e.target.value) current.hang = e.target.value;
                                                    else delete current.hang;
                                                    setFormData(prev => ({ ...prev, conditions: JSON.stringify(current) }));
                                                }}
                                            >
                                                <option value="">Tất cả</option>
                                                <option value="Thành viên">Thành viên</option>
                                                <option value="Bạc">Bạc</option>
                                                <option value="Vàng">Vàng</option>
                                                <option value="Kim Cương">Kim Cương</option>
                                            </select>
                                        </div>

                                        {/* Special Date */}
                                        <div className="cb-item" style={{ gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.9rem' }}>Ngày đặc biệt (Ví dụ 8/3):</label>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input
                                                    type="number"
                                                    placeholder="Ngày (1-31)"
                                                    className="admin-input"
                                                    min="1" max="31"
                                                    value={formData.conditions ? (JSON.parse(formData.conditions || '{}').ngay || '') : ''}
                                                    onChange={(e) => {
                                                        const current = JSON.parse(formData.conditions || '{}');
                                                        if (e.target.value) current.ngay = parseInt(e.target.value);
                                                        else delete current.ngay;
                                                        setFormData(prev => ({ ...prev, conditions: JSON.stringify(current) }));
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Tháng (1-12)"
                                                    className="admin-input"
                                                    min="1" max="12"
                                                    value={formData.conditions ? (JSON.parse(formData.conditions || '{}').thang || '') : ''}
                                                    onChange={(e) => {
                                                        const current = JSON.parse(formData.conditions || '{}');
                                                        if (e.target.value) current.thang = parseInt(e.target.value);
                                                        else delete current.thang;
                                                        setFormData(prev => ({ ...prev, conditions: JSON.stringify(current) }));
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Min Total */}
                                        <div className="cb-item" style={{ gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.9rem' }}>Đơn tối thiểu (VNĐ):</label>
                                            <input
                                                type="number"
                                                className="admin-input"
                                                placeholder="VD: 500000"
                                                value={formData.conditions ? (JSON.parse(formData.conditions || '{}').minTotal || '') : ''}
                                                onChange={(e) => {
                                                    const current = JSON.parse(formData.conditions || '{}');
                                                    if (e.target.value) current.minTotal = parseInt(e.target.value);
                                                    else delete current.minTotal;
                                                    setFormData(prev => ({ ...prev, conditions: JSON.stringify(current) }));
                                                }}
                                            />
                                        </div>

                                        {/* Preview (Debug) */}
                                        <div style={{ gridColumn: 'span 2', fontSize: '0.8rem', color: '#888' }}>
                                            Preview Logic: <code>{formData.conditions}</code>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-actions">
                            {isEditing && (
                                <button className="btn-cancel" onClick={handleCancel}>Hủy</button>
                            )}
                            <button className={isEditing ? 'btn-primary' : 'btn-success'} onClick={handleSubmit} style={{ minWidth: '120px' }}>
                                {isEditing ? 'Cập Nhật' : 'Thêm Mã'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="products-table-container" style={{ marginTop: '20px' }}>
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Mã Code</th>
                                <th>Giảm giá</th>
                                <th>Hạn dùng</th>
                                <th>Còn lại</th>
                                <th>Điều kiện</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">Chưa có mã giảm giá nào</td></tr>
                            ) : (
                                coupons.map(c => (
                                    <tr key={c.MaGiamGia}>
                                        <td><span className="status-badge status-pending" style={{ color: '#333', borderColor: '#333' }}>{c.MaGiamGia}</span></td>
                                        <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>{c.PhanTramGiam}%</td>
                                        <td>
                                            {c.NgayBatDau ? new Date(c.NgayBatDau).toLocaleDateString('vi-VN') : ''} - {new Date(c.NgayHetHan).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td>{c.SoLuong}</td>
                                        <td>
                                            {(!c.DieuKien || c.DieuKien === '{}') ? (
                                                <span className="status-badge status-success">Tất cả</span>
                                            ) : (
                                                <span title={JSON.stringify(c.DieuKien)} style={{ fontSize: '0.8rem', color: '#666' }}>
                                                    {typeof c.DieuKien === 'object' ? JSON.stringify(c.DieuKien).substring(0, 20) + '...' : c.DieuKien.substring(0, 20) + '...'}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <button className="icon-btn" onClick={() => handleEdit(c)} title="Sửa">✏️</button>
                                            <button className="icon-btn" onClick={() => handleDelete(c.MaGiamGia)} style={{ color: 'red', marginLeft: '10px' }} title="Xóa">🗑️</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CouponManager;
