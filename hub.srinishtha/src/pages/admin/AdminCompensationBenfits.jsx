import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import BASE_URL from '@/config'; // Adjust the path if needed

const AdminCompensationBenefits = () => {
  const [benefits, setBenefits] = useState([]);
  const [newBenefit, setNewBenefit] = useState({
    employee_id: '',
    type: '',
    file: null
  });
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBenefits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/benefits`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setBenefits(data);
    } catch (error) {
      console.error('Failed to fetch benefits:', error);
      setError('Failed to load benefits. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  const handleAddBenefit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newBenefit.employee_id || !newBenefit.type || !newBenefit.file) {
      setError('Please provide employee ID, benefit type, and upload a file.');
      return;
    }

    const formData = new FormData();
    formData.append('employee_id', newBenefit.employee_id);
    formData.append('type', newBenefit.type);
    formData.append('file', newBenefit.file);

    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/api/v1/benefits`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await fetchBenefits();
        setNewBenefit({ employee_id: '', type: '', file: null });
        setShowForm(false);
      } else {
        setError(result.error || 'Failed to upload benefit.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed due to a network or server error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Compensation & Benefits</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          disabled={isLoading}
        >
          <FaPlus />
          <span>{showForm ? 'Cancel' : 'Add Benefit'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-lg shadow border mb-6"
          >
            <form onSubmit={handleAddBenefit} className="space-y-5" encType="multipart/form-data">
              <div>
                <label className="block text-sm font-semibold mb-1">Employee ID</label>
                <input
                  type="text"
                  value={newBenefit.employee_id}
                  onChange={(e) =>
                    setNewBenefit({ ...newBenefit, employee_id: e.target.value.toUpperCase() })
                  }
                  placeholder="EMP123"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Benefit Type</label>
                <select
                  value={newBenefit.type}
                  onChange={(e) => setNewBenefit({ ...newBenefit, type: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="" disabled>Select a benefit type</option>
                  <option value="Offer Letters">Offer Letters</option>
                  <option value="Revision-Hike Letters">Revision-Hike Letters</option>
                  <option value="Pay Slips">Pay Slips</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Upload Document</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setNewBenefit({ ...newBenefit, file: e.target.files[0] || null })
                  }
                  className="block w-full text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Submit'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && <p className="text-center text-gray-500">Loading...</p>}

      <div className="space-y-4">
        {benefits.length === 0 && !isLoading ? (
          <p className="text-gray-500 text-center">No benefits uploaded yet.</p>
        ) : (
          benefits.map((b) => (
            <div key={b.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">{b.type}</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Employee ID: <span className="font-medium">{b.employee_id}</span>
                  </p>
                  <a
                    href={`${BASE_URL}${b.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {b.file_name}
                  </a>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(b.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCompensationBenefits;
