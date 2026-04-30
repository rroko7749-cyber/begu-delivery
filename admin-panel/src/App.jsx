import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Couriers from './pages/Couriers';
import Orders from './pages/Orders';
import Support from './pages/Support';
import PromoCodes from './pages/PromoCodes';
import Referrals from './pages/Referrals';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import AdminManagement from './pages/AdminManagement';
import Profile from './pages/Profile';
import CourierMap from './pages/CourierMap';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header onLogout={() => setIsAuthenticated(false)} />
          <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/couriers" element={<Couriers />} />
              <Route path="/courier-map" element={<CourierMap />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/support" element={<Support />} />
              <Route path="/promo-codes" element={<PromoCodes />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="/admins" element={<AdminManagement />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
