import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  Settings,
  Video,
  Trophy,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Sidebar = ({ setActiveSection }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const sidebarItems = [
    {
      section: "Main",
      items: [
        {
          icon: <Home size={24} />,
          name: "Dashboard",
          path: "/dashboard",
          section: "dashboard",
        },
        {
          icon: <BookOpen size={24} />,
          name: "Courses",
          path: "/courses",
          section: "courses",
        },
        {
          icon: <Video size={24} />,
          name: "Learning Path",
          path: "/learning-path",
          section: "learning-path",
        },
      ],
    },
    {
      section: "Community",
      items: [
        {
          icon: <Users size={24} />,
          name: "Community",
          path: "/community",
          section: "community",
        },
        {
          icon: <MessageCircle size={24} />,
          name: "Discussions",
          path: "/discussions",
          section: "discussions",
        },
        {
          icon: <Trophy size={24} />,
          name: "Achievements",
          path: "/achievements",
          section: "achievements",
        },
      ],
    },
    {
      section: "Account",
      items: [
        {
          icon: <Settings size={24} />,
          name: "Settings",
          path: "/settings",
          section: "settings",
        },
      ],
    },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-100 dark:bg-gray-900 shadow-lg shadow-white transition-all duration-300 z-40 
      ${isExpanded ? "w-64" : "w-20"} pt-20`}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="top-4 left-[200px] bg-yellow-500 text-black relative p-2 rounded-full hover:bg-yellow-600 transition-colors"
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar Content */}
      <div className="px-4 mt-4">
        {sidebarItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {isExpanded && (
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                {section.section}
              </h3>
            )}
            {section.items.map((item, itemIndex) => (
              <Link
                key={itemIndex}
                to="/mainpage"
                className={`flex items-center py-3 px-4 rounded-lg transition-all duration-300 
                  hover:bg-yellow-500/10 dark:hover:bg-yellow-500/20 group
                  ${isExpanded ? "justify-start" : "justify-center"}`}
                onClick={() => setActiveSection(item.section)}
              >
                <div
                  className={` dark:text-white
                  ${isExpanded ? "mr-4" : "tooltip tooltip-right"}`}
                  data-tip={!isExpanded ? item.name : ""}
                >
                  {item.icon}
                </div>
                {isExpanded && (
                  <span className="text-gray-700 dark:text-gray-200 group-hover:text-yellow-600">
                    {item.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom Section - Creator Mode */}
      {isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg p-4 text-center">
            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              Creator Mode
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
              Start creating and sharing your courses
            </p>
            <Link
              to="/mainpage"
              className="w-full bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-600 transition-colors block"
              onClick={() => setActiveSection("create-course")}
            >
              Create Course
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
