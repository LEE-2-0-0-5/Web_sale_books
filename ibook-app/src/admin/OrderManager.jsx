import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';
import AdminSidebar from './components/AdminSidebar';
import { useToast } from '../components/Toast';

const OrderManager = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
    const itemsPerPage = 10;

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
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/api/admin/orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Cập nhật đơn hàng ${orderId} thành công!`);
            window.location.reload();
        } catch (error) {
            toast.error('Cập nhật thất bại');
            console.error(error);
        }
    };

    const formatPrice = (price) => parseInt(price).toLocaleString('vi-VN') + 'đ';

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ChoXuLy': return 'Chờ xử lý';
            case 'DangXuLy': return 'Đang xử lý';
            case 'DangGiao': return 'Đang giao';
            case 'ThanhCong': return 'Đã thanh toán';
            case 'DaHuy': return 'Đã hủy';
            default: return status;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'ChoXuLy': return 'status-pending';
            case 'ThanhCong': return 'status-success';
            case 'DaHuy': return 'status-cancelled';
            default: return 'status-shipping';
        }
    };

    // Filter logic
    const filteredOrders = orders.filter(o => {
        // Search Filter
        const term = searchTerm.toLowerCase();
        const idMatch = o.id && o.id.toString().toLowerCase().includes(term);
        const nameMatch = o.customer?.name && o.customer.name.toLowerCase().includes(term);
        const phoneMatch = o.customer?.phone && o.customer.phone.includes(term);
        const matchesSearch = idMatch || nameMatch || phoneMatch;

        // Tab Filter
        let matchesTab = true;
        if (activeTab === 'pending') {
            // Show only pending/processing/shipping
            matchesTab = ['ChoXuLy', 'DangXuLy', 'DangGiao'].includes(o.status);
        } else {
            // Show completed/cancelled
            matchesTab = ['ThanhCong', 'DaHuy'].includes(o.status);
        }

        return matchesSearch && matchesTab;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Reset to page 1 when search or tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab]);

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <AdminSidebar active="orders" />

            {/* Main Content */}
            <div className="admin-content">
                {/* Header */}
                <div className="admin-header">
                    <h2 className="page-title">Quản lý đơn hàng</h2>
                    <div className="header-actions">
                        <button className="icon-btn">⚙️</button>
                        <button className="icon-btn">🔔</button>
                        <div className="user-avatar">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        </div>
                    </div>
                </div>

                {/* Detail Section */}
                {selectedOrder && (
                    <>
                        <div className="section-title">Chi tiết đơn hàng</div>
                        <div className="order-detail-card" style={{ position: 'relative' }}>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                                title="Đóng"
                            >
                                ✕
                            </button>
                            <div className="detail-grid">
                                <div>
                                    <div className="detail-row"><span className="detail-label">Mã khách hàng :</span><span className="detail-value">{selectedOrder.customer?.email || 'N/A'}</span></div>
                                    <div className="detail-row"><span className="detail-label">Tên khách hàng :</span><span className="detail-value">{selectedOrder.customer?.name}</span></div>
                                    <div className="detail-row"><span className="detail-label">Số điện thoại :</span><span className="detail-value">{selectedOrder.customer?.phone}</span></div>
                                    <div className="detail-row"><span className="detail-label">Mã đơn hàng :</span><span className="detail-value bold">#{selectedOrder.id}</span></div>
                                </div>
                                <div>
                                    <div className="detail-row"><span className="detail-label">Ngày tạo :</span><span className="detail-value">{new Date(selectedOrder.date).toLocaleString()}</span></div>
                                    <div className="detail-row"><span className="detail-label">Ghi chú :</span><span className="detail-value">{selectedOrder.note || 'Không có'}</span></div>
                                </div>
                            </div>

                            <table className="order-items-table-mini">
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Mã sản phẩm</th>
                                        <th>Tên sản phẩm</th>
                                        <th>Số lượng</th>
                                        <th>Giá tiền</th>
                                        <th>Tổng giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{item.productId}</td>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatPrice(item.price)}</td>
                                            <td>{formatPrice(item.price * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="total-row">Thành tiền : <span style={{ color: '#e74c3c' }}>{formatPrice(selectedOrder.total)}</span></div>

                            {selectedOrder.status === 'ChoXuLy' && (
                                <div className="action-buttons">
                                    <button className="btn-cancel" onClick={() => handleUpdateStatus(selectedOrder.id, 'DaHuy')}>Hủy đơn</button>
                                    <button className="btn-confirm" onClick={() => handleUpdateStatus(selectedOrder.id, 'DangGiao')}>Xác nhận giao hàng</button>
                                </div>
                            )}
                            {selectedOrder.status === 'DangGiao' && (
                                <div className="action-buttons">
                                    <button className="btn-confirm" onClick={() => handleUpdateStatus(selectedOrder.id, 'ThanhCong')}>Hoàn tất đơn hàng</button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* List Section & Search & Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '30px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', gap: '30px' }}>
                        <h3
                            style={{
                                margin: 0,
                                cursor: 'pointer',
                                borderBottom: activeTab === 'pending' ? '3px solid #3498db' : '3px solid transparent',
                                color: activeTab === 'pending' ? '#3498db' : '#999',
                                paddingBottom: '5px',
                                transition: 'all 0.3s'
                            }}
                            onClick={() => setActiveTab('pending')}
                        >
                            Đơn cần xử lý ({orders.filter(o => ['ChoXuLy', 'DangXuLy', 'DangGiao'].includes(o.status)).length})
                        </h3>
                        <h3
                            style={{
                                margin: 0,
                                cursor: 'pointer',
                                borderBottom: activeTab === 'history' ? '3px solid #3498db' : '3px solid transparent',
                                color: activeTab === 'history' ? '#3498db' : '#999',
                                paddingBottom: '5px',
                                transition: 'all 0.3s'
                            }}
                            onClick={() => setActiveTab('history')}
                        >
                            Lịch sử đơn hàng
                        </h3>
                    </div>

                    <div className="search-bar" style={{ width: '300px' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Mã đơn hàng</th>
                                <th>Khách hàng</th>
                                <th>Số điện thoại</th>
                                <th>Tổng hóa đơn</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                        {activeTab === 'pending' ? 'Không có đơn hàng nào cần xử lý' : 'Chưa có lịch sử đơn hàng'}
                                    </td>
                                </tr>
                            ) : (
                                currentOrders.map((order, index) => (
                                    <tr key={order.id}>
                                        <td>{((currentPage - 1) * itemsPerPage + index + 1).toString().padStart(2, '0')}</td>
                                        <td>{order.id}</td>
                                        <td>{order.customer?.name}</td>
                                        <td style={{ fontWeight: 'bold' }}>{order.customer?.phone}</td>
                                        <td style={{ fontWeight: 'bold' }}>{formatPrice(order.total)}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-info" onClick={() => setSelectedOrder(order)}>Thông tin</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination" style={{ justifyContent: 'center', gap: '5px' }}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{ color: '#3498db', fontWeight: 'bold' }}
                            >
                                &lt; Trước
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={currentPage === i + 1 ? 'active' : ''}
                                    style={currentPage === i + 1 ? { backgroundColor: '#1a1aff', color: 'white', borderRadius: '8px', width: '30px', height: '30px', padding: 0 } : {}}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{ color: '#3498db', fontWeight: 'bold' }}
                            >
                                Sau &gt;
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderManager;
