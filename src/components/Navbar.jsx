import { Link } from "react-router-dom";
import {
  Moon,
  Sun,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  GraduationCap,
} from "lucide-react";
import WalletConnection from "./WalletConnection";
import { useState, useEffect, useRef } from "react";
import { useProfile } from "../contexts/ProfileContext";
import { useDarkMode } from "../contexts/themeContext";
import ErrorBoundary from "./ErrorBoundary";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { profile, hasProfile, clearProfile } = useProfile();
  const { darkMode, setDarkMode } = useDarkMode();
  const dropdownRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on navigation
  const handleLinkClick = () => {
    if (menuOpen) setMenuOpen(false);
  };

  const handleProfileClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = () => {
    clearProfile();
    setProfileDropdownOpen(false);
    // You might want to add wallet disconnect logic here too
  };

  const getInitials = (fname, lname) => {
    return `${fname?.charAt(0) || ""}${lname?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-100/80 dark:bg-gray-900 backdrop-blur-lg dark:shadow-sm dark:shadow-white transition-all duration-1000">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img src="/abya_logo.jpg" alt="ABYA Logo" className="w-30 h-10" />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6">
          <Link
            to="/"
            onClick={handleLinkClick}
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            to="/courses"
            onClick={handleLinkClick}
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 transition-colors duration-200"
          >
            Courses
          </Link>
          <Link
            to="/community"
            onClick={handleLinkClick}
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 transition-colors duration-200"
          >
            Community
          </Link>
        </div>

        {/* Actions: Profile, Wallet, Theme, Mobile Menu */}
        <div className="flex items-center space-x-4">
          {/* Profile Dropdown */}
          {hasProfile && profile && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(profile.fname, profile.lname)}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                  {profile.fname}
                </span>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-fadeIn">
                  {/* Profile Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getInitials(profile.fname, profile.lname)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {profile.fname} {profile.lname}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {profile.email}
                        </p>
                        <div className="flex items-center mt-1">
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              profile.active ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {profile.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Items */}
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <User className="w-4 h-4 mr-3" />
                    View Profile
                  </Link>

                  <Link
                    to="/certificates"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <GraduationCap className="w-4 h-4 mr-3" />
                    My Certificates
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Link>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          <ErrorBoundary>
            <WalletConnection />
          </ErrorBoundary>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-yellow-500 transition-colors duration-200"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          {/* Hamburger Button for Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Links */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-gray-100 dark:bg-gray-900 shadow-lg">
          <div className="flex flex-col items-center py-4 space-y-4">
            <Link
              to="/"
              onClick={handleLinkClick}
              className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/courses"
              onClick={handleLinkClick}
              className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 transition-colors duration-200"
            >
              Courses
            </Link>
            <Link
              to="/community"
              onClick={handleLinkClick}
              className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 transition-colors duration-200"
            >
              Community
            </Link>
            {hasProfile && (
              <>
                <Link
                  to="/profile"
                  onClick={handleLinkClick}
                  className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 transition-colors duration-200"
                >
                  My Profile
                </Link>
                <Link
                  to="/certificates"
                  onClick={handleLinkClick}
                  className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 transition-colors duration-200"
                >
                  Certificates
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}
