import React, { useState } from 'react';
import BASE_URL from '@/config';
import { useNavigate } from 'react-router-dom';

const RequestReset = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${BASE_URL}/api/v1/employees/password_reset_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // For demo: navigate with token in URL
        //navigate(`/reset-password?token=${data.token}`);
        setMessage('password link is sent to official mail id');
      } else {
        setError(data.error || 'Failed to generate reset link');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Request Password Reset</h2>
        {message && <p className="text-green-600 mb-2">{message}</p>}
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleRequest}>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter your Employee ID"
            required
            className="w-full px-3 py-2 border rounded mb-4"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestReset;
