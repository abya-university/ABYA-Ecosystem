import React, { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Wallet,
  QrCode,
  Link2,
  CopyIcon,
  CopyCheckIcon,
  UserCircle,
} from "lucide-react";
import { useAccount } from "wagmi";
import Modal from "../components/ui/Modal";
import ProfileForm from "./ProfileForm";
import UpdateProfileForm from "./UpdateProfileForm";
import ConnectProfile from "./ConnectProfile";
import ProfileDash from "./ProfileDash";

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const { address } = useAccount();
  const [isCopied, setIsCopied] = useState(false);
  const [profileManagement, setProfileManagement] = useState({
    didDocument: null,  // This will hold the DID when connected.
    profile: null,      // This will hold the profile JSON once connected.
    verifiableCredentials: [],
    linkedAccounts: [],
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const formatAddress = (addr) => {
    if (!addr) return "Not Connected";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

  const toggleNotification = (type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const settingsSections = [
    {
      icon: <UserCircle className="w-5 h-5" />,
      label: "Profile",
      key: "profile",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      key: "notifications",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Security",
      key: "security",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      label: "Wallet",
      key: "wallet",
    },
  ];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Callback to update profile information after ConnectProfile succeeds
  const handleProfileConnected = (did, profile) => {
    setProfileManagement((prev) => ({
      ...prev,
      didDocument: did,
      profile: profile,
    }));
    setShowConnectModal(false);
  };

  return (
    <div
      className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900
      min-h-screen p-6 transition-colors duration-300 pt-[100px]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8 space-x-4">
          <Settings className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold dark:text-yellow-400 text-yellow-500">
            Account Settings
          </h1>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div
            className="col-span-1 p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
          >
            {settingsSections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg mb-2 transition-all ${
                  activeSection === section.key
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "text-gray-400 dark:hover:bg-gray-700 hover:bg-yellow-500/20 dark:hover:text-white hover:text-gray-500"
                }`}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div
            className="col-span-3 p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
          >
            {activeSection === "profile" && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-yellow-500">
                  Profile Management
                </h2>

                {/* Render ProfileDash if a profile is connected */}
                {profileManagement.didDocument && profileManagement.profile ? (
                  <ProfileDash
                    did={profileManagement.didDocument}
                    profile={profileManagement.profile}
                  />
                ) : (
                  <>
                    <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 border dark:border-none rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Create Profile</h3>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="text-yellow-500 hover:underline"
                        >
                          New Profile
                        </button>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Update Profile</h3>
                        <button
                          onClick={() => setShowUpdateProfileModal(true)}
                          className="text-yellow-500 hover:underline"
                        >
                          Update
                        </button>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Connect Profile</h3>
                        <button
                          onClick={() => setShowConnectModal(true)}
                          className="text-yellow-500 hover:underline"
                        >
                          Connect
                        </button>
                      </div>

                      <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Link2 className="w-5 h-5 text-yellow-500" />
                            <span>No linked accounts</span>
                          </div>
                          <QrCode className="w-6 h-6 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-yellow-500">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {Object.entries(notifications).map(([type, enabled]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center dark:bg-gray-900 bg-white dark:text-white text-gray-500 border dark:border-none p-4 rounded-lg"
                    >
                      <span className="capitalize">{type} Notifications</span>
                      <button
                        onClick={() => toggleNotification(type)}
                        className={`w-14 h-7 rounded-full transition-all ${
                          enabled ? "bg-yellow-500" : "bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                            enabled ? "translate-x-[26px]" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-yellow-500">
                  Security Settings
                </h2>
                <div className="space-y-4">
                  <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 p-4 rounded-lg flex border dark:border-none justify-between items-center">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-gray-400 text-sm">
                        Add an extra layer of security
                      </p>
                    </div>
                    <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "wallet" && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-yellow-500">
                  Wallet Settings
                </h2>
                <div className="space-y-4">
                  <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 p-4 border dark:border-none rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span>Connected Wallets</span>
                      <button className="text-yellow-500 hover:underline">
                        Add Wallet
                      </button>
                    </div>
                    <div className="border-t border-gray-800 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Wallet className="w-6 h-6 text-yellow-500" />
                          <span>Metamask</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400">
                            {formatAddress(address)}
                          </span>
                          <button
                            onClick={copyToClipboard}
                            className="ml-2 text-gray-500 hover:underline"
                            disabled={!address}
                          >
                            {isCopied ? (
                              <CopyCheckIcon className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <CopyIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for New Profile */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <ProfileForm onClose={() => setShowCreateModal(false)} />
        </Modal>
      )}

      {/* Modal for Update Profile */}
      {showUpdateProfileModal && (
        <Modal onClose={() => setShowUpdateProfileModal(false)}>
          <UpdateProfileForm onClose={() => setShowUpdateProfileModal(false)} />
        </Modal>
      )}

      {/* Modal for Connect Profile */}
      {showConnectModal && (
        <Modal onClose={() => setShowConnectModal(false)}>
          <ConnectProfile 
            onClose={() => setShowConnectModal(false)} 
            onProfileConnected={handleProfileConnected} 
          />
        </Modal>
      )}
    </div>
  );
};

export default SettingsPage;
