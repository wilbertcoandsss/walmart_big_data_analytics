// src/pages/EnhancedDashboard.jsx

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, ComposedChart, Line
} from 'recharts';
import { useAnalytics } from '../context/AnalyticsContext';
import { Button } from '../components/common/Button';
import StatsChartCard from '../components/dashboard/StatsChartCard';
// Komponen Clustering sudah tidak di-import di sini, akan pindah ke AI Dashboard
import styles from './EnchancedDashboard.module.css';
const COLOR_PALETTE = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d',
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
];

// --- Komponen Kartu Metrik ---
const MetricCard = ({ title, value, unit = '', color = '#0088FE' }) => (
  <div className="metric-card" style={{ borderLeftColor: color }}>
    <h3 className="card-title">{title}</h3>
    <p className="card-value" style={{ color: color }}>
      {typeof value === 'number'
        ? value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
        : value
      }
      {unit}
    </p>
  </div>
);

// --- Custom Dark Tooltip untuk Recharts ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="recharts-custom-tooltip">
        <p className="recharts-tooltip-label">{label}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color || pld.fill }}>
            {`${pld.name}: ${pld.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Komponen Utama Dashboard ---
const EnhancedDashboard = () => {
  // const [analysisData, setAnalysisData] = useState(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);

  // useEffect(() => {
  //   const fetchAnalysisData = async () => {
  //     try {
  //       const response = await fetch('/api/analytics_full');
  //       if (!response.ok) throw new Error(`Failed to load business analytics. Status: ${response.status}`);
  //       const data = await response.json();
  //       setAnalysisData(data);
  //     } catch (e) {
  //       console.error("Failed to fetch data:", e);
  //       setError(`Could not load data from the API. Error: ${e.message}`);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchAnalysisData();
  // }, []);
  const { analysisData, loading, error, refreshData } = useAnalytics();
  if (loading) return <div className="status-message">Loading Enhanced Analytics from Cloudera...</div>;
  if (error) return <div className="status-message error">{error}</div>;
  if (!analysisData) return <div className="status-message">No analytics data available.</div>;

  const {
    general_stats, satisfaction_distribution, repeat_customer_insights, top_payment_methods,
    best_product_category, numeric_stats, spending_insights, churn_insights, complaints_insights, top_products
  } = analysisData;

  // --- Memformat Data untuk Visualisasi ---
  const satisfactionData = satisfaction_distribution.map(item => ({ score: item.satisfaction_score, 'Total Customers': item.count_customers }));
  const repeatByMembership = repeat_customer_insights.by_membership.map(item => ({ name: item.membership_status, 'Repeat Customers': item.repeat_count })).sort((a, b) => b['Repeat Customers'] - a['Repeat Customers']);
  const paymentMethodData = top_payment_methods.map(p => ({ name: p.payment_method, value: p.count }));
  const categoryPerformanceData = best_product_category.map(cat => ({ name: cat.product_category, 'Revenue ($M)': parseFloat((cat.total_spent / 1000000).toFixed(2)), 'Transactions': cat.count, 'Avg. Satisfaction': parseFloat(cat.avg_satisfaction.toFixed(2)) })).sort((a, b) => b['Revenue ($M)'] - a['Revenue ($M)']);
  const spendingByMembershipData = spending_insights.by_membership.map(item => ({ name: item.membership_status, 'Total Spent ($M)': parseFloat((item.total_spent / 1000000).toFixed(2)), 'Average Visits': parseFloat(item.avg_visits.toFixed(1)) }));
  const numericStatsArray = Object.entries(numeric_stats).map(([key, value]) => ({ metric: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), avg: value.avg, min: value.min, max: value.max }));

  // ✅ DATA BARU UNTUK VISUALISASI TAMBAHAN
  const churnByMembership = churn_insights.by_membership.map(item => ({ name: item.membership_status, 'Churn Rate (%)': parseFloat((item.churn_rate * 100).toFixed(2)) })).sort((a, b) => b['Churn Rate (%)'] - a['Churn Rate (%)']);
  const complaintsByLocation = complaints_insights.map(item => ({ name: item.location, 'Total Complaints': item.total_complaints })).sort((a, b) => b['Total Complaints'] - a['Total Complaints']);
  const topProductsData = top_products.map(p => ({ name: p.product_name, 'Transactions': p.count })).sort((a, b) => b.Transactions - a.Transactions);

  return (
    <div className="master-dashboard">
      {/* <h1 className="dashboard-header">📈 General & Operational Dashboard</h1> */}
      <div className="dashboard-header-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <h1 className="dashboard-header">📈 General & Operational Dashboard</h1>
        {/* ✅ Tombol Refresh */}
        <Button onClick={refreshData} disabled={loading} variant="secondary">
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </Button>
      </div>
      <h2>I. Key Business Metrics</h2>
      <div className="metric-grid">
        <MetricCard title="Total Customers" value={general_stats.total_customers} color={COLOR_PALETTE[0]} />
        <MetricCard title="Total Revenue" value={general_stats.total_spent} unit="$" color={COLOR_PALETTE[1]} />
        <MetricCard title="Total Churned Customers" value={general_stats.total_churn} color={COLOR_PALETTE[6]} />
        <MetricCard title="Repeat Customers" value={general_stats.total_repeat_customers} color={COLOR_PALETTE[4]} />
        <MetricCard title="Avg. Satisfaction" value={general_stats.average_satisfaction_score.toFixed(2)} unit="/ 5" color={COLOR_PALETTE[2]} />
        <MetricCard title="Avg. Spend per Customer" value={general_stats.average_spent} unit="$" color={COLOR_PALETTE[3]} />
      </div>

      <h2>II. Customer Health & Loyalty</h2>
      <div className="chart-row-3"> {/* Menggunakan 3 kolom untuk gambaran lengkap */}
        <div className="chart-box medium">
          <h3>Customer Satisfaction Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={satisfactionData} margin={{ top: 20, right: 30 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="score" /><YAxis /><Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }} /><Bar dataKey="Total Customers">{satisfactionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box medium">
          <h3>Repeat Customers by Membership</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={repeatByMembership} margin={{ top: 20, right: 30 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }} /><Legend /><Bar dataKey="Repeat Customers" fill={COLOR_PALETTE[5]} /></BarChart>
          </ResponsiveContainer>
        </div>
        {/* ✅ VISUALISASI BARU 1: CHURN INSIGHTS */}
        <div className="chart-box medium">
          <h3>Critical: Churn Rate by Membership</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={churnByMembership} layout="vertical" margin={{ left: 30, right: 30 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={(tick) => `${tick}%`} /><YAxis dataKey="name" type="category" width={80} /><Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 206, 206, 0.2)' }} /><Bar dataKey="Churn Rate (%)" fill={COLOR_PALETTE[6]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2>III. Financial & Product Insights</h2>
      <div className="chart-row-1">
        <div className="chart-box full">
          <h3>Product Category Performance</h3>
          <ResponsiveContainer width="100%" height={400}><ComposedChart data={categoryPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis yAxisId="left" orientation="left" stroke={COLOR_PALETTE[0]} tickFormatter={(tick) => `$${tick}M`} /><YAxis yAxisId="right" orientation="right" stroke={COLOR_PALETTE[3]} domain={[1, 5]} /><Tooltip content={<CustomTooltip />} /><Legend /><Bar yAxisId="left" dataKey="Revenue ($M)" fill={COLOR_PALETTE[0]} /><Bar yAxisId="left" dataKey="Transactions" fill={COLOR_PALETTE[1]} /><Line yAxisId="right" type="monotone" dataKey="Avg. Satisfaction" stroke={COLOR_PALETTE[3]} strokeWidth={3} /></ComposedChart></ResponsiveContainer>
        </div>
      </div>
      <br></br>
      <br></br>
      <div className="chart-row-2">
        {/* ✅ VISUALISASI BARU 2: TOP 5 PRODUCTS */}
        <div className="chart-box medium">
          <h3>Top 5 Products by Transactions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData} layout="vertical" margin={{ left: 40, right: 30 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Transactions" fill={COLOR_PALETTE[0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box medium">
          <h3>Payment Method Distribution</h3>
          <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>{paymentMethodData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer>
        </div>
      </div>

      {/* ✅ VISUALISASI BARU 3: OPERATIONAL INSIGHTS */}
      <h2>IV. Operational Insights</h2>
      <div className="chart-row-1">
        <div className="chart-box full">
          <h3>Operational Hotspots: Complaints by Location</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={complaintsByLocation} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="Total Complaints" fill={COLOR_PALETTE[3]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* <h2>V. Detailed Numerical Statistics</h2>
      <div className="chart-row-1">
        <div className="chart-box full">
          <h3>Overall Data Statistics</h3>
          <div className="stats-table-container">
            <table className="stats-table">
              <thead><tr><th>Metric</th><th>Average</th><th>Minimum</th><th>Maximum</th></tr></thead>
              <tbody>{numericStatsArray.map(stat => (<tr key={stat.metric}><td>{stat.metric}</td><td>{stat.avg.toFixed(2)}</td><td>{stat.min.toFixed(2)}</td><td>{stat.max.toFixed(2)}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div> */}
      <h2>V. Detailed Numerical Statistics</h2>
      <div className={styles.statsgrid}> {/* Ganti chart-row-1 dengan class grid baru */}
        {numericStatsArray.map(stat => (
          <StatsChartCard key={stat.metric} stat={stat} />
        ))}
      </div>
    </div>
  );
};

export default EnhancedDashboard;