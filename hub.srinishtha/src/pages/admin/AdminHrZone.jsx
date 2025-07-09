import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaBuilding, FaUsers, FaMoneyBillWave, FaClock, FaCalendarAlt, FaUser } from 'react-icons/fa';
import AdminCompanyPolicies from './AdminCompanyPolicies';
import AdminEmployeeDirectory from './AdminEmployeeDirectory';
import AdminCompensationBenefits from './AdminCompensationBenfits';
import AdminLeavePanel from './AdminLeavePanel';
import AdminTeamCalendar from './AdminTeamCalendar';
import AdminDashboard from './AdminDashboard';

const AdminHrZone = () => {
  const navigate = useNavigate();

  const cardData = [
    {
      icon: <FaTachometerAlt size={28} />,
      title: 'Dashboard',
      description: 'View admin overview',
      path: '/admin/hr-zone/dashboard',
    },
    {
      icon: <FaBuilding size={28} />,
      title: 'Company Policies',
      description: 'Manage HR policies and guidelines',
      path: '/admin/hr-zone/company-policies',
    },
    {
      icon: <FaUsers size={28} />,
      title: 'Employee Directory',
      description: 'Add and manage team member information',
      path: '/admin/hr-zone/employee-directory',
    },
    {
      icon: <FaMoneyBillWave size={28} />,
      title: 'Compensation & Benefits',
      description: 'Administer salary and benefits',
      path: '/admin/hr-zone/compensation-benefits',
    },
    {
      icon: <FaClock size={28} />,
      title: 'Leave Management',
      description: 'Review and manage leave requests',
      path: '/admin/hr-zone/leave-panel',
    },
    {
      icon: <FaCalendarAlt size={28} />,
      title: 'Holidays Calendar',
      description: 'Manage team events and schedules',
      path: '/admin/hr-zone/team-calendar',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navbar */}
      <div className="w-full bg-gradient-to-r from-teal-400 to-purple-500 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <FaUser className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Welcome, Admin</h1>
            <p className="text-xs text-white">System Administrator</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('isAdminLoggedIn');
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('loginTime');
            window.location.href = '/admin/login';
          }}
          className="text-white px-4 py-1 bg-red-600 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 p-6">
        {cardData.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            className="cursor-pointer bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600 transition-transform hover:scale-110">
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
              <p className="text-sm text-gray-500">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6">
        <Routes>
          <Route path="Dashboard" element={<AdminDashboard/>} />
          <Route path="company-policies" element={<AdminCompanyPolicies />} />
          <Route path="employee-directory" element={<AdminEmployeeDirectory />} />
          <Route path="compensation-benefits" element={<AdminCompensationBenefits />} />
          <Route path="leave-panel" element={<AdminLeavePanel />} />
          <Route path="team-calendar" element={<AdminTeamCalendar />} />
          <Route path="*" element={<div className="text-center">Select a section above</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminHrZone;