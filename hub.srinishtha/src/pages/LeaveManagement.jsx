import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LeaveRequest from "./LeaveRequest";
import LeaveHistory from "./LeaveHistory";

const LeaveManagement = () => {
  const [activeTab, setActiveTab] = useState("request");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [officialEmail, setOfficialEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      // Check if user is logged in
      const isLoggedIn = localStorage.getItem("isEmployeeLoggedIn") === "true";
      if (!isLoggedIn) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        console.log(`[${timestamp}] Fetching employee data from: http://localhost:9292/api/v1/employees/me`);

        const meResponse = await axios.get("http://localhost:9292/api/v1/employees/me", {
          withCredentials: true,
        });
        console.log(`[${timestamp}] Employee response:`, JSON.stringify(meResponse.data));
        setOfficialEmail(meResponse.data.official_email);
        setEmployeeId(meResponse.data.employee_id);

        console.log(`[${timestamp}] Fetching leave requests from: http://localhost:9292/api/v1/leave-requests`);
        const leavesResponse = await axios.get("http://localhost:9292/api/v1/leave-requests", {
          withCredentials: true,
        });
        console.log(`[${timestamp}] Leave requests response:`, JSON.stringify(leavesResponse.data));
        setLeaveRequests(leavesResponse.data);
      } catch (err) {
        console.error(`[${timestamp}] Error:`, err);
        if (err.response?.status === 401 || err.response?.status === 404) {
          localStorage.removeItem("isEmployeeLoggedIn");
          localStorage.removeItem("employeeEmail");
          localStorage.removeItem("employeeId");
          navigate("/login", { replace: true });
        } else {
          setError(err.response?.data?.error || "Failed to load data.");
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

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
      };
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      console.log(`[${timestamp}] Sending leave request to: http://localhost:9292/api/v1/leave-requests`, JSON.stringify(payload));
      const res = await axios.post(
        "http://localhost:9292/api/v1/leave-requests",
        payload,
        { withCredentials: true }
      );
      console.log(`[${timestamp}] Leave request response:`, JSON.stringify(res.data));
      setLeaveRequests((prev) => [...prev, res.data]);
      return { success: true, message: "Leave request submitted successfully." };
    } catch (err) {
      console.error(`[${timestamp}] Leave request error:`, err);
      setError(err.response?.data?.error || "Submission failed.");
      return { success: false, error: err.response?.data?.error || "Submission failed." };
    }
  };

  const updateLeaveRequest = async (id, status) => {
    try {
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      console.log(`[${timestamp}] Updating leave request ${id} with status: ${status}`);
      await axios.patch(
        `http://localhost:9292/api/v1/leave-requests/${id}`,
        { status },
        { withCredentials: true }
      );
      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      console.error(`[${timestamp}] Update error:`, err);
      setError(err.response?.data?.error || "Update failed.");
    }
  };

  const deleteLeaveRequest = async (id) => {
    try {
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      console.log(`[${timestamp}] Deleting leave request ${id}`);
      await axios.delete(`http://localhost:9292/api/v1/leave-requests/${id}`, {
        withCredentials: true,
      });
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(`[${timestamp}] Delete error:`, err);
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 py-2 text-center ${activeTab === "request" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}
          onClick={() => setActiveTab("request")}
        >
          Request Leave
        </button>
        <button
          className={`flex-1 py-2 text-center ${activeTab === "history" ? "border-b-2 border-blue-600 font-semibold" : "text-gray-500"}`}
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