// ProfileDashboard.jsx
import { useState, useEffect } from "react";
import { useProfile } from "../contexts/ProfileContext";
import { UserCircle2Icon, UserCircleIcon } from "lucide-react";

export default function ProfileDashboard() {
  const {
    profile,
    loading,
    hasProfile,
    isConnected,
    getProfileByAccount,
    createProfile,
  } = useProfile();

  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    confirmed: false,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    darkMode ? root.classList.add("dark") : root.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    if (isConnected) {
      getProfileByAccount();
    }
  }, [isConnected, getProfileByAccount]);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!formData.fname || !formData.lname || !formData.email) {
      alert("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      await createProfile(formData.fname, formData.lname, formData.email);
      setShowCreateForm(false);
      setFormData({ fname: "", lname: "", email: "" });
    } catch (error) {
      console.error("Failed to create profile:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show connection required state
  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <p className="text-lg font-semibold mb-2">Wallet Not Connected</p>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  // Main dashboard with popup form
  return (
    <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {/* Popup Overlay */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Your Profile
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="fname"
                  value={formData.fname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Disclaimer Section - Only shows when all fields are filled */}
              {formData.fname && formData.lname && formData.email && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-800 border border-yellow-300 dark:border-yellow-700 rounded flex items-center justify-center">
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                          ⚠️
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                        Important: Certificate Name Verification
                      </p>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.confirmed}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              confirmed: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium group-hover:text-yellow-900 dark:group-hover:text-yellow-100 transition-colors">
                          I confirm that my name{" "}
                          <span className="text-gray-900 dark:text-gray-200 font-semibold bg-white dark:bg-gray-800 p-1 rounded-lg">
                            {formData.fname} {formData.lname}
                          </span>{" "}
                          is correct and I understand it will appear exactly
                          like this on all certificates
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating || !formData.confirmed}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  {creating ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </span>
                  ) : (
                    "Create Profile"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No Profile State */}
      {!hasProfile && !showCreateForm && (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <UserCircleIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-200 mb-3">
              No Profile Found
            </h2>
            <p className="text-gray-400 dark:text-gray-400 mb-8 leading-relaxed">
              Create your profile to get started with our platform and access
              all features.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-8 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-200 dark:focus:ring-offset-gray-900"
            >
              Create Your Profile
            </button>
          </div>
        </div>
      )}

      {/* Profile Dashboard */}
      {hasProfile && (
        <div className="flex flex-col min-h-[60vh]">
          <main className="p-6 flex-1">
            <div className="max-w-4xl mx-auto">
              {/* Profile Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Profile Dashboard
                  </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Personal Information
                    </h2>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Name:
                        </span>
                        <span className="text-gray-900 dark:text-white">{`${profile.fname} ${profile.lname}`}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Email:
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {profile.email}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Wallet:
                        </span>
                        <span className="text-yellow-600 dark:text-yellow-400 font-mono text-sm">
                          {profile.account?.slice(0, 8)}...
                          {profile.account?.slice(-6)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Status:
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            profile.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {profile.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      Profile Details
                    </h2>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Profile ID:
                        </span>
                        <span className="text-gray-900 dark:text-white font-mono">
                          #{profile.id}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Created:
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {profile.createdAt
                            ? new Date(
                                profile.createdAt * 1000
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Last Updated:
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {profile.updatedAt
                            ? new Date(
                                profile.updatedAt * 1000
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Profile Actions
                </h2>
                <div className="flex flex-wrap gap-4">
                  <label className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg">
                    📷 Change Profile Image
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setProfileImage(URL.createObjectURL(file));
                      }}
                    />
                  </label>

                  <label className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg">
                    🖼️ Change Cover Image
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setCoverImage(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
