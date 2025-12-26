import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Banner.css';

const Banner = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    const slides = [
        {
            id: 1,
            image: '/assets/banner-dragonball.png',
            title: "DRAGON BALL SUPER",
            subtitle: "KỈ NIỆM PHIM RA MẮT",
            description: "Giảm ngay 10% trọn bộ Dragon Ball",
            color: "#e67e22",
            textPosition: "bottom-right",
            link: "/?search=Dragon Ball"
        },
        {
            id: 2,
            image: '/assets/banner-totoro.png',
            title: "STUDIO GHIBLI",
            subtitle: "KỈ NIỆM 40 NĂM",
            description: "Ưu đãi giảm 20% các tác phẩm",
            color: "#2ecc71",
            textPosition: "top-left",
            link: "/?search=Totorro"
        },
        {
            id: 3,
            image: '/assets/banner-conan.png',
            title: "THÁM TỬ LỪNG DANH",
            subtitle: "TUẦN LỄ TRINH THÁM",
            description: "Mua 1 Tặng 1 - Duy nhất tuần này",
            color: "#3498db",
            textPosition: "bottom-left",
            link: "/?search=Conan"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    const handleBannerClick = (link) => {
        if (link) {
            navigate(link);
        }
    };

    return (
        <div className="banner-section">
            <div className="banner-grid">
                {/* Main Banner Slider */}
                <div className="main-banner">
                    <div className="banner-slider" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                        {slides.map((slide) => (
                            <div
                                key={slide.id}
                                className="banner-slide"
                                onClick={() => handleBannerClick(slide.link)}
                                style={{ cursor: 'pointer' }}
                            >
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="banner-image"
                                    onError={(e) => console.error("Failed to load banner:", slide.image, e)}
                                />
                                <div className={`banner-content-stylized ${slide.textPosition}`}>
                                    <h2 className="stylized-title">{slide.title}</h2>
                                    <div className="stylized-info">
                                        <p className="stylized-subtitle">{slide.subtitle}</p>
                                        <span className="stylized-desc">{slide.description}</span>
                                    </div>
                                    <button className="stylized-btn">Khám Phá Ngay</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Slider Dots */}
                    <div className="slider-dots">
                        {slides.map((_, index) => (
                            <span
                                key={index}
                                className={`dot ${currentSlide === index ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSlide(index);
                                }}
                            ></span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Banner;


