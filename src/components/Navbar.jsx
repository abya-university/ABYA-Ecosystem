// Updated Navbar to use WalletConnection
// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import WalletConnection from "./WalletConnection";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-100/80 dark:bg-gray-900 backdrop-blur-lg shadow-lg transition duration-1000">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
          <img src="/abya_logo.jpg" alt="ABYA Logo" className="w-30 h-10" />
        </div>

        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200">Home</Link>
          <Link to="/courses" className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200">Courses</Link>
          <Link to="/community" className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200">Community</Link>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          <WalletConnection />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
