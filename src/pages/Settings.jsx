import React, { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Lock,
  Wallet,
  Key,
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
} from "lucide-react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import CommunityABI from "../artifacts/contracts/Community Contracts/Community.sol/Community.json";
import { useEthersSigner } from "../components/useClientSigner";
import { toast, ToastContainer } from "react-toastify";
import SFuelDistributor from "../providers/SFuelDistribution";

const CommunityAddress = import.meta.env.VITE_APP_COMMUNITY_CONTRACT_ADDRESS;
const Community_ABI = CommunityABI.abi;

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("did");
  const { address } = useAccount();
  const [isCopied, setIsCopied] = useState(false);
  const [didManagement, setDidManagement] = useState({
    didDocument: null,
    verifiableCredentials: [],
    linkedAccounts: [],
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });
  const [activeRoleTab, setActiveRoleTab] = useState("Admin");
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const signerPromise = useEthersSigner();
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
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );
      const tx = await contract.addMultiSigApprover(newRoleAddress);
      await tx.wait();
      toast.success("Multisig Approver added successfully");
      // setTimeout(() => {
      //   setShowAddRoleModal(false);
      // }, 2000);
    } catch (error) {
      toast.error("Failed to add multisig approver", error);
    }
  };

  //handle add reviewer
  const handleAddReviewer = async () => {
    try {
      const signer = await signerPromise;
      const contract = new ethers.Contract(
        CommunityAddress,
        Community_ABI,
        signer
      );
      const tx = await contract.addReviewer(newRoleAddress);
      await tx.wait();
      toast.success("Reviewer added successfully");
      // setTimeout(() => {
      //   setShowAddRoleModal(false);
      // }, 2000);
    } catch (error) {
      toast.error("Failed to add reviewer", error);
    }
  };

  const settingsSections = [
    {
      icon: <Key className="w-5 h-5" />,
      label: "DID",
      key: "did",
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

  const mockDidDocument = {
    id: "did:ethr:0x1234567890abcdef",
    controller: "0x1234567890abcdef",
    verificationMethod: [
      {
        id: "#key1",
        type: "Ed25519VerificationKey2020",
        controller: "did:web3:0x1234567890abcdef",
      },
    ],
  };

  const mockVerifiableCredentials = [
    {
      id: "vc1",
      type: ["VerifiableCredential", "KYCCredential"],
      issuer: "did:web3:trusted-authority",
      issuanceDate: "2024-01-15T00:00:00Z",
      expirationDate: "2025-01-15T00:00:00Z",
    },
    {
      id: "vc2",
      type: ["VerifiableCredential", "MembershipCredential"],
      issuer: "did:web3:community-dao",
      issuanceDate: "2024-02-01T00:00:00Z",
      expirationDate: "2025-02-01T00:00:00Z",
    },
  ];

  return (
    <div
      className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900
      min-h-screen p-6 transition-colors duration-300 pt-[100px]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8 space-x-4">
          <Settings className="w-8 h-8 text-yellow-500" />
          <h1
            className="text-3xl font-bold 
              dark:text-yellow-400 text-yellow-500"
          >
            Account Settings
          </h1>
        </div>

        <ToastContainer position="bottom-right" theme="colored" />

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
            {activeSection === "did" && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-yellow-500">
                  DID Management
                </h2>

                {/* DID Document Section */}
                <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 border dark:border-none rounded-lg p-4 mb-4">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">DID Document</h3>
                    <Link
                      to="/Didpage"
                      className="text-yellow-500 hover:underline"
                    >
                      Generate New DID
                    </Link>
                  </div>

                  {/* DID Details */}
                  <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">DID</span>
                      <span className="font-mono text-sm">
                        {mockDidDocument.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Controller</span>
                      <span className="font-mono text-sm">
                        {mockDidDocument.controller}
                      </span>
                    </div>
                  </div>

                  {/* DID Owner */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">DID Owner</h3>
                    <Link
                      to="/Ownercheck"
                      className="text-yellow-500 hover:underline"
                    >
                      View owner
                    </Link>
                  </div>

                  {/* DID Transfer */}
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">DID Transfer</h3>
                    <Link
                      to="/Changeowner"
                      className="text-yellow-500 hover:underline"
                    >
                      Change owner
                    </Link>
                  </div>
                </div>

                {/* DID Delegate Section */}
                <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 border dark:border-none rounded-lg p-4 mb-4">
                  {/* Add Delegate */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">DID Delegates</h3>
                    <Link
                      to="/AddDelegate"
                      className="text-yellow-500 hover:underline"
                    >
                      Add Delegate
                    </Link>
                  </div>

                  {/* Look up Delegate */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Look up Delegate</h3>
                    <Link
                      to="/CheckDelegate"
                      className="text-yellow-500 hover:underline"
                    >
                      Validity check
                    </Link>
                  </div>

                  {/* Revoke Delegate */}
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Revoke Delegate</h3>
                    <Link
                      to="/RevokeDelegate"
                      className="text-red-500 hover:underline"
                    >
                      Revoke
                    </Link>
                  </div>
                </div>

                {/* Verifiable Credentials Section */}
                <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 border dark:border-none rounded-lg p-4 mb-4">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Verifiable Credentials</h3>
                    <button className="text-yellow-500 hover:underline">
                      Add Credential
                    </button>
                  </div>

                  {/* Credentials List */}
                  {mockVerifiableCredentials.length > 0 ? (
                    mockVerifiableCredentials.map((vc) => (
                      <div
                        key={vc.id}
                        className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 rounded-lg p-3 mb-2 last:mb-0"
                      >
                        <div className="flex justify-between items-center">
                          {/* Credential Info */}
                          <div>
                            <span className="font-medium">
                              {vc.type.join(", ")}
                            </span>
                            <p className="text-sm text-gray-400">
                              Issued:{" "}
                              {new Date(vc.issuanceDate).toLocaleDateString()}
                            </p>
                          </div>
                          {/* View Details Button */}
                          <button
                            className="text-yellow-500 hover:underline"
                            onClick={() => handleViewCredential(vc.id)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400">
                      No credentials available.
                    </p>
                  )}
                </div>

                {/* Linked Accounts/DIDs */}
                <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 border dark:border-none rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Linked Accounts</h3>
                    <button className="text-yellow-500 hover:underline">
                      Link New Account
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

            {/* //Roles */}
            {activeSection === "roles" && (
              <div className="pb-8">
                <h2 className="text-2xl font-semibold mb-6 text-yellow-500">
                  Roles Management
                </h2>

                {/* Role Type Navigation */}
                <div className="flex overflow-x-auto mb-6 pb-2 border-b dark:border-gray-800">
                  {[
                    "Admin",
                    "Multisig Approver",
                    "Community Manager",
                    "Reviewer",
                  ].map((roleType) => (
                    <button
                      key={roleType}
                      onClick={() => setActiveRoleTab(roleType)}
                      className={`px-4 py-2 mr-4 whitespace-nowrap font-medium rounded-t-lg transition-colors ${
                        activeRoleTab === roleType
                          ? "bg-yellow-500 text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {roleType}
                    </button>
                  ))}
                </div>

                <div className="dark:bg-gray-900 bg-white dark:text-white text-gray-500 p-6 border dark:border-gray-800 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-medium">
                      {activeRoleTab}{" "}
                      {activeRoleTab !== "Admin" ? "Accounts" : ""}
                    </h3>

                    {activeRoleTab !== "Admin" && (
                      <button
                        onClick={() => setShowAddRoleModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add {activeRoleTab}</span>
                      </button>
                    )}
                  </div>

                  {/* Search and Filter */}
                  <div className="mb-6 flex">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={`Search ${activeRoleTab.toLowerCase()} accounts...`}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>

                  {/* Role Accounts List */}
                  <div className="border dark:border-gray-800 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 font-medium">
                      <span>Status</span>
                      <span>Address</span>
                      <span>Actions</span>
                    </div>

                    <div className="divide-y dark:divide-gray-800">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-4 items-center"
                        >
                          <div className="flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div>
                            <div className="font-mono text-sm">
                              0x7F5E835B94a381f898612538485ad18E5CfE7Eb5
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Added on Feb 20, 2025
                            </div>
                          </div>
                          <div>
                            <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Empty State */}
                  {false && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
                      <h4 className="text-lg font-medium mb-2">
                        No {activeRoleTab} Accounts
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                        There are currently no accounts with the {activeRoleTab}{" "}
                        role assigned.
                      </p>
                      <button className="flex items-center space-x-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors">
                        <PlusCircle className="w-4 h-4" />
                        <span>Add {activeRoleTab}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Role Modal (hidden by default) */}
                {showAddRoleModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
                      <h3 className="text-xl font-medium mb-4">
                        Add New {activeRoleTab}
                      </h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Wallet Address
                        </label>
                        <input
                          type="text"
                          placeholder="0x..."
                          value={newRoleAddress}
                          onChange={(e) => setNewRoleAddress(e.target.value)}
                          className="w-full p-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowAddRoleModal(false)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            // if (
                            //   !newRoleAddress ||
                            //   !newRoleAddress.startsWith("0x") ||
                            //   newRoleAddress.length !== 42
                            // ) {
                            //   // Show error message
                            //   toast.error(
                            //     "Please enter a valid Ethereum address"
                            //   );
                            //   return;
                            // }
                            // Call the appropriate function based on activeRoleTab
                            if (activeRoleTab === "Multisig Approver") {
                              handleAddMultisigApprover(newRoleAddress);
                            } else if (activeRoleTab === "Reviewer") {
                              handleAddReviewer(newRoleAddress);
                            } else if (activeRoleTab === "Community Manager") {
                              handleAddCommunityManager(newRoleAddress);
                            }

                            // Clear the input and close the modal
                            setNewRoleAddress("");
                            setShowAddRoleModal(false);
                          }}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "sfuelDetails" && <SFuelDistributor />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
