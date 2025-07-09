
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Dummy admin credentials
  const dummyCredentials = {
    email: "demo@srinishtha.com",
    password: "Srinishth@demo",
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("adminEmail");
    const savedPassword = localStorage.getItem("adminPassword");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedEmail && savedPassword && savedRememberMe) {
      setCredentials({
        email: savedEmail,
        password: savedPassword,
      });
      setRememberMe(true);
    }

    // Check if session is still valid
    const loginStatus = localStorage.getItem("isAdminLoggedIn");
    const loginTime = localStorage.getItem("loginTime");
    const currentTime = new Date().getTime();

    if (loginStatus === "true" && loginTime) {
      const timeDiff = currentTime - parseInt(loginTime);
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (timeDiff <= fiveMinutes) {
        // Session still valid, update login time if focused
        if (document.hasFocus()) {
          localStorage.setItem("loginTime", currentTime.toString());
        }
        // Only navigate if not already on a protected route
        if (location.pathname !== "/admin/dashboard") {
          const from = location.state?.from || "/admin/";
          navigate(from, { replace: true });
        }
      } else {
        // Session expired, clear login data
        localStorage.removeItem("isAdminLoggedIn");
        localStorage.removeItem("loginTime");
      }
    }
  }, [navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (
        credentials.email === dummyCredentials.email &&
        credentials.password === dummyCredentials.password
      ) {
        if (rememberMe) {
          localStorage.setItem("adminEmail", credentials.email);
          localStorage.setItem("adminPassword", credentials.password);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("adminEmail");
          localStorage.removeItem("adminPassword");
          localStorage.removeItem("rememberMe");
        }

        // Set login time and status
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("isAdmin", "true"); // Set admin status
        localStorage.setItem("loginTime", new Date().getTime().toString());

        // Redirect to the intended page
        const from = location.state?.from || "/admin/hr-zone";
        navigate(from, { replace: true });
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;