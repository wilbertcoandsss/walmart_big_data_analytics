// src/components/dashboard/ClusteringDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

// Sharper, more vibrant colors for better contrast
const CLUSTER_COLORS = [
  'rgba(255, 99, 132, 0.9)',  // Cluster 0: Bright Red   -> Thrifty Trendsetters
  'rgba(255, 206, 86, 0.9)',  // Cluster 1: Bright Yellow -> Core Customers
  'rgba(54, 162, 235, 0.9)',  // Cluster 2: Bright Blue   -> Pragmatic Shoppers
  'rgba(75, 192, 192, 0.9)',  // Cluster 3: Bright Teal   -> Cautious Seniors
  'rgba(153, 102, 255, 0.9)', // Cluster 4: Bright Purple -> Affluent Loyalists
  // 'rgba(255, 159, 64, 0.9)',  // Oranye (cadangan)
];

// --- ✅ Cluster Interpretation Data ---
const CLUSTER_INTERPRETATIONS = {
    0: {
        title: "Thrifty Trendsetters",
        description: "A younger demographic (ages 20-35) with the lowest spending power. They are likely students or in their early careers. Purchases are small but can be frequent.",
        action: "Target with social media campaigns, student discounts, and entry-level product promotions. Focus on building long-term loyalty."
    },
    1: {
        title: "Core Customers",
        description: "The largest and most consistent segment, representing the average customer. They have moderate to high spending across a wide age range (30-55).",
        action: "Maintain engagement with regular email marketing, new product announcements, and personalized recommendations to increase visit frequency."
    },
    2: {
      title: "Pragmatic Shoppers",
      description: "This group spans a wider age range (25-45) and is highly budget-conscious. Their spending is low to moderate, and they are very responsive to deals.",
      action: "Engage with value-based marketing, bundle deals, and loyalty programs that reward consistent, smaller purchases."
    },
    3: {
        title: "Cautious Seniors",
        description: "The oldest demographic (55+), characterized by low, concentrated spending. They are likely retirees on a fixed income, purchasing specific essentials.",
        action: "Focus on clear, simple marketing for essential goods (e.g., Pharmacy, Groceries). Build trust through reliability and good service."
    },
    4: {
        title: "Affluent Loyalists",
        description: "A mature and established demographic (ages 40-65) with the highest spending power. They value quality, convenience, and premium products.",
        action: "Target with premium product offerings, exclusive 'Plus' membership benefits, and personalized high-value services."
    }
};


const ClusteringDashboard = () => {
  const [customerData, setCustomerData] = useState(null);
  const [activeAlgo, setActiveAlgo] = useState('kmeans'); // Default to K-Means as per image
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cluster_customers');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCustomerData(data);
      } catch (e) {
        console.error("Failed to fetch data:", e);
        setError("Could not load data from the API.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="status-message">Loading customer data...</div>;
  if (error) return <div className="status-message error">{error}</div>;
  if (!customerData) return <div className="status-message">No data found.</div>;

  const dataToDisplay = activeAlgo === 'kmeans' ? customerData.kmeans_clusters : customerData.gmm_clusters;
  const clusterKey = activeAlgo === 'kmeans' ? 'cluster_kmeans' : 'cluster_gmm';
  
  const chartData = { datasets: [] };
  const groupedData = dataToDisplay.reduce((acc, customer) => {
    const clusterNum = customer[clusterKey];
    if (!acc[clusterNum]) acc[clusterNum] = [];
    acc[clusterNum].push({ x: customer.age, y: customer.total_spend });
    return acc;
  }, {});

Object.keys(groupedData).sort((a, b) => parseInt(a) - parseInt(b)).forEach((clusterNumStr) => {
    const clusterNum = parseInt(clusterNumStr); // Pastikan ini angka
    chartData.datasets.push({
      label: `Cluster ${clusterNum}`, // Label tetap C0, C1, dst.
      data: groupedData[clusterNum],
      // Warna diambil berdasarkan index/nomor cluster
      backgroundColor: CLUSTER_COLORS[clusterNum % CLUSTER_COLORS.length], 
      borderColor: CLUSTER_COLORS[clusterNum % CLUSTER_COLORS.length].replace('0.9)', '1)'),
      borderWidth: 1,
      pointRadius: 5,
      pointHoverRadius: 7,
    });
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#333', font: { size: 14 } } },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            const point = context.parsed;
            label += `(Age: ${point.x}, Spend: $${point.y.toLocaleString()})`;
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { display: true, text: 'Customer Age (Years)', color: '#333', font: { size: 16 } },
        min: 15,
        max: 80,
        ticks: { color: '#333' },
        grid: { color: 'rgba(0, 0, 0, 0.1)' }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Total Spend ($)', color: '#333', font: { size: 16 } },
        ticks: { color: '#333', callback: (value) => `$${(value / 1000).toFixed(1)}k` },
        grid: { color: 'rgba(0, 0, 0, 0.1)' }
      },
    },
  };

  return (
    <div className="clustering-container">
      <div className="algo-switcher">
        <button onClick={() => setActiveAlgo('kmeans')} className={activeAlgo === 'kmeans' ? 'active' : ''}>K-Means</button>
        <button onClick={() => setActiveAlgo('gmm')} className={activeAlgo === 'gmm' ? 'active' : ''}>GMM</button>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '500px' }}>
        <Scatter options={options} data={chartData} />
      </div>

      {/* --- ✅ NEW: Interpretation Section --- */}
      <div className="interpretations-section">
        <h2>Cluster Interpretations</h2>
        <div className="interpretations-grid">
            {Object.entries(CLUSTER_INTERPRETATIONS).map(([key, value]) => (
                <div key={key} className="interpretation-card">
                    <h4 className="card-title-interpret" style={{ borderBottomColor: CLUSTER_COLORS[key] }}>
                       Cluster {parseInt(key)+1}: {value.title}
                    </h4>
                    <p><strong>Characteristics:</strong> {value.description}</p>
                    <p><strong>Recommended Action:</strong> {value.action}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ClusteringDashboard;