import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaEdit } from "react-icons/fa";
import { MdOutlineHourglassBottom } from "react-icons/md";
import BASE_URL from '@/config'; // Adjust the path if needed

const AdminLeavePanel = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/leave-requests`, {
          withCredentials: true,
        });
        setRequests(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch leave requests.");
      }
    };
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `${BASE_URL}/api/v1/leave-requests/${id}`,
        { status },
        { withCredentials: true }
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <FaCheckCircle className="text-green-600 mx-auto" title="Approved" />;
      case "Rejected":
        return <FaTimesCircle className="text-red-600 mx-auto" title="Rejected" />;
      default:
        return <MdOutlineHourglassBottom className="text-yellow-500 mx-auto" title="Pending" />;
    }
  };

  const getNextStatus = (current) => {
    if (current === "Pending") return "Approved";
    if (current === "Approved") return "Rejected";
    return "Pending";
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-blue-700 text-center mb-6">
        Leave Management Panel
      </h2>

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-xl overflow-hidden text-sm">
          <thead className="bg-blue-200 text-blue-900 uppercase font-semibold">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-center">Type</th>
              <th className="p-3 text-center">Start</th>
              <th className="p-3 text-center">End</th>
              <th className="p-3 text-center">Days</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-center w-24">Status</th>
              <th className="p-3 text-center w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {requests.map((r, idx) => (
              <tr key={r.id} className={idx % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                <td className="p-3">{r.employee_email}</td>
                <td className="p-3 text-center">{r.leave_type}</td>
                <td className="p-3 text-center">{new Date(r.start_date).toLocaleDateString()}</td>
                <td className="p-3 text-center">{new Date(r.end_date).toLocaleDateString()}</td>
                <td className="p-3 text-center">{r.duration}</td>
                <td className="p-3 text-left">{r.reason}</td>
                <td className="p-3 text-center">{getStatusIcon(r.status)}</td>
                <td className="p-3 flex justify-center items-center gap-4">
                  <button
                    onClick={() => updateStatus(r.id, "Approved")}
                    title="Approve"
                    className="text-green-600 hover:text-green-800"
                  >
                    <FaCheckCircle size={18} />
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, "Rejected")}
                    title="Reject"
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTimesCircle size={18} />
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, getNextStatus(r.status))}
                    title="Edit Status"
                    className="text-amber-500 hover:text-amber-700"
                  >
                    <FaEdit size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan="8" className="p-6 text-center text-gray-500">
                  No leave requests available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLeavePanel;
