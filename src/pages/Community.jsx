import React, { useState } from "react";
import { Users, MessageCircle, Globe, Heart, Star } from "lucide-react";

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const communityStats = [
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      label: "Total Members",
      value: "42,856",
    },
    {
      icon: <Globe className="w-6 h-6 text-green-500" />,
      label: "Countries",
      value: "87",
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-purple-500" />,
      label: "Active Discussions",
      value: "1,234",
    },
  ];

  const featuredMembers = [
    {
      name: "Alice Ethereum",
      role: "Core Developer",
      avatar: "/api/placeholder/80/80",
    },
    {
      name: "Bob Blockchain",
      role: "Community Lead",
      avatar: "/api/placeholder/80/80",
    },
    {
      name: "Charlie Web3",
      role: "UX Architect",
      avatar: "/api/placeholder/80/80",
    },
  ];

  const recentActivities = [
    {
      icon: <Heart className="w-5 h-5 text-red-500" />,
      description: "New project proposal submitted",
      timestamp: "2h ago",
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      description: "Governance vote initiated",
      timestamp: "5h ago",
    },
    {
      icon: <Globe className="w-5 h-5 text-blue-500" />,
      description: "New community chapter launched",
      timestamp: "1d ago",
    },
  ];

  return (
    <div
      className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900
      min-h-screen p-6 transition-colors duration-300 pt-[100px]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold 
              dark:text-yellow-400 text-yellow-500"
            >
              ABYA Community Hub
            </h1>
            <p className="text-gray-400">Connect, Collaborate, Innovate</p>
          </div>
          <button className="bg-yellow-500 rounded-lg p-2 font-semibold text-cyan-950">
            Join Community
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-800">
          {["Overview", "Discussions", "Members", "Events"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-3 ${
                activeTab === tab.toLowerCase()
                  ? "dark:text-white text-gray-800 border-b-2 border-yellow-500"
                  : "text-gray-500 dark:hover:text-white hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Community Stats */}
          <div
            className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
          >
            <h2 className="text-xl font-semibold mb-4">Community Stats</h2>
            {communityStats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-4">
                {stat.icon}
                <div>
                  <p className="text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Featured Members */}
          <div
            className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
          >
            <h2 className="text-xl font-semibold mb-4">Featured Members</h2>
            {featuredMembers.map((member, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 mb-4 last:mb-0"
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-12 h-12 rounded-full border-2 border-blue-500"
                />
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-400">{member.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activities */}
          <div
            className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
          >
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 mb-4 last:mb-0"
              >
                {activity.icon}
                <div>
                  <p>{activity.description}</p>
                  <p className="text-sm text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
