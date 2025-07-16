// ✅ App.jsx (Main app entry - session-based authentication)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import AdminLogin from './pages/admin/AdminLogin';
import AdminHrZone from './pages/admin/AdminHrZone';
import AdminDashboard from './pages/admin/AdminDashboard';
import Dashboard from './pages/Dashboard';
import HrZone from './pages/HrZone';
import ProtectedRoute from './pages/admin/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RequestReset from './pages/RequestReset';
import ResetPassword from './pages/ResetPassword';
import BASE_URL from './config';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Check login session on app mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/employees/me`, {
          credentials: 'include', // include cookie
        });
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  // ✅ Handle logout - server-side session clear
  const handleEmployeeLogout = async () => {
    await fetch(`${BASE_URL}/api/v1/employees/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/request-reset" element={<RequestReset />} />
        <Route path="/reset-password" element={<ResetPassword setIsLoggedIn={setIsLoggedIn} />} />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <div className="p-6 flex-1">
                <Routes>
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/hr-zone/*" element={<AdminHrZone />} />
                  <Route path="*" element={<Navigate to="/admin/login" replace />} />
                </Routes>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Employee protected routes */}
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <div className="flex min-h-screen">
                <Sidebar onLogout={handleEmployeeLogout} />
                <div className="flex-1">
                  <Navbar />
                  <div className="p-6">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/hr-zone/*" element={<HrZone />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
