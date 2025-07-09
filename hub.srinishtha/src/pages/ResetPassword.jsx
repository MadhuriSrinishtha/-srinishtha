
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ResetPassword = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: ""
  });
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const resetToken = queryParams.get("token");
    const generatedPassword = queryParams.get("password");
    if (resetToken) {
      setToken(resetToken);
      if (generatedPassword) {
        setFormData({
          new_password: generatedPassword,
          confirm_password: generatedPassword
        });
      }
    } else {
      setError("Invalid or missing reset token. Please use the 'Forgot Password' link to generate a new reset link.");
    }
  }, [location]);

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
    setSuccess("");
    setIsLoading(true);

    if (!formData.new_password || !formData.confirm_password) {
      setError("Please enter and confirm your new password.");
      setIsLoading(false);
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (formData.new_password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    const resetPayload = {
      token: token,
      new_password: formData.new_password
    };
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    console.log(`[${timestamp}] Sending password reset confirmation to: http://localhost:9292/api/v1/employees/password-reset/confirm`);
    console.log(`[${timestamp}] Reset payload:`, JSON.stringify(resetPayload));

    try {
      const response = await fetch('http://localhost:9292/api/v1/employees/password-reset/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173'
        },
        body: JSON.stringify(resetPayload)
      });
      const data = await response.json();

      console.log(`[${timestamp}] Password reset confirmation response:`, JSON.stringify(data));

      if (response.ok && data.success) {
        setSuccess("Password reset successful! Logging you in...");
        
        // Perform automatic login
        const loginPayload = {
          employee_id: data.user.employee_id,
          official_email: data.user.official_email,
          password: formData.new_password
        };

        console.log(`[${timestamp}] Attempting automatic login with payload:`, JSON.stringify(loginPayload));

        try {
          const loginResponse = await fetch('http://localhost:9292/api/v1/employees/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'http://localhost:5173'
            },
            body: JSON.stringify(loginPayload)
          });
          const loginData = await loginResponse.json();

          console.log(`[${timestamp}] Automatic login response:`, JSON.stringify(loginData));

          if (loginResponse.ok && loginData.success) {
            localStorage.setItem("isEmployeeLoggedIn", "true");
            localStorage.setItem("employeeEmail", loginData.user.official_email);
            localStorage.setItem("employeeId", loginData.user.employee_id);
            setIsLoggedIn(true);
            setFormData({ new_password: "", confirm_password: "" });
            navigate("/dashboard", { replace: true });
          } else {
            setError("Password reset successful, but automatic login failed. Please try logging in manually.");
          }
        } catch (loginError) {
          console.error(`[${timestamp}] Automatic login error:`, loginError);
          setError("Password reset successful, but automatic login failed due to a network error. Please try logging in manually.");
        }
      } else {
        setError(data.error || "Failed to reset password. The reset link may be invalid or expired.");
      }
    } catch (error) {
      console.error(`[${timestamp}] Password reset error:`, error);
      setError("Failed to reset password. Please check your network or contact admin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-blue-400">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Reset Password</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter new password"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Confirm new password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
