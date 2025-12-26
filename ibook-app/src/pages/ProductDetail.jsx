import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import ProductSection from '../components/ProductSection';
import { useToast } from '../components/Toast';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        // Fetch current product
        axios.get(`${API_URL}/products/${id}`)
            .then(response => setProduct(response.data))
            .catch(error => console.error('Error fetching product:', error));

        // Fetch related products (mocking by fetching all for now)
        axios.get(`${API_URL}/products`)
            .then(response => setRelatedProducts(response.data))
            .catch(error => console.error('Error fetching related products:', error));
    }, [id]);

    if (!product) return <div className="container">Loading...</div>;

    const addToCart = async () => {
        const user = JSON.parse(sessionStorage.getItem('user'));

        if (user) {
            try {
                // Use API_URL from config or fallback to relative if imports fails (but I will add import)
                await axios.post(`${API_URL}/cart/add`, {
                    userId: user.id,
                    productId: product.id,
                    quantity: 1
                });
                window.dispatchEvent(new Event('cartChange'));
                toast.success('Đã thêm vào giỏ hàng!');
            } catch (error) {
                console.error(error);
                toast.error('Lỗi thêm vào giỏ hàng');
            }
        } else {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            // Check if item exists to increment quantity
            const existingItemIndex = cart.findIndex(item => item.id === product.id);
            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartChange'));
            toast.success('Đã thêm vào giỏ hàng!');
        }
    };

    const handleBuyNow = () => {
        // Navigate directly to checkout with the product in state
        navigate('/checkout', { state: { directBuyItem: product } });
    };

    const handleFavorite = async () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.id) {
            toast.warning('Vui lòng đăng nhập để thêm vào yêu thích');
            return;
        }

        try {
            await axios.post(`${API_URL}/user/${user.id}/favorites`, {
                productId: product.id
            });
            toast.success('Đã thêm vào danh sách yêu thích!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi thêm vào yêu thích');
        }
    };

    return (
        <div className="container product-detail-page">
            <div className="product-detail-main">
                <div className="detail-image">
                    <img src={product.image} alt={product.title} />
                </div>
                <div className="detail-info">
                    <h1 className="product-title">{product.title}</h1>

                    <div className="info-grid">
                        <div className="info-row">
                            <span className="info-label">Tác giả</span>
                            <span className="info-value">{product.author || 'Đang cập nhật'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Dịch giả</span>
                            <span className="info-value">{product.translator || 'Đang cập nhật'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Thể loại</span>
                            <span className="info-value">{product.genre || 'Đang cập nhật'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">({product.reviewCount || 0} đánh giá)</span>
                            <span className="info-value rating">
                                {'★'.repeat(Math.floor(product.rating || 5))}
                                <span className="rating-score">{product.rating || 5}/5.0</span>
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Tình trạng</span>
                            <span className="info-value status">{product.status || 'Còn hàng'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Đã bán</span>
                            <span className="info-value" style={{ color: '#d35400', fontWeight: 'bold' }}>{product.sold || 0} cuốn</span>
                        </div>
                    </div>

                    <div className="product-summary">
                        <h3>Tóm tắt nội dung:</h3>
                        <p>{product.summary || product.description}</p>
                    </div>

                    <div className="price-section">
                        <span className="price-label">Giá bán:</span>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                            <span className="price-value" style={{ color: product.discount ? '#d35400' : 'inherit', fontSize: '2rem', fontWeight: 'bold' }}>
                                {parseInt(product.price).toLocaleString('vi-VN')}đ
                            </span>
                            {product.discount > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                                    <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.2rem' }}>
                                        {parseInt(product.originalPrice).toLocaleString('vi-VN')}đ
                                    </span>
                                    <span style={{
                                        color: '#d35400',
                                        border: '1px solid #d35400',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold',
                                        backgroundColor: '#fff3e0'
                                    }}>
                                        -{product.discount}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="btn btn-favorite" onClick={handleFavorite}>Yêu thích</button>
                            <button className="btn btn-add-cart" onClick={addToCart}>Thêm vào giỏ</button>
                        </div>
                        <button className="btn btn-buy-now" onClick={handleBuyNow}>Mua ngay</button>
                    </div>
                </div>
            </div>

            <div className="related-products">
                <ProductSection title="Sản phẩm cùng bộ" products={relatedProducts} bgColor="#fff" />
            </div>
        </div>
    );
};

export default ProductDetail;
