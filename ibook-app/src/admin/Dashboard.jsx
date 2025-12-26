import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import AdminSidebar from './components/AdminSidebar';
import './Admin.css';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        todayRevenue: 0,
        todayNewOrders: 0,
        todayCancelledOrders: 0,
        weeklyRevenue: [],
        revenueByCategory: []
    });
    const [activeTab, setActiveTab] = useState('revenue');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const ordersRes = await axios.get('/api/admin/orders');
            const orders = ordersRes.data;

            const today = new Date();
            today.setHours(0, 0, 0, 0);


            const todayOrders = orders.filter(order => {
                if (!order.date) return false;
                const orderDate = new Date(order.date);
                const today = new Date();

                return orderDate.getDate() === today.getDate() &&
                    orderDate.getMonth() === today.getMonth() &&
                    orderDate.getFullYear() === today.getFullYear();
            });


            const todayRevenue = todayOrders
                .filter(o => o.status === 'ThanhCong')
                .reduce((sum, o) => sum + Number(o.total || 0), 0);

            // Đơn mới = ChoXuLy HOẶC bất kỳ đơn nào chưa xử lý
            const todayNewOrders = todayOrders.filter(o =>
                o.status === 'ChoXuLy' || o.status === 'pending' || o.status === 'Pending'
            ).length;
            const todayCancelledOrders = todayOrders.filter(o => o.status === 'DaHuy').length;


            const weeklyRevenue = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);

                const dayOrders = orders.filter(order => {
                    if (!order.date) return false;
                    const orderDate = new Date(order.date);

                    const isSameDay = orderDate.getDate() === date.getDate() &&
                        orderDate.getMonth() === date.getMonth() &&
                        orderDate.getFullYear() === date.getFullYear();

                    return isSameDay && order.status === 'ThanhCong';
                });

                const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
                weeklyRevenue.push({
                    date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                    revenue
                });
            }

            setStats({
                todayRevenue,
                todayNewOrders,
                todayCancelledOrders,
                weeklyRevenue,
                revenueByCategory: []
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    return (
        <div className="admin-container">
            <AdminSidebar active="dashboard" />
            <div className="admin-content">
                <div className="dashboard-container">
                    <h1 className="dashboard-title">Tổng quan</h1>

                    <div className="stats-card">
                        <h2 className="card-title">Kết quả kinh doanh trong ngày</h2>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <h3>Doanh thu</h3>
                                <p className="stat-value">{stats.todayRevenue.toLocaleString('vi-VN')} đ</p>
                            </div>
                            <div className="stat-item">
                                <h3>Đơn mới</h3>
                                <p className="stat-value">{stats.todayNewOrders}</p>
                            </div>
                            <div className="stat-item">
                                <h3>Đơn hủy</h3>
                                <p className="stat-value">{stats.todayCancelledOrders}</p>
                            </div>
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-tabs">
                            <button
                                className={`tab ${activeTab === 'revenue' ? 'active' : ''}`}
                                onClick={() => setActiveTab('revenue')}
                            >
                                Doanh thu
                            </button>
                            <button
                                className={`tab ${activeTab === 'proportion' ? 'active' : ''}`}
                                onClick={() => setActiveTab('proportion')}
                            >
                                Tỷ trọng
                            </button>
                            <button
                                className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
                                onClick={() => setActiveTab('weekly')}
                            >
                                Trong 7 ngày qua
                            </button>
                        </div>

                        <div className="chart-content">
                            {activeTab === 'revenue' && (
                                <div className="empty-state">
                                    <div className="sad-face">☹</div>
                                    <p>Không có dữ liệu</p>
                                </div>
                            )}

                            {activeTab === 'proportion' && (
                                <div className="empty-state">
                                    <div className="sad-face">☹</div>
                                    <p>Không có dữ liệu</p>
                                </div>
                            )}

                            {activeTab === 'weekly' && (
                                <div className="weekly-chart">
                                    {stats.weeklyRevenue.length > 0 ? (
                                        <div className="bar-chart">
                                            {stats.weeklyRevenue.map((day, index) => {
                                                const maxRevenue = Math.max(...stats.weeklyRevenue.map(d => d.revenue), 1);
                                                const height = (day.revenue / maxRevenue) * 200;
                                                return (
                                                    <div key={index} className="bar-container">
                                                        <div className="bar-value">{day.revenue.toLocaleString('vi-VN')}đ</div>
                                                        <div
                                                            className="bar"
                                                            style={{ height: `${height}px` }}
                                                        />
                                                        <div className="bar-label">{day.date}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="sad-face">☹</div>
                                            <p>Không có dữ liệu</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
