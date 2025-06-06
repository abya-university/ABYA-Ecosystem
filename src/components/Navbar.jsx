import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import WalletConnection from "./WalletConnection";
import ProfileConnection from "./ProfileConnection";
import { useState, useEffect } from "react";
import { useProfile } from "../contexts/ProfileContext";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Close mobile menu on navigation
  const handleLinkClick = () => {
    if (menuOpen) setMenuOpen(false);
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
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200"
          >
            Home
          </Link>
          <Link
            to="/courses"
            onClick={handleLinkClick}
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200"
          >
            Courses
          </Link>
          <Link
            to="/community"
            onClick={handleLinkClick}
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200"
          >
            Community
          </Link>
        </div>

        {/* Actions: Profile, Wallet, Theme, Mobile Menu */}
        <div className="flex items-center space-x-4">
          {profile.did !== null && <ProfileConnection />}
          <WalletConnection />

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-yellow-500"
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
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
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
              className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200"
            >
              Home
            </Link>
            <Link
              to="/courses"
              onClick={handleLinkClick}
              className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200"
            >
              Courses
            </Link>
            <Link
              to="/community"
              onClick={handleLinkClick}
              className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200"
            >
              Community
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
