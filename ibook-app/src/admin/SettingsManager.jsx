import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';
import AdminSidebar from './components/AdminSidebar';
import { useToast } from '../components/Toast';

const SettingsManager = () => {
    const toast = useToast();
    const [settings, setSettings] = useState({
        snow_effect: false,
        tet_effect: false,
        halloween_effect: false
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            const data = res.data;
            setSettings({
                snow_effect: data.snow_effect === 'true',
                tet_effect: data.tet_effect === 'true',
                halloween_effect: data.halloween_effect === 'true'
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggle = async (key) => {
        setIsLoading(true);
        const newValue = !settings[key];
        try {
            await axios.post('/api/settings', { key, value: newValue });
            setSettings(prev => ({ ...prev, [key]: newValue }));
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Lỗi không xác định';
            if (error.response?.status === 404) {
                toast.error('Lỗi: API chưa được cập nhật. Vui lòng khởi động lại Server Backend.');
            } else {
                toast.error(`Lỗi cập nhật cài đặt: ${msg}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <AdminSidebar active="settings" />

            <div className="admin-content">
                <div className="admin-header">
                    <h2 className="page-title">Cấu hình hệ thống</h2>
                    <div className="header-actions">
                        <div className="user-avatar">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="card" style={{ width: '100%', gridColumn: 'span 2' }}>
                        <h3 className="section-title">Giao diện người dùng</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0' }}>Giao diện Noel</h4>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Bật/tắt hiệu ứng Noel trên toàn bộ trang web.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.snow_effect}
                                    onChange={() => handleToggle('snow_effect')}
                                    disabled={isLoading}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0' }}>Giao diện Tết Nguyên Đán</h4>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Hiệu ứng hoa đào, hoa mai và lì xì rơi.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.tet_effect}
                                    onChange={() => handleToggle('tet_effect')}
                                    disabled={isLoading}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0' }}>Giao diện Halloween</h4>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Hiệu ứng bí ngô, ma và dơi.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.halloween_effect}
                                    onChange={() => handleToggle('halloween_effect')}
                                    disabled={isLoading}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <style>{`
                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 60px;
                        height: 34px;
                    }
                    .switch input { 
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        -webkit-transition: .4s;
                        transition: .4s;
                    }
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 26px;
                        width: 26px;
                        left: 4px;
                        bottom: 4px;
                        background-color: white;
                        -webkit-transition: .4s;
                        transition: .4s;
                    }
                    input:checked + .slider {
                        background-color: #2196F3;
                    }
                    input:focus + .slider {
                        box-shadow: 0 0 1px #2196F3;
                    }
                    input:checked + .slider:before {
                        -webkit-transform: translateX(26px);
                        -ms-transform: translateX(26px);
                        transform: translateX(26px);
                    }
                    .slider.round {
                        border-radius: 34px;
                    }
                    .slider.round:before {
                        border-radius: 50%;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default SettingsManager;
