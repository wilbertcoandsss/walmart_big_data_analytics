// src/pages/DashboardPage.jsx (Example)
import React, { useState } from 'react';
import AiDashboard from './AiDashboard'; // Your new AI Dashboard
import EnhancedDashboard from './EnchancedDashboard';
import RealTimeDashboard from './RealTimeDashboard';
import GraphAnalytics from '../components/dashboard/GraphAnalytics';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'ai'

  return (
    <>
    <h1 style={{textAlign: 'center'}}>Walmart Dashboard</h1>
    <div className="dashboard-page">
      <div className="tabs">
        <button onClick={() => setActiveTab('general')} className={activeTab === 'general' ? 'active' : ''}>
          General Dashboard
        </button>
        <button onClick={() => setActiveTab('ai')} className={activeTab === 'ai' ? 'active' : ''}>
          AI Dashboard
        </button>
        <button onClick={() => setActiveTab('realtime')} className={activeTab === 'realtime' ? 'active' : ''}>
          Real-Time Dashboard
        </button>
        <button onClick={() => setActiveTab('graph')} className={activeTab === 'graph' ? 'active' : ''}>
          Graph Analytics Dashboard
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'general' && <EnhancedDashboard />}
        {activeTab === 'ai' && <AiDashboard />}
        {activeTab === 'realtime' && <RealTimeDashboard />}
        {activeTab === 'graph' && <GraphAnalytics />}
      </div>
    </div>
    </>
  );
};

export default DashboardPage;