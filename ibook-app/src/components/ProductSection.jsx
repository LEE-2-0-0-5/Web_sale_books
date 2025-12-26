import React from 'react';
import ProductCard from './ProductCard';
import './ProductSection.css';

const ProductSection = ({ title, products, bgColor = '#B0E0E6' }) => {
    return (
        <section className="product-section">
            <div className="container">
                <div className="section-header" style={{ backgroundColor: bgColor }}>
                    <h2>{title}</h2>
                </div>
                <div className="product-grid">
                    {products.map((product, index) => (
                        <ProductCard key={index} {...product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProductSection;
