import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminHrZone from './pages/admin/AdminHrZone';
import AdminDashboard from './pages/admin/AdminDashboard';
import Dashboard from './pages/Dashboard';
import HrZone from './pages/HrZone';
import ProtectedRoute from './pages/admin/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ResetPassword from './pages/ResetPassword.jsx';
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Clear all login-related data from localStorage on app startup
    localStorage.removeItem('isEmployeeLoggedIn');
    localStorage.removeItem('employeeEmail');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberMe');
    setIsLoggedIn(false);
  }, []);

  const handleEmployeeLogout = () => {
    localStorage.removeItem('isEmployeeLoggedIn');
    localStorage.removeItem('employeeEmail');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberMe');
    setIsLoggedIn(false);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminPassword');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('loginTime');
  };

  return (
    <Router>
      <Routes>
        {/* Root route - always redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route
          path="/login"
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login setIsLoggedIn={setIsLoggedIn} />
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected admin routes */}
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

        {/* Protected user routes */}
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
                      <Route path="*" element={<Navigate to="/login" replace />} />
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