import { useEffect, useState } from "react";

const LeaveHistory = ({ leaveRequests, officialEmail, employeeId, updateLeaveRequest, deleteLeaveRequest }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false); // Data is passed via props
  }, [leaveRequests]);

  const history = leaveRequests
    .filter((req) => req.employee_id === employeeId)
    .map((req) => ({
      ...req,
      startDate: req.start_date ? new Date(req.start_date).toLocaleDateString("en-GB") : "N/A",
      endDate: req.end_date ? new Date(req.end_date).toLocaleDateString("en-GB") : "N/A",
      submittedAt: req.submitted_at ? new Date(req.submitted_at).toLocaleDateString("en-GB") : "N/A",
    }))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateLeaveRequest(id, newStatus);
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave request?")) {
      try {
        await deleteLeaveRequest(id);
      } catch (err) {
        setError("Failed to delete request.");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Leave History</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-500">No leave history found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Start</th>
                <th className="px-4 py-2 text-left">End</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((req) => (
                <tr key={req.id} className="border-t">
                  <td className="px-4 py-2">{req.leave_type || "N/A"}</td>
                  <td className="px-4 py-2">{req.startDate}</td>
                  <td className="px-4 py-2">{req.endDate}</td>
                  <td className="px-4 py-2">
                    {req.duration ? `${req.duration} day${req.duration !== 1 ? "s" : ""}` : "N/A"}
                  </td>
                  <td className="px-4 py-2">{req.reason || "N/A"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        req.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : req.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {req.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex space-x-2">
                    {req.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(req.id, "Approved")}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(req.id, "Rejected")}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="text-gray-600 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;