import React, { useState, useEffect } from "react";
import axios from "axios";
import LeaveRequest from "./LeaveRequest";
import LeaveHistory from "./LeaveHistory";
import BASE_URL from '@/config'; // Adjust the path if needed

const LeaveManagement = () => {
  const [activeTab, setActiveTab] = useState("request");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [officialEmail, setOfficialEmail] = useState("guest@example.com");
  const [employeeId, setEmployeeId] = useState("GUEST");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Load session-based user info
        const empRes = await axios.get(`${BASE_URL}/api/v1/employees/me`, {
          withCredentials: true,
        });

        if (empRes.data?.official_email && empRes.data?.employee_id) {
          setOfficialEmail(empRes.data.official_email);
          setEmployeeId(empRes.data.employee_id);
        }
      } catch (err) {
        console.warn("Session not found, using guest.");
        // keep default guest@example.com
      }

      try {
        const leavesRes = await axios.get(`${BASE_URL}/api/v1/leave-requests`, {
          withCredentials: true,
        });
        setLeaveRequests(leavesRes.data || []);
      } catch (err) {
        setError("Unable to load leave data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addLeaveRequest = async (req) => {
    try {
      const payload = {
        leaveType: req.leave_type,
        dayType: req.day_type,
        reason: req.reason,
        startDate: req.start_date,
        endDate: req.end_date,
        duration: req.duration,
        status: "Pending",
        submittedAt: new Date().toISOString(),
        official_email: officialEmail,
      };

      const res = await axios.post(`${BASE_URL}/api/v1/leave-requests`, payload, {
        withCredentials: true,
      });

      setLeaveRequests((prev) => [...prev, res.data]);
      return { success: true, message: "Leave request submitted successfully." };
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Submission failed.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateLeaveRequest = async (id, status) => {
    try {
      await axios.patch(
        `${BASE_URL}/api/v1/leave-requests/${id}`,
        { status },
        { withCredentials: true }
      );
      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      setError("Failed to update leave status.");
    }
  };

  const deleteLeaveRequest = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/v1/leave-requests/${id}`, {
        withCredentials: true,
      });
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError("Failed to delete leave request.");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === "request"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("request")}
        >
          Request Leave
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === "history"
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("history")}
        >
          Leave History
        </button>
      </div>

      {activeTab === "request" ? (
        <LeaveRequest
          officialEmail={officialEmail}
          employeeId={employeeId}
          addLeaveRequest={addLeaveRequest}
        />
      ) : (
        <LeaveHistory
          leaveRequests={leaveRequests}
          officialEmail={officialEmail}
          employeeId={employeeId}
          updateLeaveRequest={updateLeaveRequest}
          deleteLeaveRequest={deleteLeaveRequest}
        />
      )}
    </div>
  );
};

export default LeaveManagement;
