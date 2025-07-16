import React, { useEffect, useState } from 'react';
import BASE_URL from '@/config'; // Adjust the path if needed

const CompanyPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/v1/policies`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch policies");
        return res.json();
      })
      .then((data) => setPolicies(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading policies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Company Policies</h2>
      {policies.length === 0 ? (
        <p>No visible policies.</p>
      ) : (
        policies.map((policy) => (
          <div key={policy.id} className="border-b pb-4 mb-4">
            <h3 className="text-lg font-semibold">{policy.title}</h3>
            <a
              href={policy.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Download {policy.file_name}
            </a>
          </div>
        ))
      )}
    </div>
  );
};

export default CompanyPolicies;
