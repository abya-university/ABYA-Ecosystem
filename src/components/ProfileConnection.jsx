import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import { useProfile } from "../contexts/ProfileContext";
import {
  UserCircle,
  CopyIcon,
  CopyCheckIcon,
  Power,
  ChartNetwork,
  Check,
} from "lucide-react";
import ConnectProfile from "../pages/ConnectProfile";

export default function ProfileConnection() {
  const { profile, setProfile, clearProfile } = useProfile();
  const navigate = useNavigate();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isDidCopied, setIsDidCopied] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);

  const dropdownRef = useRef(null);
  const toggleRef = useRef(null);

  // Close dropdown on outside click or ESC
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
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  };

  const signOut = () => {
    clearProfile();
    setDropdownVisible(false);
    navigate("/");
  };

  // Called by <ConnectProfile> once it has DID + profile data
  const handleProfileConnected = (didDocument, profileData) => {
    setProfile({
      ...profileData,
      did: didDocument,
    });
    setShowConnectModal(false);
  };

  // If not connected yet, show single button
  if (!profile?.did) {
    return (
      <>
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <UserCircle size={20} />
          <span>Connect Profile</span>
        </button>

        {showConnectModal && (
          <Modal onClose={() => setShowConnectModal(false)}>
            <ConnectProfile
              onClose={() => setShowConnectModal(false)}
              onProfileConnected={handleProfileConnected}
            />
          </Modal>
        )}
      </>
    );
  }

  const { did, firstName, secondName, email } = profile;

  return (
    <div className="relative">
      <button
        ref={toggleRef}
        onClick={() => setDropdownVisible((v) => !v)}
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
          role="menu"
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          <div className="bg-blue-500/10 p-4 flex items-center space-x-3 border-b dark:border-gray-700">
            <UserCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                {firstName} {secondName}
              </h3>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Status */}
            <div className="flex justify-between">
              <span className="flex items-center space-x-2">
                <ChartNetwork />
                <span>Status</span>
              </span>
              <span className="flex items-center space-x-1 text-green-500">
                <Check />
                <span>Connected</span>
              </span>
            </div>

            {/* DID */}
            <div className="flex justify-between">
              <button
                onClick={() => copyText(did, setIsDidCopied)}
                className="flex items-center space-x-1 hover:underline"
              >
                {isDidCopied ? <CopyCheckIcon /> : <CopyIcon />} <span>DID</span>
              </button>
              <span className="font-semibold text-sm truncate max-w-[150px]">
                {did.replace(/^(.{6}).*(.{4})$/, "$1…$2")}
              </span>
            </div>

            {/* Email */}
            <div className="flex justify-between">
              <button
                onClick={() => copyText(email, setIsEmailCopied)}
                className="flex items-center space-x-1 hover:underline"
              >
                {isEmailCopied ? <CopyCheckIcon /> : <CopyIcon />}{" "}
                <span>Email</span>
              </button>
              <span className="font-semibold text-sm truncate max-w-[150px]">
                {email}
              </span>
            </div>

            {/* Disconnect */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 p-2 rounded-lg"
            >
              <Power />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
