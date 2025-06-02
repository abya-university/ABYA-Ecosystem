import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../contexts/ProfileContext";
import {
  UserCircle,
  CopyIcon,
  CopyCheckIcon,
  Power,
  X,
  Menu,
} from "lucide-react";

export default function ProfileConnection() {
  const { profile, clearProfile } = useProfile();
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDidCopied, setIsDidCopied] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const dropdownRef = useRef(null);
  const toggleRef = useRef(null);

  // Close on outside click or ESC
  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownVisible &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !toggleRef.current.contains(e.target)
      ) {
        setDropdownVisible(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape" && dropdownVisible) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [dropdownVisible]);

  const copyText = (text, setter) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setter(true);
        setTimeout(() => setter(false), 2000);
      });
  };

  const signOut = () => {
    clearProfile();
    setDropdownVisible(false);
    navigate("/");
  };

  // If no profile, show placeholder
  if (!profile || !profile.did) {
    return (
      <button
        onClick={() => navigate("/profile")}
        className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        <UserCircle size={20} />
        <span>Connect Profile</span>
      </button>
    );
  }

  const { did, firstName, secondName, email } = profile;

  return (
    <div className="relative">
      <button
        ref={toggleRef}
        onClick={() => setDropdownVisible(v => !v)}
        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        aria-haspopup="menu"
        aria-expanded={dropdownVisible}
      >
        <UserCircle size={20} />
        <span>{firstName}</span>
      </button>

      {dropdownVisible && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <UserCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Profile Details</h3>
            <button onClick={() => setDropdownVisible(false)}>
              <X size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">DID</span>
              <button onClick={() => copyText(did, setIsDidCopied)} className="flex items-center space-x-1 hover:underline">
                {isDidCopied ? <CopyCheckIcon /> : <CopyIcon />} <span>Copy</span>
              </button>
            </div>
            <p className="break-all font-mono text-sm text-gray-700 dark:text-gray-300">{did}</p>

            <div>
              <h4 className="font-semibold text-sm">Name</h4>
              <p className="text-gray-700 dark:text-gray-300">{firstName} {secondName}</p>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Email</span>
              <button onClick={() => copyText(email, setIsEmailCopied)} className="flex items-center space-x-1 hover:underline">
                {isEmailCopied ? <CopyCheckIcon /> : <CopyIcon />} <span>Copy</span>
              </button>
            </div>
            <p className="break-all text-gray-700 dark:text-gray-300 text-sm">{email}</p>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-2 rounded-lg"
            >
              <Power /> <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
