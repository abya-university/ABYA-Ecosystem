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
  Key,
  LogOut,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  AlertCircle,
  Save,
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
import { useUser } from "../contexts/userContext";

const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const Community_ABI = CommunityABI.abi;

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const account = useActiveAccount();
  const address = account?.address;
  const [isCopied, setIsCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    updates: true,
  });
  const [activeRoleTab, setActiveRoleTab] = useState("Admin");
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleAddress, setNewRoleAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    sessionTimeout: "30",
    requirePassword: true,
  });
  const { did, didDocument, enrolledCourses } = useUser();

  console.log("Dashboard enrolled courses: ", enrolledCourses);

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
          toast.success("Address copied to clipboard!");
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          toast.error("Failed to copy address");
        });
    }
  };

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
      setNewRoleAddress("");
      setShowAddRoleModal(false);
    } catch (error) {
      toast.error("Failed to add multisig approver");
      console.error(error);
    }
  };

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
      setNewRoleAddress("");
      setShowAddRoleModal(false);
    } catch (error) {
      toast.error("Failed to add reviewer");
      console.error(error);
    }
  };

  const toggleNotification = (type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${
        !notifications[type] ? "enabled" : "disabled"
      }`,
    );
  };

  const toggleSecuritySetting = (setting) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
    toast.success(
      `${setting.replace(/([A-Z])/g, " $1")} ${
        !securitySettings[setting] ? "enabled" : "disabled"
      }`,
    );
  };

  const settingsSections = [
    {
      icon: <UserCircle className="w-5 h-5" />,
      label: "Profile",
      key: "profile",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      key: "notifications",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Security",
      key: "security",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      label: "Wallet",
      key: "wallet",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <ListFilterPlus className="w-5 h-5" />,
      label: "Manage Roles",
      key: "roles",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: <BadgeCent className="w-5 h-5" />,
      label: "DID Details",
      key: "didDetails",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  const { profile } = useProfile();

  const roleAccounts = {
    Admin: [
      {
        address: "0x7F5E835B94a381f898612538485ad18E5CfE7Eb5",
        added: "Feb 20, 2025",
        status: "active",
      },
      {
        address: "0x8G6F946C85b372f898612538485ad18E5CfE7Fc6",
        added: "Mar 15, 2025",
        status: "active",
      },
    ],
    "Multisig Approver": [
      {
        address: "0x9H7A956D95c492f898612538485ad18E5CfE7Gd7",
        added: "Jan 10, 2025",
        status: "active",
      },
    ],
    "Community Manager": [
      {
        address: "0x1A2B3C4D5E6F78901234567890ABCDEF12345678",
        added: "Apr 05, 2025",
        status: "active",
      },
    ],
    Reviewer: [
      {
        address: "0x2B3C4D5E6F78901234567890ABCDEF1234567890",
        added: "Mar 30, 2025",
        status: "active",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <ToastContainer position="bottom-right" theme="dark" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your account preferences and security
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Connected</span>
            </div>
          </div>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sticky top-24">
              <div className="space-y-1">
                {settingsSections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                      activeSection === section.key
                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          activeSection === section.key
                            ? "bg-white/20"
                            : `bg-gradient-to-r ${section.color}`
                        }`}
                      >
                        {React.cloneElement(section.icon, {
                          className: `w-4 h-4 ${
                            activeSection === section.key
                              ? "text-white"
                              : "text-white"
                          }`,
                        })}
                      </div>
                      <span className="font-medium">{section.label}</span>
                    </div>
                    {activeSection === section.key && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>

              {/* Account Summary */}
              <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <p className="text-sm text-gray-300 mb-2">Account</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Main Wallet</p>
                    <p className="text-sm text-gray-400 font-mono">
                      {formatAddress(address)}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Content Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${
                      settingsSections.find((s) => s.key === activeSection)
                        ?.color || "from-gray-500 to-gray-600"
                    }`}
                  >
                    {React.cloneElement(
                      settingsSections.find((s) => s.key === activeSection)
                        ?.icon || <Settings className="w-5 h-5" />,
                      { className: "w-5 h-5 text-white" },
                    )}
                  </div>
                  <h2 className="text-2xl font-semibold">
                    {
                      settingsSections.find((s) => s.key === activeSection)
                        ?.label
                    }
                  </h2>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6">
                {activeSection === "profile" && <ProfileDashboard />}

                {activeSection === "notifications" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(notifications).map(([type, enabled]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                enabled
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : "bg-gray-100 dark:bg-gray-700"
                              }`}
                            >
                              {type === "email" && <Mail className="w-4 h-4" />}
                              {type === "push" && <Bell className="w-4 h-4" />}
                              {type === "sms" && (
                                <Smartphone className="w-4 h-4" />
                              )}
                              {type === "marketing" && (
                                <Link2 className="w-4 h-4" />
                              )}
                              {type === "updates" && (
                                <AlertCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium capitalize">
                                {type} Notifications
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {type === "email" &&
                                  "Receive updates via email"}
                                {type === "push" &&
                                  "Browser push notifications"}
                                {type === "sms" && "Text message alerts"}
                                {type === "marketing" && "Promotional offers"}
                                {type === "updates" &&
                                  "Important system updates"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleNotification(type)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              enabled
                                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                : "bg-gray-200 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                enabled ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
                        <Save className="w-4 h-4" />
                        Save Notification Preferences
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "security" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                              <Key className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium">
                                Two-Factor Authentication
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSecuritySetting("twoFactor")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              securitySettings.twoFactor
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {securitySettings.twoFactor ? "Enabled" : "Enable"}
                          </button>
                        </div>
                        {securitySettings.twoFactor && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <p className="text-sm text-green-800 dark:text-green-300">
                                2FA is active. You'll need to verify login
                                attempts with your authenticator app.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                              <Shield className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium">Session Timeout</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Automatically log out after inactivity
                              </p>
                            </div>
                          </div>
                          <select
                            value={securitySettings.sessionTimeout}
                            onChange={(e) =>
                              setSecuritySettings((prev) => ({
                                ...prev,
                                sessionTimeout: e.target.value,
                              }))
                            }
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-0 focus:ring-2 focus:ring-yellow-500"
                          >
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                            <option value="0">Never</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium">
                                Password Required for Transactions
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Require password confirmation for all
                                transactions
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              toggleSecuritySetting("requirePassword")
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              securitySettings.requirePassword
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                : "bg-gray-200 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                securitySettings.requirePassword
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
                          Save Security Settings
                        </button>
                        <button className="px-4 py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          Revoke All Sessions
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "wallet" && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">
                          Connected Wallets
                        </h3>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity">
                          <PlusCircle className="w-4 h-4" />
                          Add Wallet
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                              <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">Metamask</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {formatAddress(address)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={copyToClipboard}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              title={isCopied ? "Copied!" : "Copy address"}
                            >
                              {isCopied ? (
                                <CopyCheckIcon className="w-4 h-4 text-green-500" />
                              ) : (
                                <CopyIcon className="w-4 h-4" />
                              )}
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Connected
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium mb-4">
                        Wallet Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                              <QrCode className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-medium">Show QR Code</h4>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Display your wallet address as QR code
                          </p>
                        </button>
                        <button className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                              <Link2 className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-medium">Connected Apps</h4>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage dApp connections and permissions
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "roles" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-lg font-medium">Role Management</h3>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {[
                          "Admin",
                          "Multisig Approver",
                          "Community Manager",
                          "Reviewer",
                        ].map((role) => (
                          <button
                            key={role}
                            onClick={() => setActiveRoleTab(role)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                              activeRoleTab === role
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h4 className="text-xl font-semibold">
                            {activeRoleTab}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {roleAccounts[activeRoleTab]?.length || 0}{" "}
                            account(s) with this role
                          </p>
                        </div>
                        {activeRoleTab !== "Admin" && (
                          <button
                            onClick={() => setShowAddRoleModal(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                          >
                            <PlusCircle className="w-4 h-4" />
                            Add {activeRoleTab}
                          </button>
                        )}
                      </div>

                      {roleAccounts[activeRoleTab]?.length > 0 ? (
                        <div className="space-y-3">
                          {roleAccounts[activeRoleTab].map((account, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                                  <UsersIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="font-mono text-sm">
                                    {account.address}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Added on {account.added}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  {account.status}
                                </div>
                                <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <h4 className="text-lg font-medium mb-2">
                            No {activeRoleTab} Accounts
                          </h4>
                          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            There are currently no accounts with the{" "}
                            {activeRoleTab} role assigned.
                          </p>
                          <button
                            onClick={() => setShowAddRoleModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity mx-auto"
                          >
                            <PlusCircle className="w-4 h-4" />
                            Add First {activeRoleTab}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "didDetails" && (
                  <div className="space-y-6">
                    <div className="dark:bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                          <BadgeCent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Your Decentralized Identity
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            Self-sovereign identity on the blockchain
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-white/10 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            DID
                          </p>
                          <p className="font-mono break-all text-gray-900 dark:text-white bg-black/10 dark:bg-black/20 p-3 rounded-lg">
                            {did || "did:example:123456789abcdefghi"}
                          </p>
                        </div>

                        <div className="p-4 bg-white/10 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            DID Document
                          </p>
                          <pre className="text-sm bg-black/10 text-gray-900 dark:text-white dark:bg-black/20 p-4 rounded-lg overflow-x-auto">
                            {JSON.stringify(
                              didDocument || {
                                "@context": "https://www.w3.org/ns/did/v1",
                                id: "did:example:123456789abcdefghi",
                                verificationMethod: [],
                                authentication: [],
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-700">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                            Update DID Document
                          </button>
                          <button className="px-4 py-3 border border-black/40 dark:border-white/20 dark:text-white text-gray-800 rounded-lg hover:bg-white/10 transition-colors">
                            Export DID
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Add New {activeRoleTab}</h3>
              <button
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleAddress("");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newRoleAddress}
                  onChange={(e) => setNewRoleAddress(e.target.value)}
                  className="w-full p-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Adding a new {activeRoleTab.toLowerCase()} will grant them
                    specific permissions within the community. Make sure you
                    trust this address.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleAddress("");
                }}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeRoleTab === "Multisig Approver") {
                    handleAddMultisigApprover();
                  } else if (activeRoleTab === "Reviewer") {
                    handleAddReviewer();
                  } else if (activeRoleTab === "Community Manager") {
                    // handleAddCommunityManager(newRoleAddress);
                    toast.success(
                      "Community Manager functionality coming soon!",
                    );
                    setShowAddRoleModal(false);
                  }
                }}
                disabled={!newRoleAddress}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
