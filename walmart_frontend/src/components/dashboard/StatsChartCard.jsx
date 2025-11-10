// src/components/dashboard/StatsChartCard.jsx

import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, Label } from 'recharts';
import styles from './StatsChartCard.module.css';

// Tooltip kustom untuk menampilkan nilai asli, bukan segmen
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="recharts-custom-tooltip">
                <p>Min: <strong>{data.min_val.toFixed(2)}</strong></p>
                <p>Avg: <strong>{data.avg_val.toFixed(2)}</strong></p>
                <p>Max: <strong>{data.max_val.toFixed(2)}</strong></p>
            </div>
        );
    }
    return null;
};


const StatsChartCard = ({ stat }) => {
    // Data diubah untuk stacked bar chart
    // Kita membaginya menjadi 3 segmen: dari 0-min, min-avg, dan avg-max
    const chartData = [
        {
            name: stat.metric,
            base: stat.min,                             // Segmen 1: dari 0 hingga min
            avg_range: stat.avg - stat.min,            // Segmen 2: dari min hingga avg
            max_range: stat.max - stat.avg,            // Segmen 3: dari avg hingga max
            // Simpan nilai asli untuk tooltip
            min_val: stat.min,
            avg_val: stat.avg,
            max_val: stat.max,
        }
    ];

    return (
        <div className={styles.cardContainer}>
            <div className={styles.header}>
                <h4 className={styles.cardTitle}>{stat.metric}</h4>
                <span className={styles.avgValue}>{stat.avg.toFixed(2)}</span>
            </div>
            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={50}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 15, right: 30, left: 30, bottom: 5 }}>
                        <XAxis type="number" hide domain={[0, stat.max]} />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                        
                        {/* 3 Bar yang ditumpuk (stacked) */}
                        <Bar dataKey="base" stackId="a" fill="rgba(62, 62, 90, 0.3)" radius={[5, 0, 0, 5]} />
                        <Bar dataKey="avg_range" stackId="a" fill="rgba(136, 132, 216, 0.6)" />
                        <Bar dataKey="max_range" stackId="a" fill="rgba(62, 62, 90, 0.6)" radius={[0, 5, 5, 0]} />
                        
                        {/* Garis referensi untuk menandai posisi AVG */}
                        <ReferenceLine x={stat.avg} stroke="#FFBB28" strokeWidth={2}>
                            <Label value="Avg" position="top" fill="#FFBB28" fontSize={12} />
                        </ReferenceLine>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className={styles.valueLabels}>
                <span>Min: {stat.min.toFixed(2)}</span>
                <span>Max: {stat.max.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default StatsChartCard;