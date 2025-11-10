// src/pages/AIDashboard.jsx

import React, { useState } from 'react';
import ClusteringDashboard from '../components/dashboard/ClusteringDashboard';
import { Button } from '../components/common/Button';
import styles from './AIDashboard.module.css';

const AIDashboard = () => {
    const [daysSincePurchase, setDaysSincePurchase] = useState(90);
    const [totalVisits, setTotalVisits] = useState(1);
    const [totalSpend, setTotalSpend] = useState(1200);
    
    const [predictionResult, setPredictionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePrediction = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setPredictionResult(null);

        try {
            // Using /api/ proxy from Vite config for development
            const response = await fetch('/api/predict_churn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    days_since_last_purchase: parseInt(daysSincePurchase, 10),
                    total_visits: parseInt(totalVisits, 10),
                    total_spend: parseFloat(totalSpend)
                }),
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            const data = await response.json();
            setPredictionResult(data);

        } catch (err) {
            setError('Failed to get prediction. Please ensure the API is running.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="master-dashboard">
            <h1 className="dashboard-header">🤖 AI-Powered Insights Dashboard</h1>

            {/* --- Section 1: Customer Segmentation --- */}
            <div className="chart-row-1">
                <div className="chart-box full">
                    <h3>Customer Segmentation by Clustering</h3>
                    <p className={styles.sectionDescription}>
                        This chart visualizes distinct customer groups based on their age and spending habits. Use the buttons to switch between K-Means and GMM clustering algorithms.
                    </p>
                    <ClusteringDashboard />
                </div>
            </div>
            <br></br>
            <br></br>
            {/* --- Section 2: Real-time Churn Prediction --- */}
            <div className="chart-row-1">
                <div className="chart-box full">
                    <h3>Real-time Churn Prediction</h3>
                    <p className={styles.sectionDescription}>
                        Enter customer data below to get an instant prediction from multiple ML models.
                    </p>
                    <div className={styles.predictionContainer}>
                        <form onSubmit={handlePrediction} className={styles.predictionForm}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="days">Days Since Last Purchase</label>
                                <input id="days" type="number" value={daysSincePurchase} onChange={e => setDaysSincePurchase(e.target.value)} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="visits">Total Visits</label>
                                <input id="visits" type="number" value={totalVisits} onChange={e => setTotalVisits(e.target.value)} />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="spend">Total Spend ($)</label>
                                <input id="spend" type="number" value={totalSpend} onChange={e => setTotalSpend(e.target.value)} />
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Predicting...' : 'Predict Churn'}
                            </Button>
                        </form>
                        <div className={styles.resultArea}>
                            <h4>Model Predictions</h4>
                            {isLoading && <p>Loading...</p>}
                            {error && <p className={styles.errorText}>{error}</p>}
                            {predictionResult && (
                                <div className={styles.predictionGrid}>
                                    {Object.entries(predictionResult).map(([modelName, result]) => {
                                        const isChurn = result.prediction_label === 'Churn';
                                        const resultClass = isChurn ? styles.churn : styles.noChurn;
                                        
                                        return (
                                            <div key={modelName} className={`${styles.modelResultCard} ${resultClass}`}>
                                                <h5 className={styles.modelTitle}>{modelName.replace(/([A-Z])/g, ' $1').trim()}</h5>
                                                <div className={styles.resultRow}>
                                                    <span className={styles.resultLabel}>Prediction</span>
                                                    <span className={styles.resultValue}>{result.prediction_label}</span>
                                                </div>
                                                <div className={styles.resultRow}>
                                                    <span className={styles.resultLabel}>Churn Probability</span>
                                                    <span className={styles.resultValue}>
                                                        {(result.probability_churn * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIDashboard;