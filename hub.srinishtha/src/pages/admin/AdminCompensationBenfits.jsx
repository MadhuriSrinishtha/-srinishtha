import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = 'http://localhost:9292';

const AdminCompensationBenefits = () => {
  const [benefits, setBenefits] = useState([]);
  const [newBenefit, setNewBenefit] = useState({ type: '', file: null });
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBenefits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/benefits`);
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

    if (!newBenefit.type || !newBenefit.file) {
      setError('Please select a benefit type and choose a file.');
      return;
    }

    const formData = new FormData();
    formData.append('type', newBenefit.type);
    formData.append('file', newBenefit.file);

    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/api/v1/benefits`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await fetchBenefits();
        setNewBenefit({ type: '', file: null });
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Compensation & Benefits</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          <FaPlus />
          <span>{showForm ? 'Cancel' : 'Add Benefit'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {isLoading && <p className="text-gray-500 text-center">Loading...</p>}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-6 rounded-xl shadow-md mb-6 border border-blue-100"
          >
            <form onSubmit={handleAddBenefit} className="space-y-4" encType="multipart/form-data">
              <div>
                <label className="block text-sm font-medium mb-1">Benefit Type</label>
                <select
                  value={newBenefit.type}
                  onChange={(e) => setNewBenefit({ ...newBenefit, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="" disabled>Select Benefit Type</option>
                  <option value="Offer Letters">Offer Letters</option>
                  <option value="Revision-Hike Letters">Revision-Hike Letters</option>
                  <option value="Pay Slips">Pay Slips</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload Document</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setNewBenefit({ ...newBenefit, file: e.target.files[0] || null })
                  }
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Add Benefit'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {benefits.length === 0 && !isLoading ? (
          <p className="text-gray-500 text-center">No benefits added yet.</p>
        ) : (
          benefits.map((b) => (
            <div key={b.id} className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-lg font-semibold">{b.type}</h3>
              <a
                href={b.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {b.file_name}
              </a>
              <p className="text-gray-500 text-xs">
                Added: {new Date(b.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCompensationBenefits;
