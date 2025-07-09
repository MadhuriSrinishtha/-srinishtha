import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const loginStatus = localStorage.getItem('isAdminLoggedIn');
      const loginTime = localStorage.getItem('loginTime');
      const currentTime = new Date().getTime();

      if (loginStatus === 'true' && loginTime) {
        const timeDiff = currentTime - parseInt(loginTime);
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        if (timeDiff > fiveMinutes) {
          // Session expired
          localStorage.removeItem('isAdminLoggedIn');
          localStorage.removeItem('loginTime');
          setIsAuthenticated(false);
        } else {
          // Update login time to keep session active only if user is interacting
          if (document.hasFocus()) {
            localStorage.setItem('loginTime', currentTime.toString());
          }
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Check authentication status every 30 seconds
    const interval = setInterval(checkAuth, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;