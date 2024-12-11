import { Link } from "react-router-dom";
import { useDisconnect, useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, BookOpen, Moon, Sun } from "lucide-react";

const Navbar = () => {
  const logo = "/abya_logo.jpg";
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { data: balanceData } = useBalance({
    address,
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const signOut = async () => {
    try {
      disconnect();
      setIsLoggedIn(false);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-100/80 dark:bg-gray-900 backdrop-blur-lg shadow-lg transition-all duration-1000">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img src={logo} alt="ABYA Logo" className="w-20 h-10" />
          {/* <span className="text-2xl font-bold text-yellow-500">ABYA</span> */}
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6">
          <Link
            to="/"
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 dark:hover:text-yellow-500 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/courses"
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 dark:hover:text-yellow-500 transition-colors"
          >
            Courses
          </Link>
          <Link
            to="/community"
            className="text-lg font-semibold text-gray-600 hover:text-yellow-500 dark:text-gray-200 dark:hover:text-yellow-500 transition-colors"
          >
            Community
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? (
              <Sun className="text-yellow-500" size={24} />
            ) : (
              <Moon className="text-gray-700" size={24} />
            )}
          </button>

          {/* Wallet Connection */}
          {isConnected ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <Globe size={20} />
                <span>My Wallet</span>
              </button>

              {dropdownVisible && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 dark:text-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-4 space-y-2">
                  <p className="font-semibold text-lg mb-2 dark:text-white">
                    Wallet Details
                  </p>
                  <p>
                    Status:{" "}
                    <span
                      className={
                        isConnected ? "text-green-500" : "text-red-500"
                      }
                    >
                      {isConnected ? (
                        <span className="font-semibold">Connected</span>
                      ) : (
                        <span className="font-semibold">Disconnected</span>
                      )}
                    </span>
                  </p>
                  <p className="break-words">
                    Address: <span className="font-semibold">{address}</span>
                  </p>
                  <p>
                    Balance:{" "}
                    <span className="font-semibold">
                      {balanceData?.formatted}
                    </span>{" "}
                    {balanceData?.symbol}
                  </p>
                  <button
                    onClick={signOut}
                    className="w-full text-red-500 hover:text-red-600 font-semibold text-left mt-2"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ConnectButton />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
