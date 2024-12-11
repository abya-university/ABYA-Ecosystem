import React, { useState } from "react";
import {
  Wallet,
  LineChart,
  Layers,
  Trophy,
  BarChart2,
  Settings,
  Moon,
  Sun,
} from "lucide-react";

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sample data for demonstration
  const stats = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Total Courses",
      value: "24",
      change: "+5.2%",
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: "Completed Quizzes",
      value: "42",
      change: "+12.5%",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Achievement Points",
      value: "1,256",
      change: "+8.7%",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Learning Streaks",
      value: "14 days",
      change: "+3 days",
    },
  ];

  const recentActivity = [
    {
      course: "Blockchain Basics",
      progress: 75,
      status: "In Progress",
    },
    {
      course: "Smart Contract Development",
      progress: 100,
      status: "Completed",
    },
    {
      course: "Web3 Security",
      progress: 30,
      status: "Started",
    },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
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
              ABYA Learning Dashboard
            </h1>
            <p
              className="
              text-sm 
              dark:text-gray-400 text-gray-600"
            >
              Your blockchain education journey
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
            >
              <div className="flex justify-between items-center transition-all duration-1000">
                <div className="space-y-2">
                  <div className="p-2 rounded-full w-12 h-12 flex items-center justify-center dark:bg-yellow-500 bg-opacity-20 dark:text-white bg-yellow-500 text-yellow-600">
                    {stat.icon}
                  </div>
                  <h3
                    className="first-letter:
                    text-sm font-medium
                    dark:text-gray-400 text-gray-600"
                  >
                    {stat.title}
                  </h3>
                </div>
                <div className="text-right">
                  <p
                    className="
                    text-2xl font-bold 
                    dark:text-white text-gray-900"
                  >
                    {stat.value}
                  </p>
                  <p
                    className={`
                    text-xs 
                    ${
                      stat.change.startsWith("+")
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  `}
                  >
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div
          className="
          p-6 rounded-xl shadow-lg 
              dark:bg-gray-800 dark:border-gray-700
              bg-white border border-gray-200 transition-all duration-1000"
        >
          <h2
            className="
            text-xl font-semibold mb-4
            dark:text-white text-gray-900"
          >
            Recent Learning Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="
                  p-4 rounded-lg 
                  dark:bg-gray-700 bg-opacity-50 bg-gray-100
                  flex items-center justify-between"
              >
                <div>
                  <p
                    className="
                    font-medium
                    dark:text-white text-gray-900"
                  >
                    {activity.course}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 h-2 rounded-full mt-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${activity.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span
                  className={`
                  text-sm font-medium px-3 py-1 rounded-full
                  ${
                    activity.status === "Completed"
                      ? "bg-green-500 bg-opacity-20 text-green-500"
                      : activity.status === "In Progress"
                      ? "bg-yellow-500 bg-opacity-20 text-yellow-500"
                      : "bg-gray-500 bg-opacity-20 text-gray-500"
                  }
                `}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
