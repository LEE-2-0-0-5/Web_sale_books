import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Checkout.css';
import { API_URL } from '../apiConfig';
import { useToast } from '../components/Toast';

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        note: '',
        paymentMethod: 'wallet'
    });
    const [shippingMethod, setShippingMethod] = useState('fast'); // 'fast' or 'express'

    useEffect(() => {
        // Fetch User Data
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (storedUser && storedUser.id) {
            fetch(`${API_URL}/user/${storedUser.id}`)
                .then(res => res.json())
                .then(data => setUser(data))
                .catch(err => console.error(err));
        }

        // Fetch Vouchers
        let voucherUrl = `${API_URL}/vouchers`;
        if (storedUser && storedUser.id) {
            voucherUrl += `?userId=${storedUser.id}`;
        }
        fetch(voucherUrl)
            .then(res => res.json())
            .then(data => setVouchers(data))
            .catch(err => console.error(err));

        // Check for direct buy item from ProductDetail
        if (location.state && location.state.directBuyItem) {
            const item = location.state.directBuyItem;
            setCartItems([{ ...item, quantity: 1 }]);
        } else if (storedUser && storedUser.id) {
            // Fetch Cart from API if user logged in
            fetch(`${API_URL}/cart/${storedUser.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length === 0) {
                        // Fallback to local if empty? Or just empty.
                        // User said "day du lieu tu db", so trust DB.
                        // But if DB is empty and localStorage has items (from before login), maybe sync?
                        // For now just trust DB.
                        setCartItems([]);
                    } else {
                        setCartItems(data);
                    }
                })
                .catch(err => console.error(err));
        } else {
            // Fallback to cart from localStorage
            const items = JSON.parse(localStorage.getItem('cart') || '[]');
            if (items.length === 0) {
                navigate('/cart');
            }
            const itemsWithQty = items.map(item => ({ ...item, quantity: item.quantity || 1 }));
            setCartItems(itemsWithQty);
        }

        // Restore Coupon
        const savedCoupon = localStorage.getItem('appliedCoupon');
        const savedCode = localStorage.getItem('couponCode');
        if (savedCoupon && savedCode) {
            try {
                setAppliedCoupon(JSON.parse(savedCoupon));
                setCouponCode(savedCode);
            } catch (e) { localStorage.removeItem('appliedCoupon'); }
        }
    }, [navigate, location.state]);

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = shippingMethod === 'fast' ? 20000 : 30000;
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    const finalTotal = Math.max(0, total + shippingFee - discount);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            const response = await fetch(`${API_URL}/vouchers/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, totalAmount: total })
            });
            const data = await response.json();
            if (response.ok) {
                setAppliedCoupon(data);
                localStorage.setItem('appliedCoupon', JSON.stringify(data));
                localStorage.setItem('couponCode', couponCode);
                toast.success(`Áp dụng mã ${data.code} thành công! Giảm ${parseInt(data.discount).toLocaleString('vi-VN')}đ`);
            } else {
                toast.error(data.message);
                setAppliedCoupon(null);
                localStorage.removeItem('appliedCoupon');
                localStorage.removeItem('couponCode');
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
            toast.error('Lỗi khi áp dụng mã giảm giá');
        }
    };

    const handleSubmitOrder = async () => {
        if (!user) {
            toast.warning('Vui lòng đăng nhập để thanh toán');
            return;
        }
        if (user.balance < finalTotal) {
            toast.error('Số dư tài khoản không đủ. Vui lòng nạp thêm tiền.');
            return;
        }
        if (!formData.fullName || !formData.phone || !formData.address) {
            toast.warning('Vui lòng điền đầy đủ thông tin giao hàng');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: { ...formData, userId: user.id, email: user.email }, // Pass user info
                    items: cartItems,
                    total: finalTotal,
                    couponCode: appliedCoupon ? appliedCoupon.code : null
                })
            });
            const data = await response.json();

            if (response.ok) {
                // Clear LocalStorage
                localStorage.removeItem('cart');
                localStorage.removeItem('appliedCoupon');
                localStorage.removeItem('couponCode');

                // Clear DB Cart
                await fetch(`${API_URL}/cart/clear`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });

                const updatedUser = { ...user, balance: data.newBalance };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('authChange'));
                toast.success('Đặt hàng thành công!');
                // Navigate to Delivery Status tab
                navigate('/account?tab=delivery_status');
            } else {
                toast.error(data.message || 'Đặt hàng thất bại');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            toast.error('Lỗi kết nối server');
        }
    };

    return (
        <div className="checkout-page-single">
            <div className="container checkout-container">
                {/* Left Column: Address & Shipping & Payment */}
                <div className="checkout-left">
                    <section className="checkout-section">
                        <h2 className="section-title">Thông tin giao hàng</h2>
                        <div className="form-group">
                            <label>Tên người nhận:</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="input-field"
                            />
                        </div>
                        <div className="form-group">
                            <label>Số điện thoại:</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="input-field"
                            />
                        </div>
                        <div className="form-group">
                            <label>Địa chỉ người nhận:</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="input-field"
                            />
                        </div>
                    </section>

                    <section className="checkout-section">
                        <h2 className="section-title">Kiểm tra lại đơn hàng</h2>
                        <div className="order-items-list">
                            {cartItems.map((item, index) => (
                                <div key={index} className="order-item-row">
                                    <div className="item-index">{index + 1}</div>
                                    <img src={item.image} alt={item.title} className="item-thumb" />
                                    <div className="item-details">
                                        <h4>{item.title}</h4>
                                        <div className="quantity-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '5px 0' }}>
                                            <button
                                                onClick={() => {
                                                    const newItems = [...cartItems];
                                                    if (newItems[index].quantity > 1) {
                                                        newItems[index].quantity -= 1;
                                                        setCartItems(newItems);
                                                    }
                                                }}
                                                style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                                            >
                                                -
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button
                                                onClick={() => {
                                                    const newItems = [...cartItems];
                                                    newItems[index].quantity += 1;
                                                    setCartItems(newItems);
                                                }}
                                                style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="item-price-row">
                                            <span className="price-highlight">{parseInt(item.price).toLocaleString('vi-VN')}đ</span>
                                            <span className="price-original">{parseInt(item.price * 1.2).toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="order-summary-mini">
                            <div className="summary-row">
                                <span>Thành tiền</span>
                                <span className="highlight-text">{parseInt(total).toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="summary-row">
                                <span>Phí vận chuyển</span>
                                <span className="highlight-text">{parseInt(shippingFee).toLocaleString('vi-VN')}đ</span>
                            </div>
                            {appliedCoupon && (
                                <div className="summary-row">
                                    <span>Giảm giá</span>
                                    <span className="highlight-text">-{parseInt(discount).toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            <div className="summary-row final">
                                <span>Tổng cộng</span>
                                <span className="final-price">{parseInt(finalTotal).toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                    </section>

                    <section className="checkout-section">
                        <h2 className="section-title">Mã khuyến mãi</h2>
                        <div className="coupon-input-wrapper">
                            <span className="coupon-label">Mã KM</span>
                            <input
                                type="text"
                                placeholder="Nhập mã khuyến mãi"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="coupon-input"
                            />
                            <button onClick={handleApplyCoupon} className="btn-apply-coupon">Áp dụng</button>
                            <a href="#" className="link-select-coupon">Chọn mã khuyến mãi</a>
                        </div>
                        <div className="coupon-list">
                            {vouchers.length === 0 ? (
                                <p style={{ padding: '10px', color: '#999' }}>Không có mã giảm giá nào.</p>
                            ) : (
                                vouchers.map((voucher, index) => (
                                    <div
                                        key={index}
                                        className="coupon-item"
                                        onClick={() => setCouponCode(voucher.code)}
                                        style={{
                                            cursor: 'pointer',
                                            border: couponCode === voucher.code ? '1px solid #3498db' : '1px solid #e0e0e0',
                                            backgroundColor: couponCode === voucher.code ? '#ebf5fb' : 'white'
                                        }}
                                    >
                                        <div className="coupon-icon" style={{
                                            color: couponCode === voucher.code ? '#3498db' : '#ccc',
                                            fontWeight: 'bold'
                                        }}>✓</div>
                                        <div className="coupon-info">
                                            <strong>{voucher.code}</strong>
                                            <p>{voucher.description}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="checkout-section">
                        <h2 className="section-title">Phương thức vận chuyển</h2>
                        <div className="shipping-options">
                            <label className="shipping-option">
                                <input
                                    type="radio"
                                    name="shipping"
                                    checked={shippingMethod === 'fast'}
                                    onChange={() => setShippingMethod('fast')}
                                />
                                <div className="shipping-details">
                                    <strong>Nhanh</strong>
                                    <p>Đảm bảo nhận hàng vào 3-5 ngày nữa</p>
                                </div>
                                <span className="shipping-price">20.000đ</span>
                            </label>
                            <label className="shipping-option">
                                <input
                                    type="radio"
                                    name="shipping"
                                    checked={shippingMethod === 'express'}
                                    onChange={() => setShippingMethod('express')}
                                />
                                <div className="shipping-details">
                                    <strong>Hỏa tốc</strong>
                                    <p>Trưa mai 12h</p>
                                </div>
                                <span className="shipping-price">30.000đ</span>
                            </label>
                        </div>
                    </section>

                    <section className="checkout-section">
                        <h2 className="section-title">Hình thức thanh toán</h2>
                        <div className="payment-options">
                            <label className="payment-option">
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={true}
                                    readOnly
                                />
                                <span className="payment-label">Số dư tài khoản ({user ? parseInt(user.balance).toLocaleString('vi-VN') : 0}đ)</span>
                            </label>
                        </div>
                    </section>

                    <div className="checkout-footer">
                        <button onClick={handleSubmitOrder} className="btn-confirm-order">Xác nhận thanh toán</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
