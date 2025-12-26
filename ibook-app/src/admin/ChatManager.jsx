import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import './ChatManager.css';
import AdminSidebar from './components/AdminSidebar';

const ChatManager = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const [polling, setPolling] = useState(true);

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            const res = await axios.get('/api/admin/chat/conversations');
            setConversations(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const [role, setRole] = useState('ADMIN');

    // Initial load and polling for list
    useEffect(() => {
        const u = JSON.parse(sessionStorage.getItem('user'));
        if (u) setRole(u.role);

        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    // Load messages when conversation selected
    useEffect(() => {
        if (!selectedConv) return;
        fetchMessages(selectedConv.MaHoiThoai);
        const interval = setInterval(() => fetchMessages(selectedConv.MaHoiThoai), 2000);
        return () => clearInterval(interval);
    }, [selectedConv]);

    const fetchMessages = async (convId) => {
        try {
            const res = await axios.get(`/api/chat/messages/${convId}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (error) {
            console.error(error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!input.trim() || !selectedConv) return;
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            await axios.post('/api/chat/send', {
                userId: user.id || 'ADMIN', // Support agent ID
                role: 'CHAT',
                content: input,
                conversationId: selectedConv.MaHoiThoai
            });
            setInput('');
            fetchMessages(selectedConv.MaHoiThoai);
        } catch (error) {
            console.error(error);
            alert('Gửi thất bại');
        }
    };

    return (
        <div className="admin-container">
            <AdminSidebar active="chat" />


            <div className="admin-content chat-manager-content">
                {/* ... existing content ... */}
                <div className="chat-layout">
                    {/* Sidebar List */}
                    <div className="chat-list">
                        <h3 style={{ padding: '15px', borderBottom: '1px solid #ddd', margin: 0 }}>Hội thoại</h3>
                        {conversations.map(conv => (
                            <div
                                key={conv.MaHoiThoai}
                                className={`chat-item ${selectedConv?.MaHoiThoai === conv.MaHoiThoai ? 'active' : ''}`}
                                onClick={() => setSelectedConv(conv)}
                            >
                                <div className="avatar-circle">
                                    {(conv.HoTen || 'K')[0].toUpperCase()}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-name">{conv.HoTen || `User ${conv.MaNguoiDung}`}</div>
                                    <div className="chat-preview">{conv.LastMessage || '...'}</div>
                                </div>
                                {conv.TrangThai === 'ChuaXuLy' && <div className="badge-dot"></div>}
                            </div>
                        ))}
                    </div>

                    {/* Chat Area */}
                    <div className="chat-main">
                        {selectedConv ? (
                            <>
                                <div className="chat-header-main">
                                    <h3>{selectedConv.HoTen || `User ${selectedConv.MaNguoiDung}`}</h3>
                                </div>
                                <div className="chat-messages-area">
                                    {messages.map((msg, idx) => {
                                        // ...
                                        // Simple heuristic: if NguoiGui is the user ID of conv, it's incoming. Else outgoing.
                                        const isIncoming = msg.NguoiGui === selectedConv.MaNguoiDung;

                                        return (
                                            <div key={idx} className={`msg-row ${isIncoming ? 'incoming' : 'outgoing'}`}>
                                                <div className="msg-content">
                                                    {msg.NoiDung}
                                                </div>
                                                <div className="msg-time">{new Date(msg.ThoiGian).toLocaleTimeString()}</div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="chat-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Nhập tin nhắn..."
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleSend}
                                        onKeyDown={e => e.key === 'Enter' ? handleSend() : null}
                                    />
                                    <button onClick={handleSend}>Gửi</button>
                                </div>
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                <p>Chọn một hội thoại để bắt đầu chat</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatManager;
