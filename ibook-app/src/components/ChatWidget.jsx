import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatWidget.css';

const API_URL = 'http://localhost:3001/api'; // Adjust if needed

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [user, setUser] = useState(null);
    const messagesEndRef = useRef(null);
    const pollingInterval = useRef(null);

    const checkUser = () => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            checkActiveConversation(storedUser.id);
        } else {
            setUser(null);
            setConversationId(null);
            setMessages([]);
        }
    };

    useEffect(() => {
        checkUser(); // Check initially
        window.addEventListener('authChange', checkUser);
        return () => window.removeEventListener('authChange', checkUser);
    }, []);

    const checkActiveConversation = async (userId) => {
        try {
            const res = await axios.get(`${API_URL}/chat/active/${userId}`);
            if (res.data) {
                setConversationId(res.data.MaHoiThoai);
                fetchMessages(res.data.MaHoiThoai);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMessages = async (convId) => {
        if (!convId) return;
        try {
            const res = await axios.get(`${API_URL}/chat/messages/${convId}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (error) {
            console.error(error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && conversationId) {
            fetchMessages(conversationId);
            pollingInterval.current = setInterval(() => {
                fetchMessages(conversationId);
            }, 3000);
        } else {
            clearInterval(pollingInterval.current);
        }
        return () => clearInterval(pollingInterval.current);
    }, [isOpen, conversationId]);

    const handleSend = async () => {
        if (!input.trim() || !user) return;

        const tempMsg = {
            id: Date.now(),
            NoiDung: input,
            NguoiGui: user.id,
            ThoiGian: new Date().toISOString() // Temporary
        };
        // Optimistic update
        setMessages(prev => [...prev, tempMsg]);
        setInput('');

        try {
            const res = await axios.post(`${API_URL}/chat/send`, {
                userId: user.id,
                role: 'CUSTOMER',
                content: tempMsg.NoiDung,
                conversationId: conversationId
            });

            if (!conversationId && res.data.conversationId) {
                setConversationId(res.data.conversationId);
            }
            // Fetch to sync
            fetchMessages(res.data.conversationId || conversationId);
        } catch (error) {
            console.error('Send failed', error);
        }
    };

    const [theme, setTheme] = useState('default');

    useEffect(() => {
        const checkTheme = () => {
            if (document.body.classList.contains('noel-theme')) return 'noel';
            if (document.body.classList.contains('tet-theme')) return 'tet';
            if (document.body.classList.contains('halloween-theme')) return 'halloween';
            return 'default';
        };

        setTheme(checkTheme());

        // Observe body class changes to update theme instantly
        const observer = new MutationObserver(() => {
            setTheme(checkTheme());
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const getThemeIcon = () => {
        switch (theme) {
            case 'noel': return '🎅';
            case 'tet': return '🧧';
            case 'halloween': return '🎃';
            default: return '💬';
        }
    };

    if (!user) return null;

    return (
        <div className="chat-widget-container">
            {!isOpen && (
                <div className={`chat-bubble ${theme}-bubble`} onClick={() => setIsOpen(true)}>
                    <div className="chat-icon">{getThemeIcon()}</div>
                    <span className="chat-label">Tin nhắn nhanh</span>
                </div>
            )}

            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <span>Chat Nhanh</span>
                        <div className="close-btn" onClick={() => setIsOpen(false)}>×</div>
                    </div>
                    <div className="chat-body">
                        <div className="system-message">
                            <span className="msg-bubble system">Chào mừng bạn đến với Ibook</span>
                        </div>
                        {messages.map((msg, idx) => {
                            const isMe = msg.NguoiGui === user.id;
                            return (
                                <div key={idx} className={`message-row ${isMe ? 'my-msg' : 'other-msg'}`}>
                                    <div className={`msg-bubble ${isMe ? 'me' : 'other'}`}>
                                        {msg.NoiDung}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input-area">
                        <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
