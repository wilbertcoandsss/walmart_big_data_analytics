// src/context/AnalyticsContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ 1. Buat fungsi fetch yang bisa dipanggil ulang
    // useCallback memastikan fungsi ini tidak dibuat ulang di setiap render
    const fetchAnalysisData = useCallback(async () => {
        setLoading(true); // Mulai loading setiap kali di-fetch
        setError(null);
        try {
            const response = await fetch('/api/analytics_full');
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            setAnalysisData(data);
        } catch (e) {
            console.error("Failed to fetch analytics data:", e);
            setError(`Could not load data from API. Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, []); // Array dependensi kosong, fungsi ini stabil

    // ✅ 2. useEffect untuk fetch data pertama kali saat aplikasi dimuat
    useEffect(() => {
        fetchAnalysisData();
    }, [fetchAnalysisData]); // Hanya akan berjalan sekali saat komponen mount

    // ✅ 3. Buat fungsi refresh yang akan kita ekspor
    const refreshData = () => {
        fetchAnalysisData();
    };

    // ✅ 4. Tambahkan refreshData ke value yang disediakan oleh provider
    const value = { analysisData, loading, error, refreshData };

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => useContext(AnalyticsContext);