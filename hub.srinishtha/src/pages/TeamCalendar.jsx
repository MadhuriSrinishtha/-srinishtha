import React, { useEffect, useState } from 'react';
import BASE_URL from '@/config'; // Adjust the path if needed

const CompanyHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/v1/admin/events`)
      .then((res) => res.json())
      .then((data) => {
        // Sort by date (earliest to latest)
        const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setHolidays(sorted);
      })
      .catch((error) => {
        console.error('Failed to fetch holidays:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        Company Holidays
      </h2>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-center text-blue-600">Loading holidays...</p>
        ) : holidays.length === 0 ? (
          <p className="text-center text-red-600">No holidays found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full text-left table-fixed">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3 w-1/2 text-left">Date</th>
                  <th className="p-3 w-1/2 text-left">Holiday</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((holiday, index) => (
                  <tr
                    key={holiday.id}
                    className={`border-t border-blue-200 ${
                      index % 2 === 0 ? 'bg-blue-100' : 'bg-blue-50'
                    }`}
                  >
                    <td className="p-3 text-blue-800">
                      {new Date(holiday.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3 text-blue-900">{holiday.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyHolidays;