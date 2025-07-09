import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employee_id: "",
    official_email: "",
    password: ""
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isResetRequested, setIsResetRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Clear incorrect localStorage values to prevent pre-filling with typo
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userEmployeeId");
    localStorage.removeItem("rememberMe");

    localStorage.removeItem('isEmployeeLoggedIn');
    localStorage.removeItem('employeeEmail');
    localStorage.removeItem('employeeId');
    setIsLoggedIn(false);
  }, [setIsLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsResetRequested(false);
    setIsLoading(true);

    if (!formData.employee_id || !formData.official_email || !formData.password) {
      setError("Please enter employee ID, official email, and password");
      setIsLoading(false);
      return;
    }

    // Basic email validation to catch common typos
    if (formData.official_email.includes("vijayakumur")) {
      setError("Possible typo in email. Did you mean 'vijayakumar.sahukari@gmail.com'?");
      setIsLoading(false);
      return;
    }

    const loginPayload = {
      employee_id: formData.employee_id,
      official_email: formData.official_email,
      password: formData.password
    };
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    console.log(`[${timestamp}] Sending login request to: http://localhost:9292/api/v1/employees/login`);
    console.log(`[${timestamp}] Login payload:`, JSON.stringify(loginPayload));

    try {
      const response = await fetch('http://localhost:9292/api/v1/employees/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173'
        },
        body: JSON.stringify(loginPayload)
      });
      const data = await response.json();

      console.log(`[${timestamp}] Login response:`, JSON.stringify(data));

      if (response.ok && data.success) {
        localStorage.setItem("isEmployeeLoggedIn", "true");
        localStorage.setItem("employeeEmail", formData.official_email);
        localStorage.setItem("employeeId", formData.employee_id);

        if (rememberMe) {
          localStorage.setItem("userEmail", formData.official_email);
          localStorage.setItem("userEmployeeId", formData.employee_id);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userEmployeeId");
          localStorage.removeItem("rememberMe");
        }

        setIsLoggedIn(true);
        setFormData({ employee_id: "", official_email: "", password: "" });
        navigate("/dashboard", { replace: true });
      } else {
        setError(data.error || "Login failed. Please verify your credentials or use 'Forgot Password'.");
      }
    } catch (error) {
      console.error(`[${timestamp}] Login error:`, error);
      setError("Login failed. Please check your network or contact admin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setIsResetRequested(false);
    setIsLoading(true);

    if (!formData.employee_id || !formData.official_email) {
      setError("Please enter both employee ID and official email to request a password reset.");
      setIsLoading(false);
      return;
    }

    if (formData.official_email.includes("vijayakumur")) {
      setError("Possible typo in email. Did you mean 'vijayakumar.sahukari@gmail.com'?");
      setIsLoading(false);
      return;
    }

    const resetPayload = {
      employee_id: formData.employee_id,
      official_email: formData.official_email
    };
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    console.log(`[${timestamp}] Sending password reset request to: http://localhost:9292/api/v1/employees/password-reset`);
    console.log(`[${timestamp}] Reset payload:`, JSON.stringify(resetPayload));

    try {
      const response = await fetch('http://localhost:9292/api/v1/employees/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173'
        },
        body: JSON.stringify(resetPayload)
      });
      const data = await response.json();

      console.log(`[${timestamp}] Password reset response:`, JSON.stringify(data));

      if (response.ok) {
        setIsResetRequested(true);
        setError("");
        setFormData({ ...formData, password: "" });
      } else {
        setError(data.error || "Failed to send reset link. Please verify employee ID and email.");
      }
    } catch (error) {
      console.error(`[${timestamp}] Password reset error:`, error);
      setError("Failed to send reset link. Please check your network or contact admin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-blue-400">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Welcome Back</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isResetRequested && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            A password reset link has been generated. Check the console or contact admin for the link.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Employee ID</label>
            <input
              type="text"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter Employee ID (e.g., EMP-786)"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Official Email</label>
            <input
              type="email"
              name="official_email"
              value={formData.official_email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter Official Email (e.g., vijayakumar.sahukari@gmail.com)"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter Password (default: user@123)"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label className="ml-2 block text-sm text-gray-900">Remember me</label>
            </div>
            <a
              href="#"
              onClick={handleForgotPassword}
              className={`text-sm text-blue-600 hover:text-blue-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;