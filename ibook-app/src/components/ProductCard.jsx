import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ id, image, title, price, oldPrice, originalPrice, discount, sold }) => {
    const displayOldPrice = oldPrice || originalPrice;

    return (
        <Link to={`/product/${id}`} className="product-card-link">
            <div className="product-card">
                {discount && <div className="discount-badge">-{discount}%</div>}
                <div className="product-image">
                    {image ? <img src={image} alt={title} /> : <div className="placeholder-image">📖</div>}
                </div>
                <div className="product-info">
                    <h3 className="product-title">{title}</h3>
                    <div className="product-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        {(sold > 0) ? (
                            <div className="product-sold" style={{ fontSize: '13px', color: '#7f8c8d' }}>
                                Đã bán {sold}
                            </div>
                        ) : <div></div>}
                        <div className="product-price" style={{ marginTop: 0 }}>
                            <span className="current-price">{parseInt(price).toLocaleString('vi-VN')}đ</span>
                            {displayOldPrice && displayOldPrice > price && <span className="old-price">{parseInt(displayOldPrice).toLocaleString('vi-VN')}đ</span>}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
