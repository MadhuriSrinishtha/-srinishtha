import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaEye, FaDownload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = 'http://localhost:9292'; // Backend base URL

const DocumentCard = ({
  title,
  filterOptions,
  filterValue,
  onFilterChange,
  onView,
  onDownload,
  isOpen,
  onToggle
}) => (
  <div className="bg-white rounded-lg shadow border mb-4">
    <div className="flex justify-between p-4 cursor-pointer" onClick={onToggle}>
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {filterOptions && (
          <select
            value={filterValue}
            onChange={(e) => { e.stopPropagation(); onFilterChange(e.target.value); }}
            className="bg-gray-100 px-3 py-1 rounded"
          >
            {filterOptions.map((opt) => <option key={opt}>{opt}</option>)}
          </select>
        )}
      </div>
      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
    </div>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 border-t flex gap-4"
        >
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
            onClick={(e) => { e.stopPropagation(); onView(); }}
          >
            <FaEye /> View
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
          >
            <FaDownload /> Download
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const EmployeeDocuments = () => {
  const [openCards, setOpenCards] = useState({});
  const [paySlipFilter, setPaySlipFilter] = useState('January');
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL}/api/v1/benefits`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setDocs(data);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const findMatch = (type, filter = '') =>
    docs.find(d =>
      d.type === type &&
      (!filter || d.file_name.toLowerCase().includes(filter.toLowerCase()))
    );

  const handleView = (type, filter = '') => {
    const match = findMatch(type, filter);
    if (match && match.file_path) {
      window.open(`${BASE_URL}${match.file_path}`, '_blank');
    } else {
      setError('Document not found.');
    }
  };

  // ✅ UPDATED: Use the download endpoint
  const handleDownload = (type, filter = '') => {
    const match = findMatch(type, filter);
    if (match && match.id) {
      const a = document.createElement('a');
      a.href = `${BASE_URL}/api/v1/download/${match.id}`;
      a.download = match.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      setError('Document not found.');
    }
  };

  const toggleCard = (title) => {
    setOpenCards(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Employee Documents</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading && <p className="text-gray-500 text-center">Loading...</p>}

        {!isLoading && docs.length === 0 && !error && (
          <p className="text-gray-500 text-center">No documents available.</p>
        )}

        <DocumentCard
          title="Offer Letters"
          isOpen={openCards['Offer Letters']}
          onToggle={() => toggleCard('Offer Letters')}
          onView={() => handleView('Offer Letters')}
          onDownload={() => handleDownload('Offer Letters')}
        />

        <DocumentCard
          title="Revision-Hike Letters"
          isOpen={openCards['Revision-Hike Letters']}
          onToggle={() => toggleCard('Revision-Hike Letters')}
          onView={() => handleView('Revision-Hike Letters')}
          onDownload={() => handleDownload('Revision-Hike Letters')}
        />

        <DocumentCard
          title="Pay Slips"
          filterOptions={months}
          filterValue={paySlipFilter}
          onFilterChange={setPaySlipFilter}
          isOpen={openCards['Pay Slips']}
          onToggle={() => toggleCard('Pay Slips')}
          onView={() => handleView('Pay Slips', paySlipFilter)}
          onDownload={() => handleDownload('Pay Slips', paySlipFilter)}
        />
      </div>
    </div>
  );
};

export default EmployeeDocuments;
