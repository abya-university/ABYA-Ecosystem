import { Link } from "react-router-dom";
import { useDisconnect, useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  BookOpen,
  Moon,
  Sun,
  Power,
  Wallet,
  Check,
  Copy,
  UserCircle,
  CopyCheckIcon,
  CopyIcon,
  Aperture,
  ChartNetwork,
} from "lucide-react";
import Ecosystem2ABI from "../artifacts/contracts/Ecosystem Contracts/Ecosystem2.sol/Ecosystem2.json";
import { ethers } from "ethers";
import { useEthersSigner } from "./useClientSigner";

const contractABI = Ecosystem2ABI.abi;
const contractAddress = import.meta.env.VITE_APP_ECOSYSTEM2_CONTRACT_ADDRESS;

const Navbar = () => {
  const logo = "/abya_logo.jpg";
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { data: balanceData } = useBalance({
    address,
  });
  const [tokenBalance, setTokenBalance] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const signerPromise = useEthersSigner();

  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalance();
    } else {
      setTokenBalance("");
      setTokenSymbol("");
    }
  }, [isConnected, address]);

  const fetchTokenBalance = async () => {
    if (isConnected && address) {
      try {
        const signer = await signerPromise;
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const tokenBalanceRaw = await contract.balanceOf(address);
        const tokenDecimalsRaw = await contract.decimals();
        const tokenSymbol = await contract.symbol();

        const tokenDecimals = Number(tokenDecimalsRaw);
        const formattedTokenBalance = ethers.formatUnits(
          tokenBalanceRaw,
          tokenDecimals
        );

        setTokenBalance(parseFloat(formattedTokenBalance).toFixed(1));
        setTokenSymbol(tokenSymbol);

        console.log("Token Balance: ", formattedTokenBalance);
        console.log("Token Symbol: ", tokenSymbol);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setTokenBalance("Error");
      }
    }
  };

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

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard
        .writeText(address)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    }
  };

  const signOut = async () => {
    try {
      disconnect();
      setIsLoggedIn(false);
      // setTimeout(() => {
      //   navigate("/");
      // }, 1500);
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
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  <div className="bg-yellow-500/10 p-4 flex items-center space-x-3 border-b dark:border-gray-700">
                    <UserCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                        Wallet Details
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                        {address}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 dark:text-white">
                        <ChartNetwork className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span>Status</span>
                      </div>
                      <span
                        className={`flex items-center space-x-1 ${
                          isConnected ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        <Check
                          className={`w-4 h-4 ${
                            isConnected ? "visible" : "invisible"
                          }`}
                        />
                        <span className="font-semibold">
                          {isConnected ? "Connected" : "Disconnected"}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 dark:text-white">
                        <button
                          onClick={copyToClipboard}
                          className="text-gray-500 hover:underline"
                          disabled={!address}
                        >
                          {isCopied ? (
                            <CopyCheckIcon className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <CopyIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          )}
                        </button>
                        <span>Address</span>
                      </div>
                      <span className="font-semibold text-sm truncate max-w-[150px] dark:text-gray-300">
                        {address?.substring(0, 6)}...
                        {address?.substring(address.length - 4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 dark:text-white">
                        <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span>Balance</span>
                      </div>
                      <span className="font-semibold dark:text-yellow-500">
                        {balanceData
                          ? parseFloat(balanceData.formatted).toFixed(5)
                          : "0.0000"}{" "}
                        {balanceData?.symbol}
                      </span>
                    </div>

                    {/* //token balance */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 dark:text-white">
                        <Aperture className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span>Token Balance</span>
                      </div>
                      <span className="font-semibold dark:text-purple-600">
                        {tokenBalance} {tokenSymbol}
                      </span>
                    </div>

                    <button
                      onClick={signOut}
                      className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-2 rounded-lg transition-colors"
                    >
                      <Power className="w-5 h-5" />
                      <span className="font-semibold">Disconnect</span>
                    </button>
                  </div>
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
