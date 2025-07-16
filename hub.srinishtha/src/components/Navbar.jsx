// ✅ Navbar.jsx — Fully preserves your UI, adds backend session-based employee name
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '@/config';

const Navbar = () => {
  const [employeeName, setEmployeeName] = useState('');
  const navigate = useNavigate();

  // ✅ Fetch from backend session instead of localStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/employees/me`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.official_email) {
          const name = data.official_email.split('@')[0].replace('.', ' ');
          setEmployeeName(name.charAt(0).toUpperCase() + name.slice(1));
        } else {
          setEmployeeName('Guest');
        }
      } catch {
        setEmployeeName('Guest');
      }
    };
    fetchUser();
  }, []);

  const firstName = employeeName ? employeeName.split(' ')[0] : 'Guest';

  return (
    <nav className="bg-white p-4 shadow-md fixed top-0 left-64 right-0 z-20">
      <div className="relative w-full h-56 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 overflow-hidden rounded-lg flex items-center justify-center text-center">
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
          <svg
            className="relative block w-[calc(100%+1.3px)] h-[100px]"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
          >
            <path
              d="M0,0V46.29c47.75,22,103.9,29,158.36,17.39C254,46,320,2,400,0s153.44,34.21,231.94,49.08C744,78,813,57,875,38.67c60.86-18,112.17-26,169-1.22V0Z"
              fill="#1e40af"
            ></path>
          </svg>
        </div>
        <div className="z-10 text-white">
          <h1 className="text-3xl font-bold">Welcome, {firstName}</h1>
          <p className="mt-2 text-lg font-light">Have a great time</p>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;