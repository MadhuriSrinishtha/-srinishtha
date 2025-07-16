import { useEffect, useState } from "react";

const LeaveHistory = ({
  leaveRequests,
  officialEmail,
  employeeId,
  updateLeaveRequest,
  deleteLeaveRequest,
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false); // data is from props
  }, [leaveRequests]);

  const history = leaveRequests
    .filter(
      (req) =>
        req.employee_email === officialEmail &&
        (req.status === "Approved" || req.status === "Rejected")
    )
    .map((req) => ({
      ...req,
      startDate: req.start_date
        ? new Date(req.start_date).toLocaleDateString("en-GB")
        : "N/A",
      endDate: req.end_date
        ? new Date(req.end_date).toLocaleDateString("en-GB")
        : "N/A",
      submittedAt: req.submitted_at
        ? new Date(req.submitted_at).toLocaleDateString("en-GB")
        : "N/A",
    }))
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
        Leave History
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-500">No leave history found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Start</th>
                <th className="px-4 py-2 text-left">End</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((req) => (
                <tr key={req.id} className="border-t hover:bg-blue-50">
                  <td className="px-4 py-2">{req.leave_type || "N/A"}</td>
                  <td className="px-4 py-2">{req.startDate}</td>
                  <td className="px-4 py-2">{req.endDate}</td>
                  <td className="px-4 py-2">
                    {req.duration
                      ? `${req.duration} day${req.duration !== 1 ? "s" : ""}`
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2">{req.reason || "N/A"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        req.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {req.status}
                    </span>
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
