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
  ListFilterPlus,
  PlusCircle,
  Search,
  Trash2,
  UsersIcon,
  BadgeCent,
  UserCircle,
} from "lucide-react";
import CommunityABI from "../artifacts/contracts/CommunityEngagementFacet.sol/CommunityEngagementFacet.json";
import { toast, ToastContainer } from "react-toastify";
import { useProfile } from "../contexts/ProfileContext";
import ProfileDashboard from "./ProfileDash";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";
import {
  defineChain,
  getContract,
  prepareContractCall,
  sendTransaction,
} from "thirdweb";

const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const Community_ABI = CommunityABI.abi;

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const account = useActiveAccount();
  const address = account?.address;
  const [isCopied, setIsCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });
  const [activeRoleTab, setActiveRoleTab] = useState("Admin");
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleAddress, setNewRoleAddress] = useState("");

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

  //handle add multisig approver
  const handleAddMultisigApprover = async () => {
    try {
      const signer = await client;
      const contract = await getContract({
        address: CommunityAddress,
        abi: Community_ABI,
        signer,
        chain: defineChain(1020352220),
      });
      const tx = await prepareContractCall({
        contract,
        method: "function addMultiSigApprover(address newApprover)",
        params: [newRoleAddress],
      });

      await sendTransaction(tx);
      toast.success("Multisig Approver added successfully");
    } catch (error) {
      toast.error("Failed to add multisig approver", error);
    }
  };

  //handle add reviewer
  const handleAddReviewer = async () => {
    try {
      const signer = await client;
      const contract = await getContract({
        address: CommunityAddress,
        abi: Community_ABI,
        signer,
        chain: defineChain(1020352220),
      });

      const tx = await prepareContractCall({
        contract,
        method: "function addReviewer(address newReviewer)",
        params: [newRoleAddress],
      });
      await sendTransaction(tx);
      toast.success("Reviewer added successfully");
    } catch (error) {
      toast.error("Failed to add reviewer", error);
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
    {
      icon: <ListFilterPlus className="w-5 h-5" />,
      label: "Manage Roles",
      key: "roles",
    },
    {
      icon: <BadgeCent className="w-5 h-5" />,
      label: "SFuel Details",
      key: "sfuelDetails",
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

  const { profile } = useProfile();

  // console.log("Profile: ", profile);

  return (
    <div
      className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900
    min-h-screen p-4 md:p-6 transition-colors duration-300 pt-16 md:pt-[100px]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 md:mb-8 space-x-3 md:space-x-4">
          <Settings className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
          <h1 className="text-2xl md:text-3xl font-bold dark:text-yellow-400 text-yellow-500">
            Account Settings
          </h1>
        </div>

        <ToastContainer position="bottom-right" theme="colored" />

        {/* Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Sidebar Navigation */}
          <div
            className="lg:col-span-1 p-4 md:p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
              transform hover:scale-105 transition-transform duration-1000"
          >
            {settingsSections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg mb-1 md:mb-2 transition-all text-sm md:text-base ${
                  activeSection === section.key
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "text-gray-400 dark:hover:bg-gray-700 hover:bg-yellow-500/20 dark:hover:text-white hover:text-gray-500"
                }`}
              >
                {React.cloneElement(section.icon, {
                  className: "w-4 h-4 md:w-5 md:h-5 flex-shrink-0",
                })}
                <span className="truncate">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div
            className="lg:col-span-3 p-4 md:p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
              transform hover:scale-105 transition-transform duration-1000"
          >
            {activeSection === "profile" && <ProfileDashboard />}

            {activeSection === "notifications" && (
              <div>
                <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-yellow-500">
                  Notification Preferences
                </h2>
                <div className="space-y-3 md:space-y-4">
                  {Object.entries(notifications).map(([type, enabled]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center dark:bg-gray-900 bg-white dark:text-white text-gray-500 border dark:border-none p-3 md:p-4 rounded-lg"
                    >
                      <span className="capitalize text-sm md:text-base">
                        {type} Notifications
                      </span>
                      <button
                        onClick={() => toggleNotification(type)}
                        className={`w-12 h-6 md:w-14 md:h-7 rounded-full transition-all flex-shrink-0 ${
                          enabled ? "bg-yellow-500" : "bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transform transition-transform ${
                            enabled
                              ? "translate-x-[18px] md:translate-x-[26px]"
                              : "translate-x-1"
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
                <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-yellow-500">
                  Security Settings
                </h2>
                <div className="space-y-4">
                  <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 p-3 md:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border dark:border-none">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm md:text-base">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-gray-400 text-xs md:text-sm">
                        Add an extra layer of security
                      </p>
                    </div>
                    <button className="bg-yellow-500 text-black px-3 py-2 md:px-4 md:py-2 rounded-lg text-sm md:text-base w-full sm:w-auto">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "wallet" && (
              <div>
                <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-yellow-500">
                  Wallet Settings
                </h2>
                <div className="space-y-4">
                  <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 p-3 md:p-4 border dark:border-none rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 md:mb-4">
                      <span className="text-sm md:text-base">
                        Connected Wallets
                      </span>
                      <button className="text-yellow-500 hover:underline text-sm md:text-base w-full sm:w-auto text-left sm:text-right">
                        Add Wallet
                      </button>
                    </div>
                    <div className="border-t border-gray-800 pt-3 md:pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <Wallet className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm md:text-base">Metamask</span>
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-3 justify-between sm:justify-start">
                          <span className="text-gray-400 text-xs md:text-sm font-mono">
                            {formatAddress(address)}
                          </span>
                          <button
                            onClick={copyToClipboard}
                            className="text-gray-500 hover:underline flex-shrink-0"
                            disabled={!address}
                          >
                            {isCopied ? (
                              <CopyCheckIcon className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                            ) : (
                              <CopyIcon className="w-4 h-4 md:w-5 md:h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Roles */}
            {activeSection === "roles" && (
              <div className="pb-6 md:pb-8">
                <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-yellow-500">
                  Roles Management
                </h2>

                {/* Role Type Navigation */}
                <div className="flex overflow-x-auto mb-4 md:mb-6 pb-2 border-b dark:border-gray-800">
                  {[
                    "Admin",
                    "Multisig Approver",
                    "Community Manager",
                    "Reviewer",
                  ].map((roleType) => (
                    <button
                      key={roleType}
                      onClick={() => setActiveRoleTab(roleType)}
                      className={`px-3 py-2 mr-2 md:mr-4 whitespace-nowrap font-medium rounded-t-lg transition-colors text-sm md:text-base ${
                        activeRoleTab === roleType
                          ? "bg-yellow-500 text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {roleType}
                    </button>
                  ))}
                </div>

                <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 p-4 md:p-6 border dark:border-gray-800 rounded-lg shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-medium">
                      {activeRoleTab}{" "}
                      {activeRoleTab !== "Admin" ? "Accounts" : ""}
                    </h3>

                    {activeRoleTab !== "Admin" && (
                      <button
                        onClick={() => setShowAddRoleModal(true)}
                        className="flex items-center space-x-1 md:space-x-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm md:text-base w-full sm:w-auto justify-center"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add {activeRoleTab}</span>
                      </button>
                    )}
                  </div>

                  {/* Search and Filter */}
                  <div className="mb-4 md:mb-6 flex">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={`Search ${activeRoleTab.toLowerCase()} accounts...`}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                      />
                    </div>
                  </div>

                  {/* Role Accounts List */}
                  <div className="border dark:border-gray-800 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 font-medium text-xs md:text-sm">
                      <span>Status</span>
                      <span>Address</span>
                      <span>Actions</span>
                    </div>

                    <div className="divide-y dark:divide-gray-800">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="grid grid-cols-[auto_1fr_auto] gap-3 md:gap-4 px-3 md:px-4 py-3 md:py-4 items-center"
                        >
                          <div className="flex items-center justify-center">
                            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono text-xs md:text-sm truncate">
                              0x7F5E835B94a381f898612538485ad18E5CfE7Eb5
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Added on Feb 20, 2025
                            </div>
                          </div>
                          <div>
                            <button className="p-1 md:p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Empty State */}
                  {false && (
                    <div className="py-8 md:py-12 flex flex-col items-center justify-center text-center">
                      <UsersIcon className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-700 mb-3 md:mb-4" />
                      <h4 className="text-base md:text-lg font-medium mb-2">
                        No {activeRoleTab} Accounts
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4 md:mb-6 text-sm md:text-base">
                        There are currently no accounts with the {activeRoleTab}{" "}
                        role assigned.
                      </p>
                      <button className="flex items-center space-x-2 px-4 py-2 md:px-6 md:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm md:text-base">
                        <PlusCircle className="w-4 h-4" />
                        <span>Add {activeRoleTab}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Role Modal */}
                {showAddRoleModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 md:p-6 w-full max-w-md">
                      <h3 className="text-lg md:text-xl font-medium mb-3 md:mb-4">
                        Add New {activeRoleTab}
                      </h3>
                      <div className="mb-3 md:mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Wallet Address
                        </label>
                        <input
                          type="text"
                          placeholder="0x..."
                          value={newRoleAddress}
                          onChange={(e) => setNewRoleAddress(e.target.value)}
                          className="w-full p-2 md:p-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm md:text-base"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                          onClick={() => setShowAddRoleModal(false)}
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm md:text-base order-2 sm:order-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (activeRoleTab === "Multisig Approver") {
                              handleAddMultisigApprover(newRoleAddress);
                            } else if (activeRoleTab === "Reviewer") {
                              handleAddReviewer(newRoleAddress);
                            } else if (activeRoleTab === "Community Manager") {
                              // handleAddCommunityManager(newRoleAddress);
                            }
                            setNewRoleAddress("");
                            setShowAddRoleModal(false);
                          }}
                          className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm md:text-base order-1 sm:order-2"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
