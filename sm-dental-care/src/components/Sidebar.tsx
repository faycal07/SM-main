// Sidebar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear stored token
    navigate('/'); // Navigate to the home/login page
  };

  return (
    <div className="bg-[#6a994e] p-6 text-white h-screen flex flex-col">
      <h2 className="text-2xl font-extrabold text-center mb-4">Dashboard</h2>

      {/* Main Menu */}
      <ul className="space-y-4 flex-shrink-0">
        <li>
          <Link
            to="/dashboard"
            className="block py-2 px-4 rounded-lg hover:bg-[#4c7b37] transition-all duration-200"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/patients"
            className="block py-2 px-4 rounded-lg hover:bg-[#4c7b37] transition-all duration-200"
          >
            Patients
          </Link>
        </li>
        <li>
          <Link
            to="/profil"
            className="block py-2 px-4 rounded-lg hover:bg-[#4c7b37] transition-all duration-200"
          >
            Profile
          </Link>
        </li>
      </ul>

      {/* Spacer to push the logout button to the bottom */}
      <div className="flex-grow" />

      {/* Logout Button at the bottom */}
      <div>
        <button
          onClick={handleLogout}
          className="py-3 px-6 my-6 bg-[#37601e] text-white font-semibold rounded-lg hover:bg-[#4c7b37] transition-all duration-200 w-full"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
