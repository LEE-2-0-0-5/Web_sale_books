import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Cart.css';
import { API_URL } from '../apiConfig';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchCart(parsedUser.id);
        } else {
            const items = JSON.parse(localStorage.getItem('cart') || '[]');
            const itemsWithQty = items.map(item => ({ ...item, quantity: item.quantity || 1 }));
            setCartItems(itemsWithQty);
        }
    }, []);

    const fetchCart = async (userId) => {
        try {
            const response = await axios.get(`${API_URL}/cart/${userId}`);
            // Ensure consistency in data structure. 
            // Backend returns {id, title, price, image, quantity, stock}.
            setCartItems(response.data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    const updateQuantity = async (index, newQty) => {
        if (newQty < 1) return;
        const item = cartItems[index];

        if (user) {
            try {
                // Optimistic update
                const newCart = [...cartItems];
                newCart[index].quantity = newQty;
                setCartItems(newCart);

                await axios.put(`${API_URL}/cart/update`, {
                    userId: user.id,
                    productId: item.id,
                    quantity: newQty
                });
                window.dispatchEvent(new Event('cartChange'));
            } catch (error) {
                console.error(error);
                // Revert on error?
                fetchCart(user.id);
            }
        } else {
            const newCart = [...cartItems];
            newCart[index].quantity = newQty;
            setCartItems(newCart);
            localStorage.setItem('cart', JSON.stringify(newCart));
            window.dispatchEvent(new Event('cartChange'));
        }
    };

    const removeItem = async (index) => {
        const item = cartItems[index];
        if (user) {
            try {
                // Optimistic update
                const newCart = [...cartItems];
                newCart.splice(index, 1);
                setCartItems(newCart);

                await axios.delete(`${API_URL}/cart/remove`, {
                    data: { userId: user.id, productId: item.id }
                });
                window.dispatchEvent(new Event('cartChange'));
            } catch (error) {
                console.error(error);
                fetchCart(user.id);
            }
        } else {
            const newCart = [...cartItems];
            newCart.splice(index, 1);
            setCartItems(newCart);
            localStorage.setItem('cart', JSON.stringify(newCart));
            window.dispatchEvent(new Event('cartChange'));
        }
    };

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="container cart-page">
            <div className="cart-header-title">
                <h1>Giỏ hàng</h1>
                <p>({cartItems.length} sản phẩm)</p>
            </div>

            {cartItems.length === 0 ? (
                <div className="empty-cart">
                    <p>Giỏ hàng của bạn đang trống.</p>
                    <Link to="/" className="btn-continue">Tiếp tục mua sắm</Link>
                </div>
            ) : (
                <div className="cart-container">
                    <div className="cart-items-section">
                        <div className="cart-table-header">
                            <div className="col-product">Sản phẩm</div>
                            <div className="col-price">Đơn giá</div>
                            <div className="col-qty">Số lượng</div>
                            <div className="col-total">Thành tiền</div>
                            <div className="col-action"></div>
                        </div>

                        {cartItems.map((item, index) => (
                            <div key={index} className="cart-item-row">
                                <div className="col-product product-info">
                                    <img src={item.image} alt={item.title} />
                                    <div className="info">
                                        <h3>{item.title}</h3>
                                        <p className="variant">Phiên bản: Tiêu chuẩn</p>
                                    </div>
                                </div>
                                <div className="col-price">
                                    {parseInt(item.price).toLocaleString('vi-VN')}đ
                                </div>
                                <div className="col-qty">
                                    <div className="qty-control">
                                        <button onClick={() => updateQuantity(index, item.quantity - 1)}>-</button>
                                        <input type="text" value={item.quantity} readOnly />
                                        <button onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
                                    </div>
                                </div>
                                <div className="col-total highlight">
                                    {parseInt(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                </div>
                                <div className="col-action">
                                    <button onClick={() => removeItem(index)} className="btn-remove">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary-section">
                        <div className="summary-card">
                            <h3>Thanh toán</h3>
                            <div className="summary-row">
                                <span>Tạm tính:</span>
                                <span>{parseInt(total).toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="summary-row">
                                <span>Thành tiền:</span>
                                <span className="final-total">{parseInt(total).toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="summary-note">
                                (Đã bao gồm VAT nếu có)
                            </div>
                            <Link to="/checkout" className="btn-checkout">Tiến hành đặt hàng</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
