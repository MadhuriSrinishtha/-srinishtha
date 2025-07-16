// ✅ Sidebar.jsx - Final version (no /logout route, session logout only)
import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserTie,
  FaHeadset,
  FaTasks,
  FaChartLine,
  FaProjectDiagram,
  FaBook,
  FaPalette,
  FaMoneyCheckAlt,
  FaPlane,
  FaSignOutAlt,
} from "react-icons/fa";
import logo from "../../src/assets/logo.jpg";

const Sidebar = ({ onLogout }) => {
  const menuItems = [
    { path: "/dashboard", name: "Dashboard", icon: <FaTachometerAlt />, clickable: true },
    { path: "/hr-zone", name: "HR Zone", icon: <FaUserTie />, clickable: true },
    { name: "IT Helpdesk", icon: <FaHeadset />, clickable: false },
    { name: "Projects & Tasks", icon: <FaTasks />, clickable: false },
    { name: "Performance Tracker", icon: <FaChartLine />, clickable: false },
    { name: "PMO / Execution", icon: <FaProjectDiagram />, clickable: false },
    { name: "Knowledge Base", icon: <FaBook />, clickable: false },
    { name: "Brand Assets", icon: <FaPalette />, clickable: false },
    { name: "Finance Tools", icon: <FaMoneyCheckAlt />, clickable: false },
    { name: "Regional & Travel", icon: <FaPlane />, clickable: false },
  ];

  return (
    <div className="w-64 h-screen bg-white shadow-lg flex flex-col fixed">
      <div className="p-6 border-b border-gray-200 flex items-center space-x-3">
        <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
        <h1 className="text-xl font-bold text-blue-700">Srinishtha Hub</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              {item.clickable ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 p-3 rounded-lg text-gray-700 ${
                      isActive ? "bg-gray-100 font-semibold" : ""
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              ) : (
                <div className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 cursor-not-allowed">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        {/* ✅ Logout button with no routing */}
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 w-full text-left hover:bg-gray-100"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;