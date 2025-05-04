import { useRef } from "react";
import { Avatar } from "../components/ui/avatar";
import { Card } from "../components/ui/card";
import { Image, Edit3, PenLineIcon, Wallet, Eye, EyeOff, IdCard, MapPin, MailIcon } from "lucide-react";

export default function ProfileHeader({
  profileImage,
  coverImage,
  defaultCover,
  handleCoverChange,
  handleProfileChange,
  fullName,
  userRole,
  loc,
  email,
  did,
  showDid,
  setShowDid,
}) {
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  return (
    <div>
      {/* Cover Image Section */}
      <div className="relative w-full h-40 overflow-hidden bg-gray-300 dark:bg-gray-900">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover animate-fadeIn"
            loading="lazy"
          />
        ) : (
          <img
            src={defaultCover}
            alt="Default Cover"
            className="w-full h-full object-cover animate-fadeIn"
            loading="lazy"
          />
        )}
        {/* Cover Image Edit Button */}
        <button 
          onClick={() => coverInputRef.current.click()} 
          aria-label="Change Cover Image"
          className="absolute bottom-2 right-2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-500 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
        >
          <Image size={20} />
        </button>
        <input 
          type="file" 
          ref={coverInputRef} 
          className="hidden" 
          onChange={handleCoverChange} 
          aria-hidden="true"
        />
      </div>

      {/* Profile Details */}
      <div className="ml-10 top-8 relative flex flex-col md:flex-row items-center md:items-start text-center md:text-left animate-fadeIn gap-6 md:gap-12 justify-between">
        {/* Profile Picture */}
        <div className="relative mt-12 flex-shrink-0">
          <Avatar 
            className="h-40 w-40 border-4 border-white rounded-full" 
            src={profileImage} 
            alt="Profile Picture" 
            loading="lazy"
          />
          <button 
            onClick={() => profileInputRef.current.click()} 
            aria-label="Change Profile Picture"
            className="absolute bottom-1 right-1 bg-gray-900 text-white p-2 rounded-full hover:bg-gray-600 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
          >
            <Edit3 size={14} />
          </button>
          <input 
            type="file" 
            ref={profileInputRef} 
            className="hidden" 
            onChange={handleProfileChange} 
            aria-hidden="true"
          />
        </div>

        {/* Profile Card */}
        <div className="flex flex-col items-center md:items-start flex-grow dark:text-gray-100">
          <Card className="w-fit p-8 bg-gray-100 dark:bg-gray-800 animate-fadeIn overflow-x-auto">
            <h2 className="text-3xl font-extrabold mt-4 tracking-tight">{fullName}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">{userRole}</p>
            <div className="flex flex-col sm:flex-row sm:gap-4 mt-2">
              <div className="flex items-center gap-2">
                <MapPin size={18} aria-hidden="true" /> <span>{loc}</span>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon size={18} aria-hidden="true" /> <span>{email}</span>
              </div>
            </div>
            {/* DID Section */}
            <h3 className="text-xl font-bold flex items-center gap-2 mt-2 mb-1">
              <IdCard size={20} aria-hidden="true" /> Decentralized Identifier (DID)
              <button 
                onClick={() => setShowDid(!showDid)} 
                aria-label={showDid ? "Hide DID" : "Show DID"}
                className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
              >
                {showDid ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </h3>
            {/* Wrap in a container with fixed max-width */}
            <div className="w-full" style={{ maxWidth: "370px" }}>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                <p className="text-sm whitespace-nowrap">
                  {showDid ? did : "************************************"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-4">
              <button 
                aria-label="Edit Profile" 
                className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-yellow-500 dark:text-gray-100 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <PenLineIcon size={18} />
              </button>
              <button 
                aria-label="Manage Wallet" 
                className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-yellow-500 dark:text-gray-100 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <Wallet size={18} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
