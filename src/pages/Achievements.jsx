import React, { useState } from "react";
import {
  Trophy,
  Medal,
  Star,
  Flag,
  Check,
  Globe,
  BookOpen,
  Layers,
  Moon,
  Sun,
  BadgeCheck,
} from "lucide-react";
import { useCertificates } from "../contexts/certificatesContext";
import Certificate from "../components/Certificate";
import { CSSTransition } from "react-transition-group";
import "../index.css";

const AchievementsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { certificates } = useCertificates();
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCertificateClick = (cert) => {
    setLoading(true);
    setSelectedCertificate(cert);
    setShowPopup(true);
    setLoading(false);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setTimeout(() => setSelectedCertificate(null), 300); // Delay unmounting to allow transition
  };

  console.log("certificates", certificates);

  // Sample data for achievements
  const communityBadges = [
    {
      name: "Genesis Contributor",
      description: "Participated in first community event",
      date: "Jan 15, 2024",
      icon: <Flag className="w-6 h-6" />,
      rarity: "Legendary",
    },
    {
      name: "Web3 Warrior",
      description: "Completed 5 blockchain courses",
      date: "Feb 22, 2024",
      icon: <Layers className="w-6 h-6" />,
      rarity: "Epic",
    },
    {
      name: "Community Champion",
      description: "Hosted first community workshop",
      date: "Mar 10, 2024",
      icon: <Globe className="w-6 h-6" />,
      rarity: "Rare",
    },
  ];

  const abytkns = [
    {
      name: "ABYTKN-001: Blockchain Basics",
      value: "250 ABYTKN",
      date: "Jan 20, 2024",
      status: "Claimed",
    },
    {
      name: "ABYTKN-002: Smart Contract Mastery",
      value: "500 ABYTKN",
      date: "Feb 28, 2024",
      status: "Claimed",
    },
    {
      name: "ABYTKN-003: Web3 Security",
      value: "750 ABYTKN",
      date: "Mar 15, 2024",
      status: "Pending",
    },
  ];

  // const certificates = [
  //   {
  //     name: "Blockchain Fundamentals",
  //     issuer: "Web3 Academy",
  //     date: "Jan 25, 2024",
  //     icon: <BookOpen className="w-6 h-6" />,
  //   },
  //   {
  //     name: "Advanced Smart Contracts",
  //     issuer: "Crypto University",
  //     date: "Mar 5, 2024",
  //     icon: <Medal className="w-6 h-6" />,
  //   },
  // ];

  const communityEvents = [
    {
      courseName: "Blockchain Hackathon 2024",
      type: "Participated",
      date: "Feb 10, 2024",
      status: "Completed",
      cert_issuer: "ABYA UNIVERSITY",
    },
    {
      courseName: "Web3 Security Workshop",
      type: "Planned",
      date: "Apr 15, 2024",
      status: "Upcoming",
      cert_issuer: "ABYA UNIVERSITY",
    },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const RarityBadge = ({ rarity }) => {
    const rarityColors = {
      Legendary: "bg-purple-500 text-purple-100",
      Epic: "bg-orange-500 text-orange-100",
      Rare: "bg-blue-500 text-blue-100",
      Common: "bg-green-500 text-green-100",
    };

    return (
      <span
        className={`
        px-2 py-1 rounded-full text-xs font-medium
        ${rarityColors[rarity] || "bg-gray-500 text-gray-100"}
      `}
      >
        {rarity}
      </span>
    );
  };

  return (
    <div
      className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900
      min-h-screen p-6 transition-colors duration-300 pt-[100px]"
    >
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="
              text-3xl font-bold 
              dark:text-yellow-400 text-yellow-500"
            >
              Achievements Hub
            </h1>
            <p
              className="
              text-sm 
              dark:text-gray-400 text-gray-600"
            >
              Your journey of learning and contribution
            </p>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Community Badges */}
          <div
            className="
            p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <Trophy
                className="
                w-8 h-8 mr-3
                dark:text-yellow-400 text-yellow-500"
              />
              <h2
                className="
                text-xl font-semibold
                dark:text-white text-gray-900"
              >
                Community Badges
              </h2>
            </div>
            <div className="space-y-4">
              {communityBadges.map((badge, index) => (
                <div
                  key={index}
                  className="
                    p-4 rounded-lg flex items-center justify-between
                    dark:bg-gray-700 bg-gray-100"
                >
                  <div className="flex items-center">
                    <div
                      className="
                      p-2 rounded-full mr-3 dark:bg-yellow-500 dark:text-white bg-yellow-500 bg-opacity-20 text-yellow-600"
                    >
                      {badge.icon}
                    </div>
                    <div>
                      <p
                        className="
                        font-medium
                        dark:text-white text-gray-900"
                      >
                        {badge.name}
                      </p>
                      <p
                        className="
                        text-xs
                        dark:text-gray-400 text-gray-600"
                      >
                        {badge.date}
                      </p>
                    </div>
                  </div>
                  <RarityBadge rarity={badge.rarity} />
                </div>
              ))}
            </div>
          </div>

          {/* ABYTKN Tokens */}
          <div
            className="
            p-6 rounded-xl shadow-lg 
                dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <Star
                className="
                w-8 h-8 mr-3
                dark:text-yellow-400 text-yellow-500"
              />
              <h2
                className="
                text-xl font-semibold
                dark:text-white text-gray-900"
              >
                ABYTKN Tokens
              </h2>
            </div>
            <div className="space-y-4">
              {abytkns.map((token, index) => (
                <div
                  key={index}
                  className="
                    p-4 rounded-lg flex items-center justify-between
                    dark:bg-gray-700 bg-gray-100"
                >
                  <div>
                    <p
                      className="
                      font-medium
                      dark:text-white text-gray-900"
                    >
                      {token.name}
                    </p>
                    <p
                      className="
                      text-sm
                      dark:text-gray-400 text-gray-600"
                    >
                      {token.value}
                    </p>
                  </div>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${
                      token.status === "Claimed"
                        ? "bg-green-500 bg-opacity-20 text-green-500"
                        : "bg-yellow-500 bg-opacity-20 text-yellow-500"
                    }
                  `}
                  >
                    {token.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Certificates */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200">
            <div className="flex items-center mb-4">
              <Medal className="w-8 h-8 mr-3 dark:text-yellow-400 text-yellow-500" />
              <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                Certificates
              </h2>
            </div>
            <div className="space-y-4">
              {certificates.length === 0 ? (
                <div className="text-gray-500 text-center">
                  No certificates yet!
                </div>
              ) : (
                certificates.map((cert, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer mb-4"
                    onClick={() => handleCertificateClick(cert)}
                  >
                    <div className="flex items-center">
                      <div className="mr-4 text-2xl text-blue-600">
                        <BadgeCheck />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-normal text-gray-800 dark:text-gray-50 truncate"
                          title={cert.courseName}
                        >
                          {cert.courseName}
                        </h3>
                        <p className="text-gray-600 text-sm dark:text-gray-400">
                          {cert.cert_issuer}
                        </p>
                      </div>
                      <div className="ml-4 text-sm text-gray-500">
                        {new Date(
                          Number(cert.issue_date) * 1000
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Certificate Popup */}
          <CSSTransition
            in={showPopup}
            timeout={300}
            classNames="popup"
            unmountOnExit
          >
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 overflow-auto">
              <div className="relative bg-white rounded-lg max-w-7xl w-full max-h-[87vh] overflow-auto p-8 shadow-lg">
                <button
                  onClick={handleClosePopup}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="loader"></div>
                  </div>
                ) : (
                  <Certificate certificateData={selectedCertificate} />
                )}
              </div>
            </div>
          </CSSTransition>

          {/* Community Events */}
          <div
            className="
            p-6 rounded-xl shadow-lg 
            dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <Globe
                className="
                w-8 h-8 mr-3
                dark:text-yellow-400 text-yellow-500"
              />
              <h2
                className="
                text-xl font-semibold
                dark:text-white text-gray-900"
              >
                Community Events
              </h2>
            </div>
            <div className="space-y-4">
              {communityEvents.map((event, index) => (
                <div
                  key={index}
                  className="
                    p-4 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p
                      className="
                      font-medium
                      dark:text-white text-gray-900"
                    >
                      {event.name}
                    </p>
                    <p
                      className="
                      text-xs
                      dark:text-gray-400 text-gray-600"
                    >
                      {event.type}
                    </p>
                  </div>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${
                      event.status === "Completed"
                        ? "bg-green-500 bg-opacity-20 text-green-500"
                        : event.status === "Upcoming"
                        ? "bg-blue-500 bg-opacity-20 text-blue-500"
                        : "bg-gray-500 bg-opacity-20 text-gray-500"
                    }
                  `}
                  >
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
