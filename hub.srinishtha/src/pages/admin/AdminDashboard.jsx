import React, { useState, useEffect } from 'react';
import BASE_URL from '@/config'; // Adjust the path if needed

const AdminDashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/v1/announcements`)
      .then(res => res.json())
      .then(setAnnouncements)
      .catch(err => {
        console.error(err);
        alert('Failed to load announcements');
      });
  }, []);

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const newAnnouncement = {
      title: newTitle.trim(),
      description: newDescription.trim(),
      posted: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${BASE_URL}/api/v1/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement)
      });

      if (!res.ok) throw new Error('Failed to post');

      const created = await res.json();
      setAnnouncements([created, ...announcements]);
      setNewTitle('');
      setNewDescription('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert('Error adding announcement');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="p-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Admin Control Panel</h2>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Manage Announcements</h3>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              Add New Announcement
            </button>
          )}

          {showForm && (
            <form onSubmit={handleAddAnnouncement} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2"
                  placeholder="Announcement Title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-y h-32"
                  placeholder="Enter your announcement here..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          )}

          {/* Announcement List */}
          <div className="mt-6">
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div key={a.id} className="p-4 mb-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800">{a.title}</h4>
                  <p className="text-gray-600 mt-1">{a.description}</p>
                  <p className="text-sm text-gray-500 mt-2">Posted: {new Date(a.posted).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No announcements yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
