import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Account from './pages/Account';
import OrderManager from './admin/OrderManager';
import ProductManager from './admin/ProductManager';
import CouponManager from './admin/CouponManager';
import SnowEffect from './components/SnowEffect';
import TetEffect from './components/TetEffect';
import HalloweenEffect from './components/HalloweenEffect';
import SettingsManager from './admin/SettingsManager';
import Dashboard from './admin/Dashboard';

import CustomerManager from './admin/CustomerManager';
import './App.css';
import ChatWidget from './components/ChatWidget';
import ChatManager from './admin/ChatManager';
import AdminLogin from './admin/AdminLogin';
import { ToastProvider } from './components/Toast';

// Helper components for conditional rendering
const ConditionalHeader = () => {
  const location = useLocation();
  const isAdminDomain = window.location.port === '2004';

  // Hide on all Admin pages
  if (location.pathname.startsWith('/admin')) return null;
  // Hide on Chat page
  if (location.pathname === '/chat') return null;

  // If on Admin Domain, hide header on Root (Login)
  if (isAdminDomain && location.pathname === '/') return null;

  return <Header />;
};

const ConditionalFooter = () => {
  const location = useLocation();
  const isAdminDomain = window.location.port === '2004';

  if (location.pathname.startsWith('/admin') || location.pathname === '/chat') return null;
  if (isAdminDomain && location.pathname === '/') return null;

  return <Footer />;
};

const ConditionalChat = () => {
  const location = useLocation();
  const isAdminDomain = window.location.port === '2004';

  // Never show customer chat widget on Admin Domain
  if (isAdminDomain) return null;

  // Only show on Home page
  if (location.pathname !== '/') return null;

  return <ChatWidget />;
};


function App() {
  const isAdminDomain = window.location.port === '2004';

  return (
    <ToastProvider>
      <Router>
        <div className="app">
          <SnowEffect />
          <TetEffect />
          <HalloweenEffect />
          <ConditionalHeader />
          <Routes>
            {isAdminDomain ? (
              <>
                {/* --- ADMIN & CHAT DOMAIN (Port 2004) --- */}
                <Route path="/" element={<AdminLogin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/orders" element={<OrderManager />} />
                <Route path="/admin/products" element={<ProductManager />} />
                <Route path="/admin/coupons" element={<CouponManager />} />
                <Route path="/admin/customers" element={<CustomerManager />} />
                <Route path="/admin/settings" element={<SettingsManager />} />
                <Route path="/admin/chat" element={<ChatManager />} />
                <Route path="/chat" element={<ChatManager />} />
                {/* Catch all for admin domain */}
                <Route path="*" element={<AdminLogin />} />
              </>
            ) : (
              <>
                {/* --- USER STORE DOMAIN (Port 5174/Other) --- */}
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/account" element={<Account />} />
                {/* Hide Admin/Chat content here */}
                <Route path="/admin/*" element={<Home />} />
                <Route path="/chat" element={<Home />} />
              </>
            )}
          </Routes>
          <ConditionalFooter />
          <ConditionalChat />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
