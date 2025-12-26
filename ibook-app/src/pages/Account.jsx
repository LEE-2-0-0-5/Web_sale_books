import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { useToast } from '../components/Toast';
import './Account.css';

const Account = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState({
        id: '',
        name: '',
        email: '',
        gender: '',
        dob: '',
        phone: '',
        address: '',
        avatar: '',
        rank: 'Thành viên',
        ordersCount: 0,
        totalSpent: 0
    });

    // Sub-pages state
    const [orders, setOrders] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [depositAmount, setDepositAmount] = useState(0);
    const [expandedOrderId, setExpandedOrderId] = useState(null); // New state for accordion

    // Cancel Order State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelOrderId, setCancelOrderId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const [showSuccessDepositModal, setShowSuccessDepositModal] = useState(false);
    const [successDepositAmount, setSuccessDepositAmount] = useState(0);
    // Removed lastKnownTxMap, using local logic inside useEffect or a simpler ref
    const pollingIntervalRef = useRef(null);

    // Sync active tab with URL
    useEffect(() => {
        if (!user.id) return;
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get('tab');
        if (tab && ['profile', 'orders', 'favorites', 'notifications', 'password', 'deposit', 'transactions', 'delivery_status', 'vouchers'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location.search, user.id]);

    // Data handling functions
    const fetchUser = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/user/${userId}`);
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const fetchOrders = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/user/${userId}/orders`);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchFavorites = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/user/${userId}/favorites`);
            setFavorites(response.data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const fetchNotifications = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/user/${userId}/notifications`);
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchAvailableVouchers = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/vouchers`, { params: { userId } });
            setAvailableVouchers(response.data);
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        }
    };

    const fetchTransactions = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/user/${userId}/transactions`);
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    // Initial load
    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (storedUser && storedUser.id) {
            setUser(prev => ({ ...prev, ...storedUser }));
            fetchUser(storedUser.id);
            fetchOrders(storedUser.id);
            fetchFavorites(storedUser.id);
            fetchNotifications(storedUser.id);
            fetchTransactions(storedUser.id);
            fetchAvailableVouchers(storedUser.id);
        } else {
            navigate('/login');
        }

        const handleAuthChange = () => {
            const updatedUser = JSON.parse(sessionStorage.getItem('user'));
            if (updatedUser && updatedUser.id) {
                fetchUser(updatedUser.id);
            }
        };

        window.addEventListener('authChange', handleAuthChange);
        return () => window.removeEventListener('authChange', handleAuthChange);
    }, [navigate]);

    // Polling Logic for Deposit
    const latestTxIdRef = useRef(0);

    useEffect(() => {
        // Stop polling if not in deposit tab or amount is 0 or user.id is missing
        if (activeTab !== 'deposit' || depositAmount <= 0 || !user.id) {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            return;
        }

        const startPolling = async () => {
            // Fetch current transactions to establish baseline (find max ID)
            try {
                const res = await axios.get(`${API_URL}/user/${user.id}/transactions?_t=${Date.now()}`);
                const transactions = res.data;

                // Find max ID currently
                let maxId = 0;
                transactions.forEach(t => {
                    if (t.MaGiaoDich > maxId) maxId = t.MaGiaoDich;
                });
                latestTxIdRef.current = maxId;
                console.log("Polling started. Max ID:", maxId);

                // Start interval
                if (!pollingIntervalRef.current) {
                    pollingIntervalRef.current = setInterval(checkForNewPayment, 3000);
                }
            } catch (err) {
                console.error("Error init polling", err);
            }
        };

        const checkForNewPayment = async () => {
            try {
                const res = await axios.get(`${API_URL}/user/${user.id}/transactions?_t=${Date.now()}`);
                const transactions = res.data;

                // Find a NEW transaction: Type=NapTien, Status=ThanhCong, and ID > latestTxIdRef
                const newTx = transactions.find(t =>
                    t.LoaiGiaoDich === 'NapTien' &&
                    t.TrangThai === 'ThanhCong' &&
                    t.MaGiaoDich > latestTxIdRef.current
                );

                if (newTx) {
                    console.log("New payment detected:", newTx);
                    // Success!
                    setSuccessDepositAmount(newTx.SoTien);
                    setShowSuccessDepositModal(true);

                    // Stop polling immediately
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }

                    // Auto reload and redirect after 5s
                    setTimeout(() => {
                        window.location.href = '/account?tab=transactions';
                    }, 5000);
                }
            } catch (error) {
                console.error("Polling check failed", error);
            }
        };

        startPolling();

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [activeTab, depositAmount, user.id]);

    // Handlers
    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/user/${user.id}`, user);
            toast.success('Cập nhật thông tin thành công!');
            const storedUser = JSON.parse(sessionStorage.getItem('user'));
            storedUser.name = user.name;
            sessionStorage.setItem('user', JSON.stringify(storedUser));
            window.dispatchEvent(new Event('authChange'));
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Cập nhật thất bại');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.warning('Mật khẩu xác nhận không khớp');
            return;
        }
        try {
            await axios.post(`${API_URL}/user/${user.id}/password`, {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            toast.success('Đổi mật khẩu thành công');
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Change password failed:', error);
            toast.error('Đổi mật khẩu thất bại');
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason) {
            toast.warning('Vui lòng chọn lý do hủy đơn hàng');
            return;
        }

        try {
            await axios.put(`${API_URL}/orders/${cancelOrderId}/cancel`, {
                reason: cancelReason
            });
            toast.success('Hủy đơn hàng thành công! Số tiền đã được hoàn lại vào tài khoản.');
            setShowCancelModal(false);
            setCancelReason('');
            setCancelOrderId(null);

            // Refresh data
            fetchUser(user.id);
            fetchOrders(user.id);
            fetchTransactions(user.id);
        } catch (error) {
            console.error('Cancel order failed:', error);
            const detailedError = error.response?.data?.message || error.message || 'Lỗi không xác định';
            toast.error(`Hủy đơn hàng thất bại: ${detailedError}`);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="profile-section">
                        <h3>Hồ sơ cá nhân</h3>
                        <form className="profile-form" onSubmit={handleUpdate}>
                            <div className="form-row">
                                <label>Tên người dùng:</label>
                                <input type="text" name="name" value={user.name || ''} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Email:</label>
                                <input type="email" name="email" value={user.email || ''} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Giới tính:</label>
                                <select name="gender" value={user.gender || ''} onChange={handleChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}>
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Ngày sinh:</label>
                                <input type="date" name="dob" value={user.dob || ''} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Điện thoại:</label>
                                <input type="text" name="phone" value={user.phone || ''} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Địa chỉ:</label>
                                <input type="text" name="address" value={user.address || ''} onChange={handleChange} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="save-btn">Áp dụng</button>
                            </div>
                        </form>
                    </div>
                );
            case 'password':
                return (
                    <div className="password-section">
                        <h3>Đổi mật khẩu</h3>
                        <form className="password-form" onSubmit={handleChangePassword}>
                            <div className="form-row">
                                <label>Mật khẩu cũ:</label>
                                <input type="password" name="oldPassword" value={passwordForm.oldPassword} onChange={handlePasswordChange} />
                            </div>
                            <div className="form-row">
                                <label>Mật khẩu mới:</label>
                                <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} />
                            </div>
                            <div className="form-row">
                                <label>Xác nhận mật khẩu mới:</label>
                                <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="save-btn">Áp dụng</button>
                            </div>
                        </form>
                    </div>
                );
            case 'orders':
                // Filter only completed orders for this tab
                const completedOrders = orders.filter(order => order.status === 'ThanhCong');
                return (
                    <div className="orders-section">
                        <h3>Đơn hàng đã mua</h3>
                        {completedOrders.length === 0 ? (
                            <p>Bạn chưa có đơn hàng nào đã giao thành công.</p>
                        ) : (
                            <div className="favorites-list">
                                {completedOrders.map((order, index) => {
                                    const firstItem = order.items[0] || {};
                                    return (
                                        <div key={order.id} className="favorite-item">
                                            <span className="item-index">{index + 1}</span>
                                            <img src={firstItem.image} alt={firstItem.name} />
                                            <div className="item-details">
                                                <h4>Đơn hàng #{order.id}</h4>
                                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
                                                    {firstItem.name} {order.items.length > 1 ? `(+${order.items.length - 1} sản phẩm)` : ''}
                                                </p>
                                                <span style={{ fontSize: '12px', color: '#999' }}>{new Date(order.date).toLocaleString('vi-VN')}</span>
                                            </div>
                                            <div className="item-price">
                                                {parseInt(order.total).toLocaleString('vi-VN')}đ
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            case 'favorites':
                return (
                    <div className="favorites-section">
                        <h3>Sản phẩm yêu thích</h3>
                        <div className="favorites-list">
                            {favorites.length === 0 ? <p>Chưa có sản phẩm yêu thích.</p> : favorites.map((product, index) => (
                                <div
                                    key={product.id}
                                    className="favorite-item"
                                    onClick={() => navigate(`/product/${product.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="item-index">{index + 1}</span>
                                    <img src={product.image} alt={product.title} />
                                    <div className="item-details">
                                        <h4>{product.title}</h4>
                                    </div>
                                    <div className="item-price">
                                        {parseInt(product.price).toLocaleString('vi-VN')}đ
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="notifications-section">
                        <h3>Thông báo</h3>
                        <div className="notifications-list">
                            {notifications.length === 0 ? <p>Không có thông báo nào.</p> : notifications.map(notif => (
                                <div key={notif.MaThongBao} className="notification-item">
                                    <h4>{notif.TieuDe}</h4>
                                    <p>{notif.NoiDung}</p>
                                    <span className="notif-date">{new Date(notif.NgayTao).toLocaleString('vi-VN')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'delivery_status':
                return (
                    <div className="delivery-status-section">
                        <h3>Trạng thái giao hàng</h3>
                        {orders.length === 0 ? <p>Chưa có đơn hàng nào đang xử lý.</p> : (
                            <div className="delivery-list">
                                {orders.map(order => {
                                    const isExpanded = expandedOrderId === order.id;
                                    return (
                                        <div key={order.id} className="delivery-item-card" style={{ marginBottom: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                            {/* Header - Always visible */}
                                            <div
                                                className="delivery-header"
                                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                                style={{
                                                    padding: '15px',
                                                    background: 'var(--bg-body)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <strong>Đơn hàng #{order.id}</strong>
                                                    <span style={{ marginLeft: '10px', fontSize: '13px', color: 'var(--text-light)' }}>
                                                        {new Date(order.date).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <span style={{
                                                        color: order.status === 'ThanhCong' ? '#27ae60' : (order.status === 'DaHuy' ? '#e74c3c' : '#0984e3'),
                                                        fontWeight: '500'
                                                    }}>
                                                        {order.status === 'ChoXuLy' ? 'Chờ xử lý' :
                                                            order.status === 'DangXuLy' ? 'Đang xử lý' :
                                                                order.status === 'DangGiao' ? 'Đang giao' :
                                                                    order.status === 'ThanhCong' ? 'Giao thành công' :
                                                                        order.status === 'DaHuy' ? 'Đã hủy' : order.status}
                                                    </span>
                                                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: '#aaa' }}></i>
                                                </div>
                                            </div>

                                            {/* Body - Collapsible */}
                                            {isExpanded && (
                                                <div className="delivery-body" style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
                                                    {/* Status Timeline - Only show if NOT cancelled */}
                                                    {order.status !== 'DaHuy' && (
                                                        <div className="status-timeline" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '30px' }}>
                                                            <div style={{ position: 'absolute', top: '12px', left: '0', right: '0', height: '4px', background: 'var(--border-color)', zIndex: 1 }}></div>
                                                            {['ChoXuLy', 'DangXuLy', 'DangGiao', 'ThanhCong'].map((step, index) => {
                                                                let label = '';
                                                                let isActive = false;
                                                                if (step === 'ChoXuLy') label = 'Chờ xử lý';
                                                                if (step === 'DangXuLy') label = 'Chuẩn bị hàng';
                                                                if (step === 'DangGiao') label = 'Đang giao';
                                                                if (step === 'ThanhCong') label = 'Giao thành công';

                                                                const statusOrder = ['ChoXuLy', 'DangXuLy', 'DangGiao', 'ThanhCong'];
                                                                const currentIdx = statusOrder.indexOf(order.status);
                                                                const stepIdx = statusOrder.indexOf(step);

                                                                if (currentIdx >= stepIdx) isActive = true;

                                                                return (
                                                                    <div key={step} style={{ textAlign: 'center', zIndex: 2, position: 'relative', width: '25%' }}>
                                                                        <div style={{
                                                                            width: '25px', height: '25px', borderRadius: '50%',
                                                                            background: isActive ? '#00b894' : 'var(--border-color)',
                                                                            margin: '0 auto 5px', border: '3px solid var(--bg-white)',
                                                                            boxShadow: '0 0 0 1px var(--border-color)'
                                                                        }}></div>
                                                                        <span style={{ fontSize: '12px', color: isActive ? 'var(--text-main)' : 'var(--text-light)', fontWeight: isActive ? 'bold' : 'normal' }}>{label}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}

                                                    <div className="delivery-products">
                                                        <h5 style={{ marginBottom: '10px', color: 'var(--text-main)' }}>Sản phẩm ({order.items.length})</h5>
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '10px', paddingBottom: '10px', borderBottom: idx === order.items.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                                                <img src={item.image} alt={item.name} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                                                <div>
                                                                    <div style={{ fontWeight: '500', marginBottom: '5px' }}>{item.name}</div>
                                                                    <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Số lượng: {item.quantity}</div>
                                                                    <div style={{ fontSize: '13px', color: '#e74c3c', fontWeight: 'bold' }}>{parseInt(item.price).toLocaleString('vi-VN')}đ</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div style={{ textAlign: 'right', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                {order.status === 'ChoXuLy' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setCancelOrderId(order.id);
                                                                            setShowCancelModal(true);
                                                                        }}
                                                                        style={{
                                                                            background: 'var(--bg-white)',
                                                                            border: '1px solid #e74c3c',
                                                                            color: '#e74c3c',
                                                                            padding: '8px 15px',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '13px'
                                                                        }}
                                                                    >
                                                                        Hủy đơn hàng
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div>
                                                                Tổng tiền: <span style={{ color: '#d35400', fontSize: '18px', fontWeight: 'bold' }}>{parseInt(order.total).toLocaleString('vi-VN')}đ</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Cancel Order Modal */}
                        {showCancelModal && (
                            <div className="modal-overlay" style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                            }}>
                                <div className="modal-content" style={{
                                    background: 'white', padding: '25px', borderRadius: '8px', width: '400px', maxWidth: '90%'
                                }}>
                                    <h4 style={{ marginTop: 0 }}>Hủy đơn hàng #{cancelOrderId}</h4>
                                    <p style={{ marginBottom: '15px' }}>Vui lòng chọn lý do hủy đơn hàng:</p>
                                    <div className="reasons-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                        {['Muốn thay đổi địa chỉ giao hàng', 'Muốn nhập/thay đổi mã Voucher', 'Thủ tục thanh toán quá rắc rối', 'Tìm thấy giá rẻ hơn ở nơi khác', 'Đổi ý, không muốn mua nữa'].map(reason => (
                                            <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="cancelReason"
                                                    value={reason}
                                                    checked={cancelReason === reason}
                                                    onChange={(e) => setCancelReason(e.target.value)}
                                                />
                                                {reason}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button
                                            onClick={() => setShowCancelModal(false)}
                                            style={{
                                                padding: '8px 15px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer'
                                            }}
                                        >
                                            Đóng
                                        </button>
                                        <button
                                            onClick={handleCancelOrder}
                                            style={{
                                                padding: '8px 15px', border: 'none', background: '#e74c3c', color: 'white', borderRadius: '4px', cursor: 'pointer'
                                            }}
                                        >
                                            Xác nhận hủy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'deposit':
                return (
                    <div className="deposit-section">
                        <h3>Nạp tiền vào tài khoản</h3>
                        <div className="deposit-container">
                            <div className="amount-selection">
                                <label>Chọn mệnh giá nạp:</label>
                                <div className="amount-buttons">
                                    {[50000, 100000, 200000, 500000].map(amount => (
                                        <button
                                            key={amount}
                                            className={`amount-btn ${depositAmount === amount ? 'active' : ''}`}
                                            onClick={() => setDepositAmount(amount)}
                                        >
                                            {parseInt(amount).toLocaleString('vi-VN')}đ
                                        </button>
                                    ))}
                                </div>
                                <div className="custom-amount">
                                    <label>Hoặc nhập số tiền khác:</label>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                                        placeholder="Nhập số tiền..."
                                        min="10000"
                                    />
                                </div>
                            </div>

                            {depositAmount > 0 && (
                                <div className="qr-section">
                                    <h4>Quét mã QR để thanh toán</h4>
                                    <div className="qr-code">
                                        <img
                                            src={`https://img.vietqr.io/image/mb-0374801034-compact.png?amount=${depositAmount}&addInfo=IBOOK NAP ${user.id}`}
                                            alt="QR Code"
                                        />
                                    </div>
                                    <div className="transfer-info">
                                        <p><strong>Ngân hàng:</strong> MB Bank</p>
                                        <p><strong>Số tài khoản:</strong> 0374801034</p>
                                        <p><strong>Chủ tài khoản:</strong> DAO DUY KHANH</p>
                                        <p><strong>Số tiền:</strong> {parseInt(depositAmount).toLocaleString('vi-VN')}đ</p>
                                        <p><strong>Nội dung:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>IBOOK NAP {user.id}</span></p>
                                    </div>

                                    <div className="payment-status" style={{ textAlign: 'center', padding: '15px', background: '#e8f6f3', borderRadius: '4px', border: '1px solid #27ae60' }}>
                                        <div className="spinner" style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #ccc', borderTop: '3px solid #27ae60', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '10px', verticalAlign: 'middle' }}></div>
                                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Đang chờ thanh toán...</span>
                                        <p style={{ fontSize: '13px', margin: '5px 0 0 0', color: '#555' }}>Hệ thống đang tự động kiểm tra giao dịch mỗi 3 giây.</p>
                                    </div>


                                    <p className="note">* Nội dung chuyển khoản bắt buộc phải đúng: <strong>IBOOK NAP {user.id}</strong></p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'transactions':
                return (
                    <div className="transactions-section">
                        <h3>Lịch sử giao dịch</h3>
                        <div className="transactions-list">
                            {transactions.length === 0 ? (
                                <p>Chưa có giao dịch nào.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Mã GD</th>
                                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Loại</th>
                                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Số tiền</th>
                                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Trạng thái</th>
                                            <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(trans => (
                                            <tr key={trans.MaGiaoDich}>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>#{trans.MaGiaoDich}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                                    {trans.LoaiGiaoDich === 'NapTien' ? 'Nạp tiền' :
                                                        trans.LoaiGiaoDich === 'HoanTien' ? 'Hoàn tiền' :
                                                            trans.LoaiGiaoDich === 'ThanhToan' ? 'Thanh toán' : trans.LoaiGiaoDich}
                                                </td>
                                                <td style={{
                                                    padding: '10px',
                                                    borderBottom: '1px solid #eee',
                                                    color: trans.TrangThai !== 'ThanhCong' ? '#7f8c8d' :
                                                        (trans.LoaiGiaoDich === 'NapTien' || trans.LoaiGiaoDich === 'HoanTien' ? 'green' : 'red'),
                                                    fontWeight: 'bold'
                                                }}>
                                                    {trans.TrangThai !== 'ThanhCong' ? '+0' :
                                                        (trans.LoaiGiaoDich === 'NapTien' || trans.LoaiGiaoDich === 'HoanTien' ? '+' : '-')}
                                                    {trans.TrangThai !== 'ThanhCong' ? '' : parseInt(trans.SoTien).toLocaleString('vi-VN')}đ
                                                </td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        background: trans.TrangThai === 'ThanhCong' ? '#d4edda' : '#f8d7da',
                                                        color: trans.TrangThai === 'ThanhCong' ? '#155724' : '#721c24'
                                                    }}>
                                                        {trans.TrangThai === 'ThanhCong' ? 'Thành công' : 'Thất bại'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px', color: '#666' }}>
                                                    {new Date(trans.NgayGiaoDich).toLocaleString('vi-VN')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                );
            case 'vouchers':
                return (
                    <div className="vouchers-section">
                        <h3>Kho Voucher</h3>
                        {availableVouchers.length === 0 ? (
                            <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                <i className="fas fa-ticket-alt" style={{ fontSize: '48px', marginBottom: '20px', color: '#ccc' }}></i>
                                <p>Kho voucher của bạn đang trống.</p>
                                <button className="primary-btn" onClick={() => navigate('/')} style={{ marginTop: '15px', padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Săn voucher ngay</button>
                            </div>
                        ) : (
                            <div className="vouchers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                {availableVouchers.map((voucher, index) => (
                                    <div key={index} className="voucher-card" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', display: 'flex', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <div className="voucher-left" style={{ backgroundColor: '#3498db', color: 'white', width: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{voucher.type === 'percent' ? `-${voucher.value * 100}%` : 'FREE'}</div>
                                            <div style={{ fontSize: '12px' }}>VOUCHER</div>
                                        </div>
                                        <div className="voucher-right" style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{voucher.code}</h4>
                                            <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>{voucher.description}</p>
                                            <div style={{ marginTop: '10px' }}>
                                                <button onClick={() => { navigator.clipboard.writeText(voucher.code); toast.info('Đã sao chép mã ' + voucher.code); }} style={{ padding: '5px 10px', fontSize: '12px', border: '1px solid #3498db', background: 'white', color: '#3498db', borderRadius: '4px', cursor: 'pointer' }}>Sao chép</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="account-page">
            {showSuccessDepositModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '40px', borderRadius: '12px', width: '450px', maxWidth: '90%', textAlign: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', background: '#27ae60', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                        }}>
                            <i className="fas fa-check" style={{ fontSize: '40px', color: 'white' }}></i>
                        </div>
                        <h2 style={{ color: '#27ae60', marginBottom: '10px' }}>Nạp tiền thành công!</h2>
                        <p style={{ fontSize: '18px', color: '#333', marginBottom: '20px' }}>
                            Bạn đã nạp thành công <span style={{ fontWeight: 'bold', color: '#d35400' }}>{parseInt(successDepositAmount).toLocaleString('vi-VN')}đ</span> vào tài khoản.
                        </p>
                        <p style={{ fontSize: '14px', color: '#7f8c8d' }}>
                            Trang sẽ tự động tải lại sau 5 giây...
                        </p>
                        <div style={{ marginTop: '20px', fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                            <i className="fas fa-spinner fa-spin"></i>
                        </div>
                    </div>
                </div>
            )}
            <div className="account-container">
                {/* Sidebar */}
                <div className="account-sidebar">
                    {(() => {
                        const points = Math.floor((parseInt(user.totalSpent) || 0) / 1000);
                        let rankName = 'Đồng';
                        let nextRankPoints = 5000;
                        let rankColor = '#cd7f32'; // Bronze

                        if (points >= 2501) { rankName = 'Kim Cương'; nextRankPoints = points; rankColor = '#9b59b6'; } // Purple
                        else if (points >= 1001) { rankName = 'Vàng'; nextRankPoints = 2501; rankColor = '#f1c40f'; } // Gold
                        else if (points >= 501) { rankName = 'Bạc'; nextRankPoints = 1001; rankColor = '#bdc3c7'; } // Silver
                        else { nextRankPoints = 501; rankColor = '#cd7f32'; } // Bronze

                        const progress = Math.min(100, (points / nextRankPoints) * 100);
                        const radius = 46;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDashoffset = circumference - (progress / 100) * circumference;

                        return (
                            <div className="member-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                                <div className="badge-wrapper" style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {/* Progress Circle */}
                                    <svg width="100" height="100" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                                        <circle cx="50" cy="50" r={radius} stroke="var(--border-color)" strokeWidth="4" fill="transparent" />
                                        <circle cx="50" cy="50" r={radius} stroke={rankColor} strokeWidth="4" fill="transparent"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    {/* Avatar/Rank Icon */}
                                    <div className="badge-inner" style={{ width: '82px', height: '82px', borderRadius: '50%', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-body)', zIndex: 1 }}>
                                        {user.avatar ? (
                                            <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontWeight: 'bold', color: '#7f8c8d', fontSize: '12px' }}>{rankName === 'Đồng' ? 'BRONZE' : (rankName === 'Bạc' ? 'SILVER' : (rankName === 'Vàng' ? 'GOLD' : 'DIAMOND'))}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Rank Name Badge (Red Circle) */}
                                <div className="rank-label" style={{
                                    marginTop: '-10px',
                                    background: 'var(--border-color)',
                                    padding: '4px 15px',
                                    borderRadius: '15px',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: 'var(--text-main)',
                                    zIndex: 2,
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {rankName}
                                </div>

                                {/* Points Progress */}
                                <div className="rank-points" style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                                    {points}/{nextRankPoints} điểm
                                </div>
                            </div>
                        );
                    })()}

                    <nav className="account-nav">
                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=profile')}
                        >
                            <i className="fas fa-user"></i> Hồ sơ cá nhân
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'delivery_status' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=delivery_status')}
                        >
                            <i className="fas fa-truck"></i> Trạng thái giao hàng
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=favorites')}
                        >
                            <i className="fas fa-heart"></i> Sản phẩm yêu thích
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=orders')}
                        >
                            <i className="fas fa-shopping-bag"></i> Đơn hàng đã mua
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'deposit' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=deposit')}
                        >
                            <i className="fas fa-wallet"></i> Nạp tiền
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=transactions')}
                        >
                            <i className="fas fa-history"></i> Lịch sử giao dịch
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'vouchers' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=vouchers')}
                        >
                            <i className="fas fa-ticket-alt"></i> Kho Voucher
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=password')}
                        >
                            <i className="fas fa-key"></i> Đổi mật khẩu
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => navigate('/account?tab=notifications')}
                        >
                            <i className="fas fa-bell"></i> Thông báo
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="account-content">
                    {/* Top Banner / Stats - Only show on profile tab or always? Design shows title "Tài khoản" on top always */}


                    {activeTab === 'profile' && (
                        <div className="account-stats">
                            <h3>Thành tích năm 2024</h3>
                            <div className="stats-grid">
                                <div className="stat-box">
                                    <span className="stat-label">Số đơn hàng</span>
                                    <span className="stat-value">{user.ordersCount}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Đã thanh toán</span>
                                    <span className="stat-value">{parseInt(user.totalSpent).toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Account;
