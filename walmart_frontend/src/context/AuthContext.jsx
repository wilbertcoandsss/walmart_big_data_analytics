// src/context/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Awalnya tidak ada user yang login

    const login = (userData) => {
        setUser(userData); // userData bisa berupa { email: 'admin@walmart.com', name: 'Admin' }
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook kustom untuk akses mudah
export const useAuth = () => useContext(AuthContext);