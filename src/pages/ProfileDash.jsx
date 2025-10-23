// ProfileDashboard.jsx
import { useState, useEffect } from "react";
import { useProfile } from "../contexts/ProfileContext";
import {
  UserCircle2Icon,
  UserCircleIcon,
  Shield,
  CheckCircle,
  Clock,
  Edit3,
  Image,
  Palette,
} from "lucide-react";

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
  const [imageLoading, setImageLoading] = useState(false);

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
      setFormData({ fname: "", lname: "", email: "", confirmed: false });
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

  const handleImageUpload = (type, file) => {
    setImageLoading(true);
    // Simulate upload process
    setTimeout(() => {
      const imageUrl = URL.createObjectURL(file);
      if (type === "profile") {
        setProfileImage(imageUrl);
      } else {
        setCoverImage(imageUrl);
      }
      setImageLoading(false);
    }, 1500);
  };

  // Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mx-auto mb-6"></div>
            <UserCircle2Icon className="w-8 h-8 text-yellow-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Loading Your Profile
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Preparing your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Enhanced connection required state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-600 dark:text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
            Connect your wallet to access your personalized profile dashboard
            and manage your account settings.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              💡 Make sure your wallet is connected to the correct network
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Enhanced Popup Overlay */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transform animate-slideUp">
            {/* Header */}
            <div className="relative p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                  <UserCircle2Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Create Profile
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set up your account information
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5"
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

            {/* Form */}
            <form onSubmit={handleCreateProfile} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="fname"
                    value={formData.fname}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lname"
                    value={formData.lname}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    placeholder="Enter your last name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Enhanced Disclaimer */}
              {formData.fname && formData.lname && formData.email && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 transition-all duration-300 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-800 border border-yellow-300 dark:border-yellow-700 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                          !
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Certificate Name Verification
                      </p>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.confirmed}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              confirmed: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-1 flex-shrink-0"
                        />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200 group-hover:text-yellow-900 dark:group-hover:text-yellow-100 transition-colors">
                          I confirm that{" "}
                          <span className="font-bold bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-yellow-200 dark:border-yellow-700">
                            {formData.fname} {formData.lname}
                          </span>{" "}
                          is correct and will appear exactly like this on all
                          certificates.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating || !formData.confirmed}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-yellow-300 disabled:to-yellow-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 shadow-lg"
                >
                  {creating ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Profile...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Profile
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced No Profile State */}
      {!hasProfile && !showCreateForm && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <UserCircleIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-600 dark:text-white mb-4">
              Welcome Aboard!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
              Create your profile to unlock personalized features, track your
              progress, and access exclusive content. Your journey starts here.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-yellow-500 focus:ring-offset-4"
            >
              <span className="flex items-center justify-center gap-2">
                <UserCircle2Icon className="w-5 h-5" />
                Create Your Profile
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Profile Dashboard */}
      {hasProfile && (
        <div className="min-h-screen">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 dark:from-yellow-900/20 dark:to-yellow-800/20 border-b border-yellow-200/50 dark:border-yellow-800/50">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome back, {profile.fname}! 👋
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage your profile and account settings
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
                  >
                    <Palette className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <main className="max-w-6xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Overview Card */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-20 h-20 rounded-2xl object-cover border-4 border-yellow-200 dark:border-yellow-800"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center border-4 border-yellow-200 dark:border-yellow-800">
                          <UserCircle2Icon className="w-8 h-8 text-white" />
                        </div>
                      )}
                      {imageLoading && (
                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {profile.fname} {profile.lname}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        {profile.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            profile.active ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            profile.active
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {profile.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserCircle2Icon className="w-5 h-5 text-yellow-500" />
                        Personal Info
                      </h3>
                      <div className="space-y-3">
                        <InfoRow label="Profile ID" value={`#${profile.id}`} />
                        <InfoRow
                          label="Wallet Address"
                          value={profile.account}
                          isAddress
                        />
                        <InfoRow
                          label="Status"
                          value={profile.active ? "Active" : "Inactive"}
                          isStatus
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        Timeline
                      </h3>
                      <div className="space-y-3">
                        <InfoRow
                          label="Member Since"
                          value={
                            profile.createdAt
                              ? new Date(
                                  profile.createdAt * 1000
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "N/A"
                          }
                        />
                        <InfoRow
                          label="Last Updated"
                          value={
                            profile.updatedAt
                              ? new Date(
                                  profile.updatedAt * 1000
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "N/A"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Sidebar */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <ImageUploadButton
                      icon={<Image className="w-4 h-4" />}
                      label="Change Profile Image"
                      onFileSelect={(file) =>
                        handleImageUpload("profile", file)
                      }
                      loading={imageLoading}
                    />
                    <ImageUploadButton
                      icon={<Edit3 className="w-4 h-4" />}
                      label="Change Cover Image"
                      onFileSelect={(file) => handleImageUpload("cover", file)}
                      loading={imageLoading}
                    />
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4">Profile Stats</h3>
                  <div className="space-y-3">
                    <StatItem label="Profile Completeness" value="85%" />
                    <StatItem label="Account Age" value="30 days" />
                    <StatItem label="Verification Level" value="Basic" />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

// Helper Components
const InfoRow = ({ label, value, isAddress = false, isStatus = false }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
      {label}
    </span>
    <span
      className={`text-sm font-semibold ${
        isAddress
          ? "text-yellow-600 dark:text-yellow-400 font-mono"
          : isStatus
          ? `px-2 py-1 rounded-full text-xs ${
              value === "Active"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`
          : "text-gray-900 dark:text-white"
      }`}
    >
      {isAddress ? `${value.slice(0, 8)}...${value.slice(-6)}` : value}
    </span>
  </div>
);

const ImageUploadButton = ({ icon, label, onFileSelect, loading }) => (
  <label
    className={`flex items-center gap-3 w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 ${
      loading ? "opacity-50 cursor-not-allowed" : ""
    }`}
  >
    <div className="text-yellow-500">{icon}</div>
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </span>
    <input
      type="file"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file && !loading) onFileSelect(file);
      }}
      disabled={loading}
    />
    {loading && (
      <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
    )}
  </label>
);

const StatItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-yellow-100 text-sm">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

// Add these to your CSS for animations
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}
`;

// Don't forget to inject the styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
