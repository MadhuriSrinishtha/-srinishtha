import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import BASE_URL from '@/config';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/employees/me`, {
          credentials: 'include',
        });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    checkSession();
  }, []);

  if (checking) return <div className="text-center p-6">Checking authentication...</div>;

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;