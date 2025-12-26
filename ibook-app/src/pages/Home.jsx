import Banner from '../components/Banner';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductSection from '../components/ProductSection';
import './Home.css';

const Home = () => {
    const [products, setProducts] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');

    const filteredProducts = searchQuery
        ? products.filter(p =>
            (p.TenSanPham && p.TenSanPham.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.genre && p.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [];

    useEffect(() => {
        axios.get(`${API_URL}/products`)
            .then(response => setProducts(response.data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    return (
        <div className="home-page">
            {searchQuery ? (
                <div className="container" style={{ marginTop: '20px', minHeight: '60vh' }}>
                    <h2 style={{ marginBottom: '20px' }}>Kết quả tìm kiếm cho "{searchQuery}"</h2>
                    {filteredProducts.length > 0 ? (
                        <div className="sections-container">
                            <ProductSection title="" products={filteredProducts} bgColor="transparent" />
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                            <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                            <button onClick={() => navigate('/')} style={{ marginTop: '10px', padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Về trang chủ</button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Category Navigation Bar - Positioned above Banner as requested */}
                    <div className="container category-nav-container">
                        <div className="category-scroll">
                            {['Trinh thám', 'Hài hước', 'Phiêu lưu', 'Đời thường', 'Hành động', 'Lãng mạn', 'Kinh dị'].map(cat => (
                                <button key={cat} className="category-pill" onClick={() => navigate(`/?search=${cat}`)}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Banner Section */}
                    <div className="container">
                        <Banner />
                    </div>

                    {/* Product Sections */}
                    <div className="sections-container">
                        <ProductSection
                            title="SÁCH MỚI PHÁT HÀNH"
                            products={[...products].sort((a, b) => {
                                const dateA = new Date(a.createdAt || 0);
                                const dateB = new Date(b.createdAt || 0);
                                return dateB - dateA; // Newest first
                            }).slice(0, 5)}
                            bgColor="var(--bg-white)"
                        />

                        <div className="promo-banner-middle container">
                            <img src="/assets/banner-mid.jpg" alt="Promo" style={{ width: '100%', borderRadius: '8px', height: '150px', objectFit: 'cover', backgroundColor: '#eee' }} />
                        </div>

                        <ProductSection
                            title="SÁCH BÁN CHẠY"
                            products={[...products]
                                .filter(p => (p.sold || 0) > 0)  // Chỉ lấy sách đã bán
                                .sort((a, b) => (b.sold || 0) - (a.sold || 0))  // Sắp xếp giảm dần
                                .slice(0, 10)  // Tối đa 10 quyển
                            }
                            bgColor="var(--bg-white)"
                        />

                        <ProductSection title="TRUYỆN TRANH - COMIC" products={products.filter(p => p.genre === 'Trinh thám' || p.genre === 'Hài hước')} bgColor="var(--bg-white)" />
                    </div>
                </>
            )}

            {/* Top Buyers Section */}
            <TopBuyers />
        </div>
    );
};

const TopBuyers = () => {
    const [buyers, setBuyers] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/admin/orders`)
            .then(res => {
                const orders = res.data;
                const customerMap = {};

                orders.forEach(order => {
                    if (order.status === 'ThanhCong') {
                        const key = order.customer?.email || order.customer?.phone || order.customer?.name;
                        if (key) {
                            if (!customerMap[key]) {
                                customerMap[key] = {
                                    HoTen: order.customer.name || key,
                                    TotalSpent: 0,
                                    AnhDaiDien: order.customer.avatar
                                };
                            }
                            customerMap[key].TotalSpent += Number(order.total);
                        }
                    }
                });

                const sortedBuyers = Object.values(customerMap)
                    .sort((a, b) => b.TotalSpent - a.TotalSpent)
                    .slice(0, 5);
                setBuyers(sortedBuyers);
            })
            .catch(err => {
                // Silent catch or limited logging
            });
    }, []);

    if (buyers.length === 0) return null;

    return (
        <div className="container" style={{ marginTop: '30px', marginBottom: '50px' }}>
            <div style={{ background: 'var(--bg-white)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <h2 style={{ textAlign: 'center', color: '#d35400', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🏆</span> BẢNG VINH DANH KHÁCH HÀNG THÂN THIẾT
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)', color: '#c0392b' }}>
                                <th style={{ padding: '15px', textAlign: 'center', width: '80px', borderRadius: '8px 0 0 8px' }}>Hạng</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Khách hàng</th>
                                <th style={{ padding: '15px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Tổng chi tiêu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buyers.map((buyer, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', transition: '0.2s' }}>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {index === 0 && <span style={{ fontSize: '24px' }}>🥇</span>}
                                        {index === 1 && <span style={{ fontSize: '24px' }}>🥈</span>}
                                        {index === 2 && <span style={{ fontSize: '24px' }}>🥉</span>}
                                        {index > 2 && <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#7f8c8d' }}>#{index + 1}</span>}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <img
                                                src={buyer.AnhDaiDien || `https://ui-avatars.com/api/?name=${buyer.HoTen}&background=random`}
                                                alt={buyer.HoTen}
                                                style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px solid var(--bg-white)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                                            />
                                            <span style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-main)' }}>{buyer.HoTen}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c', fontSize: '16px' }}>
                                        {parseInt(buyer.TotalSpent).toLocaleString('vi-VN')}đ
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Home;
