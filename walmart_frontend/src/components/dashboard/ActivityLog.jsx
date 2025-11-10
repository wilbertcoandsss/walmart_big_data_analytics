// src/components/dashboard/ActivityLog.jsx

import React from 'react';
import styles from './RealTimeDashboard.module.css'; // Kita akan pakai style yang sama

// Helper untuk styling & ikon event
const getEventStyle = (eventType) => {
    switch (eventType) {
        case 'USER_LOGIN': return { icon: '👤', color: '#00C49F' };
        case 'USER_REGISTER': return { icon: '✨', color: '#0088FE' };
        case 'ADD_TO_CART': return { icon: '🛒', color: '#FFBB28' };
        case 'CHECKOUT': return { icon: '💳', color: '#8884d8' };
        case 'USER_CHAT': return { icon: '💬', color: '#FF6384' };
        default: return { icon: '🔹', color: '#a0a0c0' };
    }
};

const ActivityLog = ({ messages, logContainerRef }) => {
    return (
        <div className={styles.activityLog} ref={logContainerRef}>
            {messages.length === 0 ? (
                <p className={styles.emptyLog}>No activity in this category yet.</p>
            ) : (
                messages.map((msg, index) => {
                    const style = getEventStyle(msg.event);
                    if (msg.event === 'USER_CHAT') {
                        return (
                            <div key={index} className={styles.logEntry}>
                                <span className={styles.logIcon} style={{ backgroundColor: style.color }}>{style.icon}</span>
                                <div className={styles.logDetails}>
                                    <span className={styles.chatHeader}><strong>{msg.user}</strong> says:</span>
                                    <span className={styles.chatMessage}>{msg.message}</span>
                                    <span className={styles.logTimestamp}>{msg.insertedAt}</span>
                                </div>
                            </div>
                        );
                    }
                    // Render untuk checkout dengan detail produk
                    if (msg.event === 'CHECKOUT' && msg.products) {
                         return (
                            <div key={index} className={styles.logEntry}>
                                <span className={styles.logIcon} style={{ backgroundColor: style.color }}>{style.icon}</span>
                                <div className={styles.logDetails}>
                                    <span className={styles.logText}><strong>{msg.event}:</strong> {msg.user}</span>
                                    <ul className={styles.productList}>
                                        {msg.products.map((p, i) => <li key={i}>{p.quantity}x {p.name}</li>)}
                                    </ul>
                                    <span className={styles.logTimestamp}>{msg.insertedAt}</span>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={index} className={styles.logEntry}>
                            <span className={styles.logIcon} style={{ backgroundColor: style.color }}>{style.icon}</span>
                            <div className={styles.logDetails}>
                                <span className={styles.logText}><strong>{msg.event || 'General'}:</strong> {msg.user || msg.product || JSON.stringify(msg.details || msg)}</span>
                                <span className={styles.logTimestamp}>{msg.insertedAt}</span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ActivityLog;