import React, { useEffect, useState } from "react";
import Card from '../components/Card';
import { FaUser } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState([]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  useEffect(() => {
    fetch("http://localhost:9292/api/v1/announcements")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setAnnouncements)
      .catch(err => {
        console.error("Error loading announcements:", err);
        alert("Could not fetch announcements. Please try again later.");
      });
  }, []);

  return (
    <div className="min-h-screen p-6 ml-64 mt-[224px] max-w-full">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 mb-8 border border-gray-200"
      >
        <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
          <FaUser className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-blue-700">Hi, Welcome to Srinishtha</h1>
          <p className="text-gray-600 text-sm font-medium">Human Resources Manager</p>
        </div>
      </motion.div>

      {/* Announcements */}
      <div className="bg-white p-6 rounded-xl shadow-lg max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 border border-blue-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 sticky top-0 bg-white z-10 py-2">Recent Announcements</h2>
        <div className="space-y-4">
          <AnimatePresence>
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-xl transition-shadow duration-300 bg-gray-50 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                  <p className="text-gray-600 mt-2 text-sm">{announcement.description}</p>
                  <p className="text-gray-500 text-xs mt-2 font-medium">Posted {new Date(announcement.posted).toLocaleString()}</p>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
