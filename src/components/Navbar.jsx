import { Link } from "react-router-dom";
import { useDisconnect, useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdWallet } from "react-icons/io";
import { MdOutlineLightMode } from "react-icons/md";
import { MdDarkMode } from "react-icons/md";

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

  useEffect(() => {
    console.log("LoggedIn ", isLoggedIn);
  }, [isLoggedIn]);

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
    <div className="fixed w-full h-auto bg-gray-100 shadow-md p-4 dark:bg-gray-900 dark:text-gray-50 transition-all duration-1000">
      <div className="flex justify-around items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-20 h-10" />
        </div>

        <div
          id="weglot-language-selector"
          className="flex items-center space-x-2 absolute pt-10 hover:cursor-pointer hover:shadow-lg"
        ></div>

        {/* Navigation Links */}
        <div className="md:flex lg:flex gap-6 hidden">
          <Link
            to="/home"
            className="text-lg font-semibold text-gray-600 hover:text-gray-800 dark:text-gray-200"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-lg font-semibold text-gray-600 hover:text-gray-800 dark:text-gray-200"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="text-lg font-semibold text-gray-600 hover:text-gray-800 dark:text-gray-200"
          >
            Contact
          </Link>
        </div>

        {/* Connect Button and Sign-In */}
        <div className="flex items-center gap-4">
          {isConnected ? (
            <>
              {isLoggedIn ? (
                <button
                  onClick={signOut}
                  className="bg-red-600 text-white font-semibold rounded-lg px-4 py-2"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  // onClick={signIn}
                  className="bg-yellow-500 text-cyan-950 dark:text-white font-semibold rounded-lg px-4 py-2"
                >
                  Sign In
                </button>
              )}
            </>
          ) : (
            <ConnectButton />
          )}
          <button className="mx-10">
            {darkMode ? (
              <MdOutlineLightMode
                className="w-6 h-6 text-gray-800 dark:text-white"
                onClick={() => setDarkMode(!darkMode)}
              />
            ) : (
              <MdDarkMode
                className="w-6 h-6 text-gray-800 dark:text-white"
                onClick={() => setDarkMode(!darkMode)}
              />
            )}
          </button>
        </div>
        {isConnected ? (
          <IoMdWallet
            onClick={toggleDropdown}
            className="w-[40px] h-[40px] rounded-full p-2 hover:cursor-pointer border-2 border-green-500 lg:block hidden md:block"
          />
        ) : (
          <IoMdWallet
            onClick={toggleDropdown}
            className="w-[40px] h-[40px] rounded-full p-2 hover:cursor-pointer border-2 border-gray-400 lg:block hidden md:block"
          />
        )}
        {dropdownVisible && (
          <div className="absolute right-[120px] mt-[330px] w-[350px] bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-4">
              <p className="font-semibold text-lg mb-2">Wallet Details</p>
              <p className="mb-2">
                Status:{" "}
                <span
                  className={
                    isConnected
                      ? "text-green-500 font-semibold"
                      : "text-red-500"
                  }
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </p>
              <p className="mb-2">
                Address:{" "}
                <span className="block w-full break-words bg-gray-100 p-2 rounded-md">
                  {address}
                </span>
              </p>
              <p className="mb-2">
                Balance:{" "}
                <span className="font-semibold">
                  {balanceData?.formatted} {balanceData?.symbol}
                </span>
              </p>

              <p
                onClick={signOut}
                className="mb-2 text-red-500 hover:text-red-600 hover:underline hover:cursor-pointer"
              >
                Sign Out
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
