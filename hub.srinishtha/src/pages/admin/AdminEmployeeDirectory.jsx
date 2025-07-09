
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaEye, FaSearch, FaPlus, FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9292';

const initialFormState = {
  employeeId: '',
  officialEmail: '',
  personalEmail: '',
  fullName: { first: '', middle: '', last: '' },
  gender: '',
  bloodGroup: '',
  dateOfBirth: '',
  mobile: '',
  alternateContact: '',
  emergencyContactNumber: '',
  presentAddress: '',
  permanentAddress: '',
  qualification: '',
  department: '',
  designation: '',
  reportingManager: '',
  employmentType: '',
  workShift: '',
  confirmationDate: '',
  relievingDate: '',
  dateOfJoining: '',
  employeeStatus: ''
};

const AdminEmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [showPersonalInfo, setShowPersonalInfo] = useState(true);
  const [showProfessionalInfo, setShowProfessionalInfo] = useState(true);
  const formRef = useRef(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const url = `${API_BASE_URL}/api/v1/employees${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
      console.log('[FetchEmployees] Request URL:', url);
      const res = await axios.get(url, { withCredentials: true });
      const mapped = (Array.isArray(res.data) ? res.data : []).map(emp => ({
        id: emp.employee_id || '',
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
      console.error('[FetchEmployees] Error:', error.response?.data || error);
      setEmployees([]);
      setError(`Failed to fetch employees: ${error.response?.data?.error || error.message}. Ensure the backend server is running and you are logged in.`);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchEmployees, 300), []);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [searchTerm, debouncedFetch]);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
      console.log('[Form] Opened with newEmployee:', JSON.stringify(newEmployee, null, 2));
    }
  }, [showForm]);

  const validateForm = () => {
    const {
      employeeId,
      officialEmail,
      personalEmail,
      fullName: { first, last },
      dateOfBirth,
      department,
      designation,
      employmentType,
      dateOfJoining,
      employeeStatus,
      mobile,
      qualification,
      relievingDate
    } = newEmployee;

    const requiredFields = {
      'Employee ID': employeeId,
      'Official Email': officialEmail,
      'Personal Email': personalEmail,
      'First Name': first,
      'Last Name': last,
      'Date of Birth': dateOfBirth,
      'Mobile Number': mobile,
      'Qualification': qualification,
      'Department': department,
      'Designation': designation,
      'Employment Type': employmentType,
      'Date of Joining': dateOfJoining,
      'Employee Status': employeeStatus
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') return `Missing required field: ${field}`;
    }

    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (isNaN(dob) || age < 18) return 'Invalid date of birth or employee must be at least 18 years old';

    if (!officialEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Invalid official email format';
    if (!personalEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Invalid personal email format';
    if (!mobile.match(/^\+?[\d\s-]{10,}$/)) return 'Invalid mobile number format';
    if (!employeeId.match(/^[A-Za-z0-9-]+$/)) return 'Employee ID must contain only letters, numbers, or hyphens';

    if (['Resigned', 'Terminated'].includes(employeeStatus) && (!relievingDate || relievingDate.trim() === '')) {
      return 'Relieving date is required for Resigned or Terminated employees';
    }

    return '';
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      console.log('[AddEmployee] Validation failed:', validationError);
      return;
    }

    const payload = {
      employee_id: newEmployee.employeeId,
      official_email: newEmployee.officialEmail,
      personal_email: newEmployee.personalEmail,
      first_name: newEmployee.fullName.first,
      last_name: newEmployee.fullName.last,
      middle_name: newEmployee.fullName.middle || null,
      gender: newEmployee.gender || null,
      blood_group: newEmployee.bloodGroup || null,
      date_of_birth: newEmployee.dateOfBirth,
      mobile: newEmployee.mobile,
      alternate_contact: newEmployee.alternateContact || null,
      emergency_contact_number: newEmployee.emergencyContactNumber || null,
      present_address: newEmployee.presentAddress || null,
      permanent_address: newEmployee.permanentAddress || null,
      qualification: newEmployee.qualification,
      department: newEmployee.department,
      designation: newEmployee.designation,
      reporting_manager: newEmployee.reportingManager || null,
      employment_type: newEmployee.employmentType,
      work_shift: newEmployee.workShift || null,
      confirmation_date: newEmployee.confirmationDate || null,
      relieving_date: newEmployee.relievingDate || null,
      date_of_joining: newEmployee.dateOfJoining,
      employee_status: newEmployee.employeeStatus,
      password: isEditing ? undefined : 'user@123' // Only send password for new employees
    };

    console.log('[AddEmployee] Sending payload:', JSON.stringify(payload, null, 2));

    try {
      if (isEditing && editingEmployeeId) {
        console.log('[AddEmployee] Updating employee with ID:', editingEmployeeId);
        await axios.put(`${API_BASE_URL}/api/v1/employees/${editingEmployeeId}`, payload, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        });
        console.log('[AddEmployee] Employee updated successfully');
      } else {
        console.log('[AddEmployee] Creating new employee');
        await axios.post(`${API_BASE_URL}/api/v1/employees`, payload, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        });
        console.log('[AddEmployee] Employee created successfully');
      }
      await fetchEmployees();
      setNewEmployee(initialFormState);
      setShowForm(false);
      setSelectedEmployee(null);
      setIsEditing(false);
      setEditingEmployeeId(null);
      setError(null);
    } catch (error) {
      console.error('[AddEmployee] Error:', error.response?.data || error);
      setError(error.response?.data?.error || `Failed to process employee: ${error.message}. Ensure Employee ID and official email are unique and the backend server is running.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewEmployee(initialFormState);
    setShowForm(false);
    setSelectedEmployee(null);
    setIsEditing(false);
    setEditingEmployeeId(null);
    setError(null);
    console.log('[Cancel] Form reset and closed');
  };

  const handleReset = () => {
    setNewEmployee(initialFormState);
    setError(null);
    console.log('[Reset] Form reset to initial state');
  };

  const handleViewEmployee = async (employee) => {
    setIsLoading(true);
    try {
      console.log('[ViewEmployee] Fetching employee with ID:', employee.id);
      const res = await axios.get(`${API_BASE_URL}/api/v1/employees/${employee.id}`, { withCredentials: true });
      console.log('[ViewEmployee] Response:', res.data);
      const employeeData = res.data;
      if (!employeeData || employeeData.error) {
        throw new Error(employeeData?.error || 'Employee not found');
      }
      const mapped = {
        id: employeeData.employee_id || '',
        employeeId: employeeData.employee_id || '',
        officialEmail: employeeData.official_email || '',
        personalEmail: employeeData.personal_email || '',
        fullName: {
          first: employeeData.first_name || '',
          middle: employeeData.middle_name || '',
          last: employeeData.last_name || ''
        },
        gender: employeeData.gender || '',
        bloodGroup: employeeData.blood_group || '',
        dateOfBirth: employeeData.date_of_birth || '',
        mobile: employeeData.mobile || '',
        alternateContact: employeeData.alternate_contact || '',
        emergencyContactNumber: employeeData.emergency_contact_number || '',
        presentAddress: employeeData.present_address || '',
        permanentAddress: employeeData.permanent_address || '',
        qualification: employeeData.qualification || '',
        department: employeeData.department || '',
        designation: employeeData.designation || '',
        reportingManager: employeeData.reporting_manager || '',
        employmentType: employeeData.employment_type || '',
        workShift: employeeData.work_shift || '',
        confirmationDate: employeeData.confirmation_date || '',
        relievingDate: employeeData.relieving_date || '',
        dateOfJoining: employeeData.date_of_joining || '',
        employeeStatus: employeeData.employee_status || ''
      };
      setSelectedEmployee(mapped);
      setError(null);
      console.log('[ViewEmployee] Success: Set selectedEmployee:', JSON.stringify(mapped, null, 2));
    } catch (error) {
      console.error('[ViewEmployee] Error:', error.response?.data || error);
      setError(error.response?.data?.error || `Failed to fetch employee details: ${error.message}. Ensure you are logged in.`);
      setSelectedEmployee(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmployee = (e, employee) => {
    e.stopPropagation();
    console.log('[UpdateEmployee] Populating form with employee:', JSON.stringify(employee, null, 2));
    const updatedEmployee = {
      employeeId: employee.employeeId || '',
      officialEmail: employee.officialEmail || '',
      personalEmail: employee.personalEmail || '',
      fullName: {
        first: employee.fullName.first || '',
        middle: employee.fullName.middle || '',
        last: employee.fullName.last || ''
      },
      gender: employee.gender || '',
      bloodGroup: employee.bloodGroup || '',
      dateOfBirth: employee.dateOfBirth || '',
      mobile: employee.mobile || '',
      alternateContact: employee.alternateContact || '',
      emergencyContactNumber: employee.emergencyContactNumber || '',
      presentAddress: employee.presentAddress || '',
      permanentAddress: employee.permanentAddress || '',
      qualification: employee.qualification || '',
      department: employee.department || '',
      designation: employee.designation || '',
      reportingManager: employee.reportingManager || '',
      employmentType: employee.employmentType || '',
      workShift: employee.workShift || '',
      confirmationDate: employee.confirmationDate || '',
      relievingDate: employee.relievingDate || '',
      dateOfJoining: employee.dateOfJoining || '',
      employeeStatus: employee.employeeStatus || ''
    };
    setNewEmployee(updatedEmployee);
    setIsEditing(true);
    setEditingEmployeeId(employee.id);
    setShowForm(true);
    setSelectedEmployee(null);
    setError(null);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
    console.log('[UpdateEmployee] Form populated, isEditing:', true, 'editingEmployeeId:', employee.id, 'newEmployee:', JSON.stringify(updatedEmployee, null, 2));
  };

  const handleAddNew = () => {
    setNewEmployee(initialFormState);
    setShowForm(true);
    setIsEditing(false);
    setEditingEmployeeId(null);
    setError(null);
    console.log('[AddNew] Form opened for new employee');
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 space-x-4">
          <h2 className="text-3xl font-bold text-gray-800">Manage Employee Directory</h2>
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                className="w-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
            </div>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <FaPlus /> <span>Add New</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        {isLoading && (
          <div className="text-center text-gray-500">Loading employees...</div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-6">{isEditing ? 'Update Employee' : 'Add New Employee'}</h3>
              <form id="employeeForm" onSubmit={handleAddEmployee} className="space-y-8">
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPersonalInfo(!showPersonalInfo)}
                    className="flex items-center text-lg font-medium text-gray-700 mb-4 focus:outline-none"
                  >
                    Personal Information {showPersonalInfo ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
                  </button>
                  {showPersonalInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Employee ID *</label>
                        <input
                          type="text"
                          value={newEmployee.employeeId}
                          onChange={e => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                          placeholder="e.g., EMP-1234"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Official Email *</label>
                        <input
                          type="email"
                          value={newEmployee.officialEmail}
                          onChange={e => setNewEmployee({ ...newEmployee, officialEmail: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Personal Email *</label>
                        <input
                          type="email"
                          value={newEmployee.personalEmail}
                          onChange={e => setNewEmployee({ ...newEmployee, personalEmail: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">First Name *</label>
                        <input
                          type="text"
                          value={newEmployee.fullName.first}
                          onChange={e => setNewEmployee({ ...newEmployee, fullName: { ...newEmployee.fullName, first: e.target.value } })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={newEmployee.fullName.last}
                          onChange={e => setNewEmployee({ ...newEmployee, fullName: { ...newEmployee.fullName, last: e.target.value } })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Middle Name</label>
                        <input
                          type="text"
                          value={newEmployee.fullName.middle}
                          onChange={e => setNewEmployee({ ...newEmployee, fullName: { ...newEmployee.fullName, middle: e.target.value } })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                        <select
                          value={newEmployee.gender}
                          onChange={e => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Blood Group</label>
                        <input
                          type="text"
                          value={newEmployee.bloodGroup}
                          onChange={e => setNewEmployee({ ...newEmployee, bloodGroup: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          value={newEmployee.dateOfBirth}
                          onChange={e => setNewEmployee({ ...newEmployee, dateOfBirth: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Mobile *</label>
                        <input
                          type="tel"
                          value={newEmployee.mobile}
                          onChange={e => setNewEmployee({ ...newEmployee, mobile: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Alternate Contact</label>
                        <input
                          type="tel"
                          value={newEmployee.alternateContact}
                          onChange={e => setNewEmployee({ ...newEmployee, alternateContact: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Emergency Contact Number</label>
                        <input
                          type="tel"
                          value={newEmployee.emergencyContactNumber}
                          onChange={e => setNewEmployee({ ...newEmployee, emergencyContactNumber: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Address for Communication</label>
                        <textarea
                          value={newEmployee.presentAddress}
                          onChange={e => setNewEmployee({ ...newEmployee, presentAddress: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Permanent Address</label>
                        <textarea
                          value={newEmployee.permanentAddress}
                          onChange={e => setNewEmployee({ ...newEmployee, permanentAddress: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => setShowProfessionalInfo(!showProfessionalInfo)}
                    className="flex items-center text-lg font-medium text-gray-700 mb-4 focus:outline-none"
                  >
                    Professional Information {showProfessionalInfo ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
                  </button>
                  {showProfessionalInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Qualification *</label>
                        <input
                          type="text"
                          value={newEmployee.qualification}
                          onChange={e => setNewEmployee({ ...newEmployee, qualification: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Department *</label>
                        <input
                          type="text"
                          value={newEmployee.department}
                          onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Designation *</label>
                        <input
                          type="text"
                          value={newEmployee.designation}
                          onChange={e => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Reporting Manager</label>
                        <input
                          type="text"
                          value={newEmployee.reportingManager}
                          onChange={e => setNewEmployee({ ...newEmployee, reportingManager: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Employment Type *</label>
                        <select
                          value={newEmployee.employmentType}
                          onChange={e => setNewEmployee({ ...newEmployee, employmentType: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="Full-Time">Full-Time</option>
                          <option value="Part-Time">Part-Time</option>
                          <option value="Contract">Contract</option>
                          <option value="Intern">Intern</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Work Shift</label>
                        <input
                          type="text"
                          value={newEmployee.workShift}
                          onChange={e => setNewEmployee({ ...newEmployee, workShift: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Confirmation Date</label>
                        <input
                          type="date"
                          value={newEmployee.confirmationDate}
                          onChange={e => setNewEmployee({ ...newEmployee, confirmationDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Relieving Date</label>
                        <input
                          type="date"
                          value={newEmployee.relievingDate}
                          onChange={e => setNewEmployee({ ...newEmployee, relievingDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Date of Joining *</label>
                        <input
                          type="date"
                          value={newEmployee.dateOfJoining}
                          onChange={e => setNewEmployee({ ...newEmployee, dateOfJoining: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Employee Status *</label>
                        <select
                          value={newEmployee.employeeStatus}
                          onChange={e => setNewEmployee({ ...newEmployee, employeeStatus: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Status</option>
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Resigned">Resigned</option>
                          <option value="Terminated">Terminated</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-4 mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Saving...' : isEditing ? 'Update Employee' : 'Save Employee'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {employees.length === 0 && !isLoading ? (
            <p className="text-gray-500 text-center text-lg">No employees added yet.</p>
          ) : (
            employees.map((employee) => (
              <div
                key={employee.id}
                className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {`${employee.fullName.first} ${employee.fullName.last}`}
                  </h3>
                  <p className="text-gray-600 mt-1">Email: {employee.personalEmail}</p>
                  <p className="text-gray-600">Status: {employee.employeeStatus}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      console.log('[ViewEmployee] Clicked for employee:', employee);
                      handleViewEmployee(employee);
                    }}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                    disabled={isLoading}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Employee Details</h3>
              <div className="space-y-4">
                <p><strong>Employee ID:</strong> {selectedEmployee.employeeId || 'N/A'}</p>
                <p><strong>Full Name:</strong> {`${selectedEmployee.fullName.first || ''} ${selectedEmployee.fullName.middle || ''} ${selectedEmployee.fullName.last || ''}`.trim() || 'N/A'}</p>
                <p><strong>Official Email:</strong> {selectedEmployee.officialEmail || 'N/A'}</p>
                <p><strong>Personal Email:</strong> {selectedEmployee.personalEmail || 'N/A'}</p>
                <p><strong>Gender:</strong> {selectedEmployee.gender || 'N/A'}</p>
                <p><strong>Blood Group:</strong> {selectedEmployee.bloodGroup || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> {selectedEmployee.dateOfBirth || 'N/A'}</p>
                <p><strong>Mobile:</strong> {selectedEmployee.mobile || 'N/A'}</p>
                <p><strong>Alternate Contact:</strong> {selectedEmployee.alternateContact || 'N/A'}</p>
                <p><strong>Emergency Contact Number:</strong> {selectedEmployee.emergencyContactNumber || 'N/A'}</p>
                <p><strong>Address for Communication:</strong> {selectedEmployee.presentAddress || 'N/A'}</p>
                <p><strong>Permanent Address:</strong> {selectedEmployee.permanentAddress || 'N/A'}</p>
                <p><strong>Qualification:</strong> {selectedEmployee.qualification || 'N/A'}</p>
                <p><strong>Department:</strong> {selectedEmployee.department || 'N/A'}</p>
                <p><strong>Designation:</strong> {selectedEmployee.designation || 'N/A'}</p>
                <p><strong>Reporting Manager:</strong> {selectedEmployee.reportingManager || 'N/A'}</p>
                <p><strong>Employment Type:</strong> {selectedEmployee.employmentType || 'N/A'}</p>
                <p><strong>Work Shift:</strong> {selectedEmployee.workShift || 'N/A'}</p>
                <p><strong>Confirmation Date:</strong> {selectedEmployee.confirmationDate || 'N/A'}</p>
                <p><strong>Relieving Date:</strong> {selectedEmployee.relievingDate || 'N/A'}</p>
                <p><strong>Date of Joining:</strong> {selectedEmployee.dateOfJoining || 'N/A'}</p>
                <p><strong>Employee Status:</strong> {selectedEmployee.employeeStatus || 'N/A'}</p>
              </div>
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={(e) => handleUpdateEmployee(e, selectedEmployee)}
                  disabled={isLoading}
                  className={`bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmployeeDirectory;