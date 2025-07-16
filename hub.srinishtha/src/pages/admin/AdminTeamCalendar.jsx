import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import BASE_URL from '@/config'; // Adjust the path if needed

const AdminTeamCalendar = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/events`);
      const data = await res.json();
      setEvents(
        data.sort((a, b) => new Date(a.date) - new Date(b.date))
      );
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        setNewEvent({ title: '', date: '' });
        setShowForm(false);
        fetchEvents();
      } else {
        console.error('Failed to add event:', res.status);
      }
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/admin/events/${id}`, { method: 'DELETE' });
      if (res.ok) fetchEvents();
      else console.error('Failed to delete event', id);
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Team Calendar</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FaPlus />
          <span>{showForm ? 'Cancel' : 'Add Event'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-6 rounded-xl shadow-md mb-6 border border-blue-100"
          >
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Save Event
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center">No events added yet.</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                <p className="text-gray-600 mt-2">Date: {event.date}</p>
              </div>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminTeamCalendar;