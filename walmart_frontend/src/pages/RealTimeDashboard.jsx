// src/components/dashboard/RealTimeDashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import styles from './RealTimeDashboard.module.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import ActivityLog from '../components/dashboard/ActivityLog';

// Helper untuk styling & ikon event
const getEventStyle = (eventType) => {
    switch (eventType) {
        case 'USER_LOGIN': return { icon: '👤', color: '#00C49F' };
        case 'USER_REGISTER': return { icon: '✨', color: '#0088FE' };
        case 'ADD_TO_CART': return { icon: '🛒', color: '#FFBB28' };
        case 'CHECKOUT': return { icon: '💳', color: '#8884d8' };
        case 'USER_CHAT': return { icon: '💬', color: '#FF6384' }; // Event baru untuk chat
        default: return { icon: '🔹', color: '#a0a0c0' };
    }
};

// Custom Tooltip untuk Recharts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="recharts-custom-tooltip">
                <p className="recharts-tooltip-label">{label}</p>
                <p style={{ color: payload[0].fill }}>{`Count: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const RealTimeDashboard = () => {
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    // const [trendingProducts, setTrendingProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [checkoutTrends, setCheckoutTrends] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [chatMessage, setChatMessage] = useState(''); // State untuk input chat
    const socketRef = useRef(null); // Ref untuk menyimpan instance socket
    const logContainerRef = useRef(null);
    const [activeTab, setActiveTab] = useState('cart');
    useEffect(() => {
        const socket = io('http://10.35.148.59:5001');
        socketRef.current = socket; // Simpan socket di ref

        socket.on('connect', () => {
            setIsConnected(true);
            const username = `User_${Math.floor(Math.random() * 1000)}`;
            socket.emit('user_online', username);
        });

        socket.on('disconnect', () => setIsConnected(false));
        socket.on('all_messages', (history) => setMessages(history));
        socket.on('receive_message', (newMessage) => {
            setMessages(prev => [...prev, newMessage].slice(-100));
        });
        socket.on('update_online_users', (users) => setOnlineUsers(users));
        // ✅ LISTENER SOCKET BARU
        socket.on('update_trending_products', (products) => {
            setTrendingProducts(products);
        });

        // ✅ NEW: Listen for checkout trends
        socket.on('update_checkout_trends', (products) => {
            setCheckoutTrends(products);
        });
        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        // KODE BARU (Scroll ke bawah)
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [messages, activeTab]);

    // ✅ Fungsi BARU untuk mengirim pesan chat
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (chatMessage.trim() && socketRef.current) {
            socketRef.current.emit('send_chat_message', chatMessage);
            setChatMessage(''); // Kosongkan input setelah dikirim
        }
    };
    const cartActivity = messages.filter(msg => msg.event === 'ADD_TO_CART');
    const checkoutActivity = messages.filter(msg => msg.event === 'CHECKOUT');
    const userActivity = messages.filter(msg => ['USER_LOGIN', 'USER_REGISTER', 'USER_CHAT'].includes(msg.event));

    const renderActiveLog = () => {
        switch (activeTab) {
            case 'cart':
                return <ActivityLog messages={cartActivity} logContainerRef={logContainerRef} />;
            case 'checkout':
                return <ActivityLog messages={checkoutActivity} logContainerRef={logContainerRef} />;
            case 'user':
                return <ActivityLog messages={userActivity} logContainerRef={logContainerRef} />;
            default:
                return <ActivityLog messages={messages} logContainerRef={logContainerRef} />;
        }
    };
    return (
        <>
            <h1 className="dashboard-header">Real Time Analytics & Dashboard</h1>
            {/* <h1 style={{textAlign: 'center'}}>Real Time Analytics & Dashboard</h1> */}
            <div className={styles.streamContainer}>
                <div className={styles.header}>
                    <h3>Live Activity & Chat Stream</h3>
                    <div className={styles.status}>
                        <span className={`${styles.statusDot} ${isConnected ? styles.connected : ''}`}></span>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>

                <div className={styles.mainContent}>

                    {/* ✅ Bagian Log dengan Tab */}
                    <div className={styles.activityLog} ref={logContainerRef}>
                        <div className={styles.tabs}>
                            <button onClick={() => setActiveTab('cart')} className={activeTab === 'cart' ? styles.active : ''}>🛒 Cart Activity</button>
                            <button onClick={() => setActiveTab('checkout')} className={activeTab === 'checkout' ? styles.active : ''}>💳 Checkout Activity</button>
                            <button onClick={() => setActiveTab('user')} className={activeTab === 'user' ? styles.active : ''}>👤 User Activity</button>
                        </div>
                        {renderActiveLog()}

                    </div>
                    {/* <div className={styles.activityLog} ref={logContainerRef}>
                    {messages.map((msg, index) => {
                        const style = getEventStyle(msg.event);
                        // Render pesan chat secara berbeda
                        if (msg.event === 'USER_CHAT') {
                            return (
                                <div key={index} className={styles.logEntry}>
                                    <span className={styles.logIcon} style={{ backgroundColor: style.color }}>{style.icon}</span>
                                    <div className={styles.logDetails}>
                                        <span className={styles.chatHeader}>
                                            <strong>{msg.user}</strong> says:
                                        </span>
                                        <span className={styles.chatMessage}>{msg.message}</span>
                                        <span className={styles.logTimestamp}>{msg.insertedAt}</span>
                                    </div>
                                </div>
                            );
                        }
                        // Render log event seperti biasa
                        return (
                            <div key={index} className={styles.logEntry}>
                                <span className={styles.logIcon} style={{ backgroundColor: style.color }}>{style.icon}</span>
                                <div className={styles.logDetails}>
                                    <span className={styles.logText}>
                                        <strong>{msg.event || 'General'}:</strong> {msg.user || msg.product || JSON.stringify(msg)}
                                    </span>
                                    <span className={styles.logTimestamp}>{msg.insertedAt}</span>
                                </div>
                            </div>
                        );
                    })}
                </div> */}
                    <div className={styles.sidebar}>
                        <div className={styles.onlineUsers}>
                            <h4>Who's Online ({onlineUsers.length})</h4>
                            <ul>
                                {onlineUsers.map((user, index) => <li key={index}><span className={styles.onlineDot}></span>{user}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                {/* ✅ Form INPUT BARU untuk chat */}
                <form onSubmit={handleSendMessage} className={styles.chatInputContainer}>
                    <input
                        type="text"
                        className={styles.chatInput}
                        placeholder="Type a message to broadcast..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        disabled={!isConnected}
                    />
                    <button type="submit" className={styles.sendButton} disabled={!isConnected || !chatMessage.trim()}>
                        Send
                    </button>
                </form>
                <br></br>
                <br></br>

                <div className={styles.trendingProducts}>
                    <h4>🔥 Trending Products (Added to Cart)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={trendingProducts} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} stroke="#a0a0c0" tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                            <Bar dataKey="count" fill="#FFBB28" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <br></br>
                {/* ✅ NEW: Top Checkout Products Chart */}
                <div className={styles.trendingProducts}>
                    <h4>✅ Top Products (Checked Out)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={checkoutTrends} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} stroke="#a0a0c0" tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                            <Bar dataKey="count" fill="#00C49F" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};

export default RealTimeDashboard;