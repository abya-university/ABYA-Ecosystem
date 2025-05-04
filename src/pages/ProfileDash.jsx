// ProfileDashboard.jsx
import { useState, useEffect, Suspense, lazy } from "react";
import ProfileHeader from "../components/ProfileHeader";
import ProfileSidebar from "../components/ProfileSidebar";
import DelegateListSection from "../components/DelegateList";
import Modal from "../components/ui/Modal";
import defaultCover from "../assets/cover.jpg";

// Lazy load modal components
const DidForm = lazy(() => import("./DidForm"));
const DidOwnerCheck = lazy(() => import("./DidOwnerCheck"));
const ChangeOwner = lazy(() => import("./ChangeOwner"));
const AddDelegate = lazy(() => import("./AddDelegate"));
const CheckDelegate = lazy(() => import("./CheckDelegate"));
const RevokeDelegate = lazy(() => import("./RevokeDelegate"));

export default function ProfileDashboard({ profile, did }) {
  // Show error if required props are missing.
  if (!profile || !did) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300 bg-gray-100 text-gray-600">
        <p className="text-lg">No profile data available.</p>
      </div>
    );
  }

  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showDid, setShowDid] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [isDidOpen, setIsDidOpen] = useState(false);
  const [isDelegateOpen, setIsDelegateOpen] = useState(false);
  const [isVcOpen, setIsVcOpen] = useState(false);

  // State to control the overlay sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    darkMode ? root.classList.add("dark") : root.classList.remove("dark");
  }, [darkMode]);

  // Destructure profile data with defaults
  const {
    firstName = "N/A",
    secondName = "",
    email = "Email Not Provided",
    location: loc = "Lower Orbit",

  } = profile.profile || {};

  const fullName = `${firstName} ${secondName}`.trim() || "N/A";
  const userRole = profile.role || "User";

  // Handlers to update images
  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) setCoverImage(URL.createObjectURL(file));
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100 bg-gray-100 relative`}
    >
      {/* Sidebar Toggle Button - visible on all screens (or adjust via responsive classes) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-4 left-4 z-10 p-2 bg-yellow-500 rounded-md text-black"
      >
        ☰
      </button>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 flex"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="w-64 bg-white dark:bg-gray-800 shadow-lg"
            onClick={(e) => e.stopPropagation()} // Stop propagation to prevent closing when interacting inside the sidebar
          >
            <ProfileSidebar
              isDidOpen={isDidOpen}
              setIsDidOpen={setIsDidOpen}
              isDelegateOpen={isDelegateOpen}
              setIsDelegateOpen={setIsDelegateOpen}
              isVcOpen={isVcOpen}
              setIsVcOpen={setIsVcOpen}
              openModal={openModal}
              onClose={() => setIsSidebarOpen(false)}
            />
            {/* Close Button inside sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 w-full text-left border-t border-gray-300 dark:text-gray-100"
            >
              Close Sidebar
            </button>
          </div>
          {/* Overlay area for closing sidebar */}
          <div className="flex-1" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}

      {/* Main Column for the content */}
      <div className="flex flex-col min-h-screen">
        {/* Header - optionally pass sidebar toggle callback if header contains a toggle */}
        <ProfileHeader
          profileImage={profileImage}
          coverImage={coverImage}
          defaultCover={defaultCover}
          handleCoverChange={handleCoverChange}
          handleProfileChange={handleProfileChange}
          toggleDarkMode={toggleDarkMode}
          darkMode={darkMode}
          fullName={fullName}
          userRole={userRole}
          loc={loc}
          email={email}
          did={did}
          showDid={showDid}
          setShowDid={setShowDid}
          skillLevel={44}
          onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
          showSidebarToggle
        />

        {/* Main Content */}
        <main className="mt-10 p-6 space-y-8 flex-1">
          <DelegateListSection did={did} />
        </main>
      </div>

      {/* Modals */}
      {modalType && (
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center dark:text-gray-100">
              Loading...
            </div>
          }
        >
          <Modal onClose={closeModal} ariaLabel="Modal Window">
            {modalType === "createDID" && <DidForm />}
            {modalType === "lookupDID" && <DidOwnerCheck />}
            {modalType === "changeOwner" && <ChangeOwner />}
            {modalType === "addDelegate" && <AddDelegate />}
            {modalType === "checkDelegate" && <CheckDelegate />}
            {modalType === "revokeDelegate" && <RevokeDelegate />}
          </Modal>
        </Suspense>
      )}

      {/* Custom Scrollbar & Animations */}
      <style>{`
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgb(61, 61, 61);
        }
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out both;
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s infinite;
        }
      `}</style>
    </div>
  );
}
