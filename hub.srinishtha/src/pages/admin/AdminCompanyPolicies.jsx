import React, { useState, useEffect } from 'react';
import { FaPlus, FaSyncAlt, FaEyeSlash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCompanyPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [newPolicy, setNewPolicy] = useState({ title: '', file: null });
  const [showForm, setShowForm] = useState(false);

  const fetchPolicies = async () => {
    try {
      const res = await fetch('http://localhost:9292/api/v1/policies');
      const data = await res.json();
      setPolicies(data);
    } catch (err) {
      console.error('Error fetching policies:', err);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newPolicy.title);
    formData.append('file', newPolicy.file);

    try {
      const res = await fetch('http://localhost:9292/api/v1/policies', {
        method: 'POST',
        body: formData,
        // No headers!
      });

      const data = await res.json();
      if (res.ok) {
        await fetchPolicies();
        setNewPolicy({ title: '', file: null });
        setShowForm(false);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (err) {
      console.error('Error uploading:', err);
    }
  };

  const handleUpdatePolicy = async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch(`http://localhost:9292/api/v1/policies/${id}/file`, {
        method: 'PATCH',
        body: formData,
      });
      fetchPolicies();
    } catch (err) {
      console.error('Error updating policy file:', err);
    }
  };

  const handleToggleHide = async (id) => {
    try {
      await fetch(`http://localhost:9292/api/v1/policies/${id}/hide`, {
        method: 'PATCH',
      });
      fetchPolicies();
    } catch (err) {
      console.error('Error hiding policy:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Company Policies</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus />
          {showForm ? 'Cancel' : 'Add Policy'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleAddPolicy}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-100 p-4 rounded-lg mb-6 space-y-4"
          >
            <input
              type="text"
              placeholder="Policy Title"
              value={newPolicy.title}
              onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setNewPolicy({ ...newPolicy, file: e.target.files[0] })}
              className="w-full border p-2 rounded"
              required
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Policy
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {policies.map((policy) => (
        <div key={policy.id} className={`p-4 bg-white border rounded-lg shadow mb-4 ${policy.is_hidden ? 'opacity-50' : ''}`}>
          <h3 className="text-lg font-bold">{policy.title}</h3>
          <p>File: {policy.file_name}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.doc,.docx';
                input.onchange = (e) => {
                  if (e.target.files[0]) {
                    handleUpdatePolicy(policy.id, e.target.files[0]);
                  }
                };
                input.click();
              }}
            >
              <FaSyncAlt />
            </button>
            <button onClick={() => handleToggleHide(policy.id)}>
              <FaEyeSlash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminCompanyPolicies;
