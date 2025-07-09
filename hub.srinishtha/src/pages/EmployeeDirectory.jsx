import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch } from 'react-icons/fa';
import axios from 'axios';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9292';

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const url = `${API_BASE_URL}/api/v1/employees${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
      console.log('[FetchEmployees] Request URL:', url);
      const res = await axios.get(url);
      const mapped = (Array.isArray(res.data) ? res.data : []).map(emp => ({
        id: emp.id || '',
        employeeId: emp.employee_id || '',
        officialEmail: emp.official_email || '',
        personalEmail: emp.personal_email || '',
        fullName: {
          first: emp.first_name || '',
          middle: emp.middle_name || '',
          last: emp.last_name || ''
        },
        gender: emp.gender || '',
        bloodGroup: emp.blood_group || '',
        dateOfBirth: emp.date_of_birth || '',
        mobile: emp.mobile || '',
        alternateContact: emp.alternate_contact || '',
        emergencyContactNumber: emp.emergency_contact_number || '',
        presentAddress: emp.present_address || '',
        permanentAddress: emp.permanent_address || '',
        qualification: emp.qualification || '',
        department: emp.department || '',
        designation: emp.designation || '',
        reportingManager: emp.reporting_manager || '',
        employmentType: emp.employment_type || '',
        workShift: emp.work_shift || '',
        confirmationDate: emp.confirmation_date || '',
        relievingDate: emp.relieving_date || '',
        dateOfJoining: emp.date_of_joining || '',
        employeeStatus: emp.employee_status || ''
      }));
      setEmployees(mapped);
      setError(null);
      console.log('[FetchEmployees] Success: Fetched', mapped.length, 'employees');
    } catch (error) {
      console.error('[FetchEmployees] Error:', error.message, error.response?.data || error);
      setEmployees([]);
      setError(`Failed to fetch employees: ${error.response?.data?.error || error.message}. Ensure the backend server is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchEmployees, 300), [searchTerm]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [searchTerm, debouncedFetch]);

  const filteredEmployees = employees.filter(employee =>
    `${employee.fullName.first} ${employee.fullName.middle} ${employee.fullName.last}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.officialEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.personalEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Employee Directory</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute right-3 top-2.5 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
          )}

          {isLoading && (
            <div className="text-center text-gray-500">Loading employees...</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.length === 0 && !isLoading ? (
              <p className="text-gray-500 text-center col-span-full">No employees found.</p>
            ) : (
              filteredEmployees.map((employee) => (
                <div key={employee.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {`${employee.fullName.first} ${employee.fullName.middle} ${employee.fullName.last}`.trim()}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {employee.employeeId}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Official Email:</span> {employee.officialEmail || 'N/A'}</p>
                    <p><span className="font-medium">Personal Email:</span> {employee.personalEmail || 'N/A'}</p>
                    <p><span className="font-medium">Department:</span> {employee.department || 'N/A'}</p>
                    <p><span className="font-medium">Designation:</span> {employee.designation || 'N/A'}</p>
                    <p><span className="font-medium">Mobile:</span> {employee.mobile || 'N/A'}</p>
                    <p><span className="font-medium">Employee Status:</span> {employee.employeeStatus || 'N/A'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDirectory;