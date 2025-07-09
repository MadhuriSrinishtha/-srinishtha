import React, { useState, useEffect } from "react";

const LeaveRequest = ({ employeeId, addLeaveRequest }) => {
  const [formData, setFormData] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    dayType: "Full Day",
    reason: "",
  });
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    calculateDuration();
  }, [formData.startDate, formData.endDate, formData.dayType]);

  const calculateDuration = () => {
    if (!formData.startDate) {
      setDuration(0);
      return;
    }

    const start = new Date(formData.startDate);
    const end = formData.endDate ? new Date(formData.endDate) : new Date(formData.startDate);

    if (isNaN(start.getTime()) || (formData.endDate && isNaN(end.getTime()))) {
      setDuration(0);
      return;
    }

    if (formData.startDate === formData.endDate || !formData.endDate) {
      if (start.getDay() === 0 || start.getDay() === 6) {
        setDuration(0);
        return;
      }
      const days = formData.dayType === "Half Day" ? 0.5 : 1;
      setDuration(days);
      return;
    }

    let days = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        days++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    days = formData.dayType === "Half Day" ? days * 0.5 : days;
    setDuration(days);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (duration === 0) {
      setError("Leave duration cannot be zero. Please select valid working days.");
      setIsSubmitting(false);
      return;
    }

    if (!employeeId) {
      setError("Please log in to submit a leave request.");
      setIsSubmitting(false);
      return;
    }

    const newRequest = {
      leave_type: formData.leaveType,
      day_type: formData.dayType,
      reason: formData.reason,
      start_date: formData.startDate,
      end_date: formData.endDate || formData.startDate,
      duration,
    };

    try {
      const result = await addLeaveRequest(newRequest);
      if (result.success) {
        setSuccess(result.message);
        setFormData({
          leaveType: "Casual Leave",
          startDate: "",
          endDate: "",
          dayType: "Full Day",
          reason: "",
        });
        setDuration(0);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to submit leave request: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Submit Leave Request</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              value={formData.leaveType}
              onChange={(e) => {
                const newLeaveType = e.target.value;
                setFormData({
                  ...formData,
                  leaveType: newLeaveType,
                  dayType: newLeaveType === "Casual Leave" ? formData.dayType : "Full Day",
                });
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Paternity Leave">Paternity Leave</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day Type</label>
            <select
              value={formData.dayType}
              onChange={(e) => setFormData({ ...formData, dayType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={formData.leaveType !== "Casual Leave"}
            >
              <option value="Full Day">Full Day</option>
              {formData.leaveType === "Casual Leave" && (
                <option value="Half Day">Half Day</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={formData.startDate}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            required
          />
        </div>
        <div className="text-center text-gray-600">
          Duration: {duration} day{duration !== 1 ? "s" : ""}
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting || duration === 0}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
              isSubmitting || duration === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequest;