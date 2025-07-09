import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCheck, FaTimes } from "react-icons/fa";

const AdminLeavePanel = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(
          "http://localhost:9292/api/v1/leave-requests",
          { withCredentials: true }
        );
        setRequests(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch.");
      }
    };
    fetch();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `http://localhost:9292/api/v1/leave-requests/${id}`,
        { status },
        { withCredentials: true }
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      setError("Failed update.");
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-2xl mb-4">Admin Panel</h2>
      {error && <p className="text-red-500">{error}</p>}
      <table className="w-full table-auto text-sm">
        <thead>{/* column headers */}</thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.employee_email}</td>
              <td>{r.leave_type}</td>
              <td>{new Date(r.start_date).toLocaleDateString()}</td>
              <td>{new Date(r.end_date).toLocaleDateString()}</td>
              <td>{r.duration} day{r.duration > 1 && 's'}</td>
              <td>{r.reason}</td>
              <td>{r.status}</td>
              <td className="flex gap-2">
                <button onClick={() => updateStatus(r.id, "Approved")}><FaCheck /></button>
                <button onClick={() => updateStatus(r.id, "Rejected")}><FaTimes /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminLeavePanel;
