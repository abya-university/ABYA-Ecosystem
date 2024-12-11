import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Dashboard from "./Dashboard";
import CourseCreationPipeline from "../components/courseCreationPipeline";
import Navbar from "../components/Navbar";
import AchievementsPage from "./Achievements";
import CommunityPage from "./Community";
import SettingsPage from "./Settings";

const MasterPage = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [theme, setTheme] = useState("dark");

  // 3D Illuminated Element Component
  const IlluminatedObject = ({ position, size, color, blur }) => (
    <div
      className={`absolute rounded-full ${position} ${size} ${color} 
        opacity-20 blur-${blur} animate-pulse`}
      style={{
        boxShadow:
          theme === "dark"
            ? "0 0 50px rgba(255,255,255,0.3), 0 0 100px rgba(255,255,255,0.2)"
            : "0 0 50px rgba(0,0,0,0.1), 0 0 100px rgba(0,0,0,0.05)",
        transform: "translateZ(20px)",
      }}
    />
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "create-course":
        return <CourseCreationPipeline />;
      case "achievements":
        return <AchievementsPage />;
      case "community":
        return <CommunityPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div
      className="
        min-h-screen flex relative overflow-hidden bg-gradient-to-br from-[#ffffff] via-[#f0f4f8] to-[#ffffff] dark:bg-gradient-to-br dark:from-[#0a192f] dark:via-[#112240] dark:to-[#0a192f] transition-all duration-1000"
    >
      {/* Illuminated Background Elements */}
      {theme === "dark" ? (
        <>
          <IlluminatedObject
            position="top-10 left-10"
            size="w-64 h-64"
            color="bg-blue-500"
            blur="xl"
          />
          <IlluminatedObject
            position="bottom-20 right-20"
            size="w-48 h-48"
            color="bg-purple-500"
            blur="lg"
          />
          <IlluminatedObject
            position="top-1/2 left-1/3"
            size="w-32 h-32"
            color="bg-green-500"
            blur="md"
          />
        </>
      ) : (
        <>
          <IlluminatedObject
            position="top-10 left-10"
            size="w-64 h-64"
            color="bg-blue-200"
            blur="xl"
          />
          <IlluminatedObject
            position="bottom-20 right-20"
            size="w-48 h-48"
            color="bg-purple-200"
            blur="lg"
          />
          <IlluminatedObject
            position="top-1/2 left-1/3"
            size="w-32 h-32"
            color="bg-green-200"
            blur="md"
          />
        </>
      )}

      <Navbar />

      {/* Sidebar and Main Content */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="flex-grow p-6 z-10 relative">{renderContent()}</main>
    </div>
  );
};

export default MasterPage;
