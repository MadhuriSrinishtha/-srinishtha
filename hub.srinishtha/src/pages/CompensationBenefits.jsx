import React, { useState, useEffect } from 'react';
import {
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaDownload,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import BASE_URL from '@/config';

const EmployeeDocuments = () => {
  const [docs, setDocs] = useState([]);
  const [openSection, setOpenSection] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/benefits`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch documents');
        const data = await res.json();
        setDocs(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load documents.');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleView = (doc) => {
    window.open(`${BASE_URL}/api/v1/benefits/view/${doc.id}`, '_blank');
  };

  const handleDownload = async (doc) => {
    const res = await fetch(`${BASE_URL}/api/v1/benefits/download/${doc.id}`, {
      method: 'GET',
      credentials: 'include'
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.file_name || 'document';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePayslipView = () => {
    const empId = docs.find(doc => doc.type === 'Pay Slips')?.employee_id;
    if (!empId || !selectedMonth || !selectedYear) {
      setError('Please select both month and year.');
      return;
    }
    window.open(`${BASE_URL}/api/v1/benefits/view?employee_id=${empId}&month=${selectedMonth}&year=${selectedYear}`, '_blank');
  };

  const handlePayslipDownload = () => {
    const empId = docs.find(doc => doc.type === 'Pay Slips')?.employee_id;
    if (!empId || !selectedMonth || !selectedYear) {
      setError('Please select both month and year.');
      return;
    }
    window.open(`${BASE_URL}/api/v1/benefits/download?employee_id=${empId}&month=${selectedMonth}&year=${selectedYear}`, '_blank');
  };

  const groupedDocs = docs.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {});

  const currentYear = new Date().getFullYear();
  const years = [currentYear.toString(), (currentYear - 1).toString()];

  const renderSection = (title) => {
    const isPayslip = title === 'Pay Slips';
    const filteredDocs = isPayslip ? [] : groupedDocs[title] || [];

    return (
      <div className="bg-white rounded-lg shadow border mb-4 overflow-hidden">
        <div
          className="flex justify-between items-center px-4 py-3 bg-gray-100 cursor-pointer"
          onClick={() => setOpenSection(openSection === title ? null : title)}
        >
          <div className="flex items-center gap-3">
            <FaFileInvoiceDollar className="text-blue-600" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          {openSection === title ? <FaChevronUp /> : <FaChevronDown />}
        </div>

        <AnimatePresence>
          {openSection === title && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 border-t space-y-3"
                  >
              {isPayslip && (
                <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
                  <div className="flex gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">Month</option>
                      {[...Array(12)].map((_, idx) => (
                        <option key={idx} value={String(idx + 1).padStart(2, '0')}>
                          {new Date(0, idx).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <FaEye
                      title="View Payslip"
                      className="text-blue-600 hover:text-blue-800 text-xl cursor-pointer"
                      onClick={handlePayslipView}
                    />
                    <FaDownload
                      title="Download Payslip"
                      className="text-gray-600 hover:text-gray-800 text-xl cursor-pointer"
                      onClick={handlePayslipDownload}
                    />
                  </div>
                </div>
              )}

              {filteredDocs?.map((doc) => (
                <div key={doc.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-800 truncate w-2/3">{doc.file_name}</span>
                  <div className="flex items-center gap-4">
                    <FaEye
                      title="View"
                      className="text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={() => handleView(doc)}
                    />
                    <FaDownload
                      title="Download"
                      className="text-gray-600 hover:text-gray-800 cursor-pointer"
                      onClick={() => handleDownload(doc)}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">My Documents</h2>
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
        {loading && <p className="text-center text-gray-500">Loading documents...</p>}
        {renderSection('Offer Letters')}
        {renderSection('Revision-Hike Letters')}
        {renderSection('Pay Slips')}
      </div>
    </div>
  );
};

export default EmployeeDocuments;
