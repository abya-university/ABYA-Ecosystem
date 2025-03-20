// ProfileDash.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, IdCard, Mail, Phone, MapPin, Calendar, Globe } from "lucide-react";

const ProfileDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // The profile JSON is passed in state from ConnectProfile
  const { profile, did } = location.state || {};

  if (!profile || !did) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">No profile data available.</p>
      </div>
    );
  }

  // Extract fields from the JSON. Our JSON structure has a top-level "profile" key.
  const { firstName, secondName, email, phone, location: loc, dob, website, bio, skills } = profile.profile || {};
  const fullName = firstName && secondName ? `${firstName} ${secondName}` : "N/A";
  const userRole = profile.role || "Student"; // Default role

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-semibold text-yellow-500 mb-6">Your Profile</h1>

        {/* Profile Info */}
        <div className="flex items-center space-x-4 border-b pb-4 mb-4">
          <User className="w-12 h-12 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-semibold">{fullName}</h2>
            <p className="text-gray-500">{userRole}</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileItem icon={<IdCard />} label="DID" value={did} />
          <ProfileItem icon={<Mail />} label="Email" value={email || "N/A"} />
          <ProfileItem icon={<Phone />} label="Phone" value={phone || "N/A"} />
          <ProfileItem icon={<MapPin />} label="Location" value={loc || "N/A"} />
          <ProfileItem icon={<Calendar />} label="Date of Birth" value={dob || "N/A"} />
          <ProfileItem icon={<Globe />} label="Website" value={website || "N/A"} />
        </div>

        {/* Profile Description */}
        {bio && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-yellow-500 mb-2">Bio</h3>
            <p className="text-gray-700">{bio}</p>
          </div>
        )}

        {/* Skills */}
        {skills && Array.isArray(skills) && skills.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-yellow-500 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded"
            onClick={() => navigate("/")}
          >
            Logout / Connect with another account
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileItem = ({ icon, label, value }) => (
  <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg shadow-sm">
    <div className="text-yellow-500">{icon}</div>
    <div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-gray-900 font-semibold">{value}</p>
    </div>
  </div>
);

export default ProfileDashboard;
