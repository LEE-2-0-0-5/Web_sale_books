import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [showCartDropdown, setShowCartDropdown] = useState(false);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [searchQuery, setSearchQuery] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        // Fetch products for search suggestions
        axios.get(`${API_URL}/products`)
            .then(res => setAllProducts(res.data))
            .catch(err => console.error('Error fetching products for search:', err));
    }, []);

    // Helper to remove accents for better search
    const removeAccents = (str) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    useEffect(() => {
        if (searchQuery.trim()) {
            const normalizedQuery = removeAccents(searchQuery);
            const lowerQuery = searchQuery.toLowerCase(); // Keep original lower for exact accent matches if needed, but mainly use normalized

            const filtered = allProducts.filter(p => {
                const name = p.TenSanPham || p.title || '';
                const normalizedName = removeAccents(name);

                // Match either normalized (accent-less) or standard case-insensitive
                return normalizedName.includes(normalizedQuery) ||
                    name.toLowerCase().includes(lowerQuery);
            }).slice(0, 5); // Limit to 5 suggestions

            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery, allProducts]);

    const handleSearch = () => {
        setShowSuggestions(false);
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const checkUser = async () => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (storedUser && storedUser.id) {
            try {
                // Fetch fresh data from API to get latest balance
                const response = await axios.get(`${API_URL}/user/${storedUser.id}`);
                setUser(response.data);
            } catch (error) {
                console.error('Error fetching user data for header:', error);
                // Fallback to stored user if API fails
                setUser(storedUser);
            }
        } else {
            setUser(null);
        }
    };

    const updateCartCount = async () => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (storedUser) {
            try {
                const res = await axios.get(`${API_URL}/cart/${storedUser.id}`);
                const count = Array.isArray(res.data)
                    ? res.data.reduce((acc, item) => acc + (item.quantity || 1), 0)
                    : 0;
                setCartCount(count);
            } catch (error) {
                console.error("Cart count error", error);
            }
        } else {
            const items = JSON.parse(localStorage.getItem('cart') || '[]');
            const count = items.reduce((acc, item) => acc + (item.quantity || 1), 0);
            setCartCount(count);
        }
    };

    useEffect(() => {
        checkUser();
        updateCartCount();

        const handleAuthChange = () => {
            checkUser();
            updateCartCount();
        };

        const handleCartChange = () => {
            updateCartCount();
        };

        window.addEventListener('authChange', handleAuthChange);
        window.addEventListener('cartChange', handleCartChange);

        return () => {
            window.removeEventListener('authChange', handleAuthChange);
            window.removeEventListener('cartChange', handleCartChange);
        };
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        setUser(null);
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
    };

    return (
        <header className="header">
            {/* Tet Theme Decorations - Only visible when body has tet-theme class */}
            <img src="/tet_blossom_left.svg" className="header-decor-tet-left" alt="" />
            <img src="/tet_lantern_right.svg" className="header-decor-tet-right" alt="" />

            {/* Noel Theme Decorations - Only visible when body has noel-theme class */}
            <img src="/santa_reindeer.svg" className="header-santa" alt="Santa" />
            <img src="/noel_city_left.svg" className="header-noel-left" alt="" />
            <img src="/noel_moon_right.svg" className="header-noel-right" alt="" />

            <div className="header-container">
                <Link to="/" className="logo">
                    Ibook<span className="logo-dot">.com</span>
                </Link>

                <div className="search-bar" style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm sách..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click event
                    />
                    <button className="search-btn" onClick={handleSearch}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="search-suggestions">
                            {suggestions.map(product => {
                                let image = product.image || product.AnhBia;
                                try {
                                    if (typeof image === 'string' && (image.startsWith('[') || image.startsWith('{'))) {
                                        image = JSON.parse(image)[0];
                                    }
                                } catch (e) { }

                                return (
                                    <div
                                        key={product.id || product.MaTruyen}
                                        className="suggestion-item"
                                        onClick={() => {
                                            navigate(`/product/${product.id || product.MaTruyen}`);
                                            setShowSuggestions(false);
                                            setSearchQuery('');
                                        }}
                                    >
                                        <img src={image || 'https://via.placeholder.com/40'} alt={product.title || product.TenSanPham} />
                                        <div className="suggestion-info">
                                            <div className="suggestion-title">{product.title || product.TenSanPham}</div>
                                            <div className="suggestion-price">
                                                {parseInt(product.price || product.GiaBan || 0).toLocaleString('vi-VN')}đ
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {user && (
                    <div
                        className="header-balance-pill"
                        onClick={() => navigate('/account?tab=deposit')}
                        style={{ cursor: 'pointer' }}
                    >
                        + {parseInt(user.balance || 0).toLocaleString('vi-VN')}đ
                    </div>
                )}

                <div className="header-actions">
                    <button
                        className="action-item theme-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                        title={darkMode ? "Chế độ sáng" : "Chế độ tối"}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', marginRight: '15px' }}
                    >
                        {darkMode ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                        )}
                    </button>

                    {user ? (
                        <>
                            {/* Logged In: Bell, User, Cart */}
                            <div className="action-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                <span>Thông báo</span>
                            </div>

                            <div
                                className="action-item"
                                onMouseEnter={() => setShowAccountDropdown(true)}
                                onMouseLeave={() => setShowAccountDropdown(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <span>Tài khoản</span>

                                {showAccountDropdown && (
                                    <div className="dropdown-menu">
                                        <Link to="/account?tab=profile" className="dropdown-item">Hồ sơ cá nhân</Link>
                                        <Link to="/account?tab=delivery_status" className="dropdown-item">Trạng thái giao hàng</Link>
                                        <Link to="/account?tab=favorites" className="dropdown-item">Sản phẩm yêu thích</Link>
                                        <Link to="/account?tab=orders" className="dropdown-item">Đơn hàng đã mua</Link>
                                        <Link to="/account?tab=deposit" className="dropdown-item">Nạp tiền</Link>
                                        <Link to="/account?tab=transactions" className="dropdown-item">Lịch sử giao dịch</Link>
                                        <Link to="/account?tab=vouchers" className="dropdown-item">Kho Voucher</Link>
                                        <Link to="/account?tab=password" className="dropdown-item">Đổi mật khẩu</Link>
                                        <Link to="/account?tab=notifications" className="dropdown-item">Thông báo</Link>
                                        <div className="dropdown-divider"></div>
                                        <button onClick={handleLogout} className="dropdown-item logout-btn">Đăng xuất</button>
                                    </div>
                                )}
                            </div>

                            <div
                                className="action-item"
                                onMouseEnter={() => setShowCartDropdown(true)}
                                onMouseLeave={() => setShowCartDropdown(false)}
                            >
                                <Link to="/cart" className="cart-link">
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                    </div>
                                    <span>Giỏ hàng</span>
                                </Link>

                                {showCartDropdown && (
                                    <div className="dropdown-menu">
                                        <Link to="/cart" className="dropdown-item">Giỏ hàng của tôi</Link>
                                        <Link to="/account?tab=reviews" className="dropdown-item">Đánh giá</Link>
                                        <Link to="/account?tab=purchased" className="dropdown-item">Đã mua</Link>
                                        <Link to="/account?tab=cancelled" className="dropdown-item">Đã hủy</Link>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="auth-action-btn login-btn">Đăng nhập</Link>
                            <span className="auth-separator">|</span>
                            <Link to="/register" className="auth-action-btn register-btn">Đăng ký</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
