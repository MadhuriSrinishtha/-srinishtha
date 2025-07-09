
import React, { useState } from "react";
import { FaBuilding, FaUsers, FaMoneyBillWave, FaCalendarAlt, FaClock } from "react-icons/fa";
import LeaveManagement from "./LeaveManagement";
import CompanyPolicies from "./CompanyPolicies";
import EmployeeDirectory from "./EmployeeDirectory";
import CompensationBenefits from "./CompensationBenefits";
import TeamCalendar from "./TeamCalendar";

const cardData = [
  {
    icon: <FaBuilding size={28} />,
    title: "Company Policies",
    description: "HR policies and guidelines",
    content: <CompanyPolicies />,
  },
  {
    icon: <FaUsers size={28} />,
    title: "Employee Directory",
    description: "Team member information",
    content: <EmployeeDirectory />,
  },
  {
    icon: <FaMoneyBillWave size={28} />,
    title: "Compensation & Benefits",
    description: "Salary and benefits info",
    content: <CompensationBenefits />,
  },
  {
    icon: <FaClock size={28} />,
    title: "Leave Management",
    description: "Leave requests and approvals",
    content: <LeaveManagement />,
  },
  {
    icon: <FaCalendarAlt size={28} />,
    title: "Holidays Calendar",
    description: "Team events and schedules",
    content: <TeamCalendar />,
  },
];

const HRZone = () => {
  const [activeCardIndex, setActiveCardIndex] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6 ml-64 mt-[224px] max-w-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
            Human Resources Zone
          </h1>
          <p className="mt-2 text-lg text-gray-600 leading-relaxed">
            Your all-in-one HR management platform for performance tracking, employee development, and organizational insights.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {cardData.map((card, index) => (
            <div
              key={index}
              onClick={() => setActiveCardIndex(index)}
              className={`cursor-pointer bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 ${
                activeCardIndex === index
                  ? "ring-4 ring-blue-500 ring-opacity-50 scale-105"
                  : ""
              }`}
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
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 transition-all duration-300">
          {activeCardIndex !== null ? (
            <div className="animate-slideIn">{cardData[activeCardIndex].content}</div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500 text-lg font-medium">
                Select a card above to view details
              </p>
            </div>
          )}
        </div>
      </div>
      <style >{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HRZone;
