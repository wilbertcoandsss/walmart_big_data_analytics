// src/App.jsx
import './App.css';
import LoginPage from './pages/LoginPage';
// Perubahan ada di baris ini
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import KafkaListener from './pages/Kafka';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import { AuthProvider } from './context/AuthContext';
import { AnalyticsProvider } from './context/AnalyticsContext';

function App() {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        <Router>
          <main className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/kafka" element={<KafkaListener />} />
              {/* Pastikan nama komponen ini benar, sesuai nama file DashboardPage.jsx */}
              {/* <Route path="/gptdashboard" element={<CustomerDashboard />} />  */}
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* <Route path="/aidashboard" element={<AIDashboard />} /> */}
            </Routes>
          </main>
        </Router>
      </AnalyticsProvider>
    </AuthProvider>
  );
}

export default App;