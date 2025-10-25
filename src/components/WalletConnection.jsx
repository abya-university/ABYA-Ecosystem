import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Power,
  Wallet2Icon,
  UserCircle,
  ChartNetwork,
  Check,
  CopyIcon,
  CopyCheckIcon,
  Wallet,
  Aperture,
  User,
  GraduationCap,
  Settings,
} from "lucide-react";
import { useProfile } from "../contexts/ProfileContext";
import { AbyaConnectButton } from "../providers/Providers";
import {
  useActiveAccount,
  useDisconnect,
  useActiveWallet,
  useWalletBalance,
} from "thirdweb/react";
import { client } from "../services/client"; // Make sure to import your client
import { defineChain } from "thirdweb/chains";
import { toast } from "react-toastify";

const WalletConnection = () => {
  const account = useActiveAccount();
  const address = account?.address || "";
  const isConnected = !!account;
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const dropdownRef = useRef(null);
  const toggleRef = useRef(null);
  const { clearProfile, profile, hasProfile } = useProfile();

  const { data: balanceData, isLoading: balanceLoading } = useWalletBalance({
    account,
    client, // Your thirdweb client
    chain: defineChain(11155111),
  });

  // Outside click / ESC
  useEffect(() => {
    const onClick = (e) => {
      if (
        dropdownVisible &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !toggleRef.current.contains(e.target)
      )
        setDropdownVisible(false);
    };
    const onKey = (e) =>
      e.key === "Escape" && dropdownVisible && setDropdownVisible(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownVisible]);

  const copyText = (text, setCopied) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const signOut = () => {
    disconnect(wallet);
    setDropdownVisible(false);
    if (hasProfile) {
      clearProfile();
    }
  };

  const navigateTo = (path) => {
    navigate(path);
    setDropdownVisible(false);
  };

  const getInitials = (fname, lname) => {
    return `${fname?.charAt(0) || ""}${lname?.charAt(0) || ""}`.toUpperCase();
  };

  if (!isConnected) return <AbyaConnectButton />;

  return (
    <div className="relative">
      <button
        ref={toggleRef}
        onClick={() => setDropdownVisible((v) => !v)}
        className="flex items-center space-x-2 bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-200"
        aria-haspopup="menu"
        aria-expanded={dropdownVisible}
      >
        <span
          className={`h-3 w-3 rounded-full bg-green-500`}
          aria-label="Connected"
        />
        <Wallet2Icon size={20} />
        {hasProfile && (
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {getInitials(profile.fname, profile.lname)}
          </div>
        )}
      </button>

      {dropdownVisible && (
        <div
          ref={dropdownRef}
          role="menu"
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          {/* Header Section */}
          <div className="bg-yellow-500/10 p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Wallet2Icon className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  {hasProfile ? `${profile.fname}'s Account` : "Wallet Details"}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                  {address}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Section (if profile exists) */}
          {hasProfile && (
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                      Profile {profile.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 space-y-4">
            {/* Quick Profile Actions */}
            {hasProfile ? (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Profile Actions
                </h4>
                <button
                  onClick={() => navigateTo("/mainpage?section=settings")}
                  className="w-full flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  <span>View Profile</span>
                </button>
                <button
                  onClick={() => navigateTo("/certificates")}
                  className="w-full flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>My Certificates</span>
                </button>
                <button
                  onClick={() => navigateTo("/settings")}
                  className="w-full flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  No profile found.{" "}
                  <button
                    onClick={() => navigateTo("/mainpage?section=settings")}
                    className="font-semibold hover:underline"
                  >
                    Create one now
                  </button>
                </p>
              </div>
            )}

            {/* Wallet Information */}
            <div className="space-y-3 pt-2 border-t dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Wallet Info
              </h4>

              {/* Status */}
              <div className="flex justify-between">
                <span className="flex items-center space-x-2 dark:text-gray-300">
                  <ChartNetwork className="w-4 h-4" />
                  <span className="text-sm">Status</span>
                </span>
                <span className="flex items-center space-x-1 text-green-500 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Connected</span>
                </span>
              </div>

              {/* Copy Address */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => copyText(address, setIsCopied)}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
                >
                  {isCopied ? (
                    <CopyCheckIcon className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                  <span>Address</span>
                </button>
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>

              {/* Ether Balance */}
              <div className="flex justify-between dark:text-gray-300">
                <span className="flex items-center space-x-2 text-sm">
                  <Wallet className="w-4 h-4" />
                  <span>Balance</span>
                </span>
                <span className="font-semibold text-sm dark:text-yellow-500">
                  {balanceLoading
                    ? "Loading..."
                    : balanceData
                    ? `${parseFloat(balanceData.displayValue).toFixed(5)} ${
                        balanceData.symbol
                      }`
                    : "0.00000 ETH"}
                </span>
              </div>

              {/* Token Balance Placeholder */}
              <div className="flex justify-between dark:text-gray-300">
                <span className="flex items-center space-x-2 text-sm">
                  <Aperture className="w-4 h-4" />
                  <span>Token Balance</span>
                </span>
                <span className="font-semibold text-sm dark:text-purple-600">
                  --
                </span>
              </div>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-2 rounded-lg text-sm transition-colors duration-200 mt-2"
            >
              <Power className="w-4 h-4" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
