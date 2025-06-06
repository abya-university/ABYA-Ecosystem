import React, { useState, useEffect } from "react";
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
  Calendar,
  MapPin,
  Globe2,
  Users,
} from "lucide-react";
import { useCertificates } from "../contexts/certificatesContext";
import Certificate from "../components/Certificate";
import { CSSTransition } from "react-transition-group";
import "../index.css";
import { useCommunityMembers } from "../contexts/communityMembersContext";
import { useAccount } from "wagmi";
import { useCommunityEvents } from "../contexts/communityEventsContext";

const BADGE_DISPLAY_MAP = {
  0: {
    name: "Newcomer",
    icon: <Medal className="w-8 h-8 text-gray-400" />,
    color: "bg-gray-100 dark:bg-gray-800",
    requirements: "No participation yet",
  },
  1: {
    name: "Participant",
    icon: <Medal className="w-8 h-8 text-amber-600" />,
    color: "bg-amber-50 dark:bg-amber-900/20",
    requirements: "1+ Event Participation",
  },
  2: {
    name: "Contributor",
    icon: <Medal className="w-8 h-8 text-gray-500" />,
    color: "bg-gray-100 dark:bg-gray-800",
    requirements: "3+ Event Participation",
  },
  3: {
    name: "Leader",
    icon: <Trophy className="w-8 h-8 text-yellow-600" />,
    color: "bg-yellow-50 dark:bg-yellow-900/20",
    requirements: "5+ Event Participation",
  },
  4: {
    name: "Champion",
    icon: <Trophy className="w-8 h-8 text-cyan-600" />,
    color: "bg-cyan-50 dark:bg-cyan-900/20",
    requirements: "10+ Event Participation",
  },
};

const AchievementsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { certificates } = useCertificates();
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [userBadge, setUserBadge] = useState(null);
  const { memberBadgeDetails, fetchMemberBadgeDetails } = useCommunityMembers();
  const { address, isConnected } = useAccount();
  const currentBadgeLevel = memberBadgeDetails?.currentBadge || 0;
  const badgeInfo = BADGE_DISPLAY_MAP[currentBadgeLevel];
  const { events, fetchEvents } = useCommunityEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const { members, fetchMembers } = useCommunityMembers();

  console.log("Certificates: ", certificates);

  useEffect(() => {
    fetchEvents();
    fetchMemberBadgeDetails(address);
    if (memberBadgeDetails) {
      // Use the currentBadge from the contract's badge details
      setUserBadge(memberBadgeDetails.currentBadge);
    }
  }, [memberBadgeDetails, events]);

  console.log("Member Badge Details: ", memberBadgeDetails);

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

  function handleEventDetailsClick(event) {
    setSelectedEvent(event);
    setShowEventPopup(true);
  }

  const getEventStatus = (startTime, endTime) => {
    const now = Date.now();
    if (now < startTime) return "upcoming";
    if (now > endTime) return "past";
    return "ongoing";
  };

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
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex items-center mb-4">
              <Trophy className="w-8 h-8 mr-3 dark:text-yellow-400 text-yellow-500" />
              <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                Community Badges
              </h2>
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar h-96">
              <div className="grid gap-4">
                {Object.entries(BADGE_DISPLAY_MAP).map(([level, badge]) => {
                  const levelNum = parseInt(level);
                  const isUnlocked =
                    levelNum <= currentBadgeLevel && members.includes(address);
                  const isCurrentBadge =
                    levelNum === currentBadgeLevel && members.includes(address);

                  return (
                    <div
                      key={level}
                      className={`
                ${badge.color}
                rounded-xl p-5 border
                ${
                  isUnlocked
                    ? "border-green-500/50 dark:border-green-500/30"
                    : "border-gray-200 dark:border-gray-700"
                }
                ${isCurrentBadge ? "ring-2 ring-yellow-500" : ""}
                ${isUnlocked ? "opacity-100" : "opacity-50"}
                transition-all duration-300 transform hover:scale-102 hover:shadow-md
              `}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">{badge.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-bold truncate text-lg ${
                              isCurrentBadge ? "text-yellow-600" : ""
                            }`}
                          >
                            {badge.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {badge.requirements}
                          </p>
                          {isUnlocked && (
                            <div className="mt-2 text-green-600 flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Unlocked
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ABYTKN Tokens */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 flex flex-col">
            <div className="flex items-center mb-4">
              <Star className="w-8 h-8 mr-3 dark:text-yellow-400 text-yellow-500" />
              <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                ABYTKN Tokens
              </h2>
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar h-96">
              <div className="space-y-3">
                {abytkns.map((token, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg dark:bg-gray-700 bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-650 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium dark:text-white text-gray-900 text-lg">
                          {token.name}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-sm dark:text-yellow-300 text-yellow-600 font-semibold">
                            {token.value}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${
                    token.status === "Claimed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  }
                `}
                      >
                        {token.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 flex flex-col">
            <div className="flex items-center mb-4">
              <Medal className="w-8 h-8 mr-3 dark:text-yellow-400 text-yellow-500" />
              <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                Certificates
              </h2>
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar h-96">
              <div className="space-y-3">
                {certificates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mb-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p>No certificates yet!</p>
                  </div>
                ) : (
                  certificates.map((cert, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-600"
                      onClick={() => handleCertificateClick(cert)}
                    >
                      <div className="flex items-center">
                        <div className="mr-4 text-2xl text-blue-600 dark:text-blue-400">
                          <BadgeCheck />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-lg font-medium text-gray-800 dark:text-gray-50 truncate"
                            title={cert.courseName}
                          >
                            {cert.courseName}
                          </h3>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-gray-600 text-sm dark:text-gray-400">
                              {cert.cert_issuer}
                            </p>
                            <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                              {new Date(
                                Number(cert.issue_date) * 1000
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-1"
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
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border border-gray-200 flex flex-col">
            <div className="flex items-center mb-4">
              <Globe className="w-8 h-8 mr-3 dark:text-yellow-400 text-yellow-500" />
              <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                Community Events
              </h2>
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar h-96">
              <div className="space-y-4">
                {events?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mb-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p>No events yet!</p>
                  </div>
                ) : (
                  events.map((event) => {
                    // Calculate event status directly
                    const now = Date.now();
                    const isUpcoming = event.startTime > now;
                    const isPast = event.endTime < now;
                    const isOngoing = !isUpcoming && !isPast;
                    const eventStatus = isUpcoming
                      ? "upcoming"
                      : isOngoing
                      ? "ongoing"
                      : "past";

                    return (
                      <div
                        key={event.id}
                        className="bg-white dark:bg-gray-700 rounded-xl shadow-sm hover:shadow-md p-4 border border-gray-200 dark:border-gray-600 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h2 className="text-lg font-bold truncate pr-16">
                            {event.name}
                          </h2>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              eventStatus === "upcoming"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : eventStatus === "ongoing"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {eventStatus === "upcoming"
                              ? "Upcoming"
                              : eventStatus === "ongoing"
                              ? "Ongoing"
                              : "Past"}
                          </span>
                        </div>

                        {/* Event Type Badge */}
                        <div className="mb-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              event.isOnline
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                            }`}
                          >
                            {event.isOnline ? "Online" : "Physical"}
                          </span>
                        </div>

                        {/* Important Details */}
                        <div className="flex items-center space-x-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {new Date(event.startTime).toLocaleDateString()} at{" "}
                            {new Date(event.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Modified Location Section - Hide direct link */}
                        <div className="flex items-center space-x-2 mb-4">
                          {event.isOnline ? (
                            <Globe2 className="w-4 h-4 text-blue-500" />
                          ) : (
                            <MapPin className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {!event.isOnline
                              ? event.location || "Location TBD"
                              : "Click 'Join Event' when the event starts"}
                          </span>
                        </div>

                        {/* More Details Button */}
                        <button
                          onClick={() => handleEventDetailsClick(event)}
                          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center"
                        >
                          <span>View Details</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Event Details Popup */}
          <CSSTransition
            in={showEventPopup}
            timeout={300}
            classNames="popup"
            unmountOnExit
          >
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 overflow-auto">
              <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto p-6 shadow-lg">
                <button
                  onClick={() => setShowEventPopup(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10 bg-white dark:bg-gray-700 rounded-full p-1"
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

                {selectedEvent && (
                  <div className="pt-2">
                    {/* Calculate event status and countdown */}
                    {(() => {
                      const now = Date.now();
                      const isUpcoming = selectedEvent.startTime > now;
                      const isPast = selectedEvent.endTime < now;
                      const isOngoing = !isUpcoming && !isPast;
                      const eventStatus = isUpcoming
                        ? "upcoming"
                        : isOngoing
                        ? "ongoing"
                        : "past";

                      // Calculate countdown values
                      const secondsToStart = Math.max(
                        0,
                        Math.floor((selectedEvent.startTime - now) / 1000)
                      );
                      const days = Math.floor(secondsToStart / (60 * 60 * 24));
                      const hours = Math.floor(
                        (secondsToStart % (60 * 60 * 24)) / (60 * 60)
                      );
                      const minutes = Math.floor(
                        (secondsToStart % (60 * 60)) / 60
                      );
                      const seconds = Math.floor(secondsToStart % 60);

                      return (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {selectedEvent.name}
                            </h2>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                eventStatus === "upcoming"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                  : eventStatus === "ongoing"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {eventStatus === "upcoming"
                                ? "Upcoming"
                                : eventStatus === "ongoing"
                                ? "Ongoing"
                                : "Past"}
                            </span>
                          </div>

                          {/* Event Type */}
                          <div className="mb-6">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                selectedEvent.isOnline
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                              }`}
                            >
                              {selectedEvent.isOnline ? "Online" : "Physical"}
                            </span>
                          </div>

                          {/* Countdown Timer - New Addition */}
                          {isUpcoming && (
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                Countdown to Event Start
                              </h3>
                              <div className="flex justify-center space-x-4">
                                <div className="text-center">
                                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {days}
                                  </span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    days
                                  </p>
                                </div>
                                <div className="text-center">
                                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {hours}
                                  </span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    hours
                                  </p>
                                </div>
                                <div className="text-center">
                                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {minutes}
                                  </span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    minutes
                                  </p>
                                </div>
                                <div className="text-center">
                                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {seconds}
                                  </span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    sec
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Date and Time */}
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                            <div className="flex items-start space-x-3 mb-4">
                              <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  Date & Time
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                  {new Date(
                                    selectedEvent.startTime
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    selectedEvent.startTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {" - "}
                                  {new Date(
                                    selectedEvent.endTime
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    selectedEvent.endTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Location - Modified to hide meeting link */}
                            <div className="flex items-start space-x-3 mb-4">
                              {selectedEvent.isOnline ? (
                                <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
                              ) : (
                                <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                              )}
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  Location
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                  {!selectedEvent.isOnline
                                    ? selectedEvent.location || "Location TBD"
                                    : "Click 'Join Event' when the event starts"}
                                </p>
                              </div>
                            </div>

                            {/* Participants */}
                            <div className="flex items-start space-x-3">
                              <Users className="w-5 h-5 text-green-500 mt-0.5" />
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  Participants
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                  {selectedEvent.currentParticipants} /{" "}
                                  {selectedEvent.maxParticipants} participants
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="mb-6">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                              Details
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                              {selectedEvent.additionalDetails ||
                                "No additional details available."}
                            </p>
                          </div>

                          {/* Action buttons - Modified for contract interaction */}
                          <div className="flex space-x-4">
                            <button
                              onClick={async () => {
                                // Only enable for ongoing events
                                if (!isOngoing) return;

                                try {
                                  if (selectedEvent.isOnline) {
                                    // For online events, call contract first then open meeting
                                    await handleParticipateInEvent(
                                      selectedEvent.id
                                    );
                                    // Only open the link if contract call was successful
                                    window.open(
                                      selectedEvent.location,
                                      "_blank"
                                    );
                                  } else {
                                    // For physical events, just call contract
                                    await handleParticipateInEvent(
                                      selectedEvent.id
                                    );
                                  }
                                } catch (error) {
                                  console.error("Failed to join event:", error);
                                  // You could add a toast notification here
                                }
                              }}
                              disabled={
                                !isOngoing ||
                                selectedEvent.currentParticipants >=
                                  selectedEvent.maxParticipants
                              }
                              className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 font-medium ${
                                !isOngoing ||
                                selectedEvent.currentParticipants >=
                                  selectedEvent.maxParticipants
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
                              }`}
                            >
                              {isPast
                                ? "Event Ended"
                                : isUpcoming
                                ? "Event Not Started"
                                : selectedEvent.currentParticipants >=
                                  selectedEvent.maxParticipants
                                ? "Event Full"
                                : "Join Event"}
                            </button>

                            {isUpcoming &&
                              selectedEvent.currentParticipants <
                                selectedEvent.maxParticipants && (
                                <button className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium">
                                  Register
                                </button>
                              )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </CSSTransition>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
