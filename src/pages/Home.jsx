import React, { useState } from "react";
import { ArrowRight, MoonIcon, SunIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { AbyaConnectButton } from "../providers/Providers";
import BlockchainLogoMarquee from "../components/Homepage Components/BlockchainLogoMarquee";
import Footer from "../components/Homepage Components/Footer";
import HeroSection from "../components/Homepage Components/HeroSection";
import { useDarkMode } from "../contexts/themeContext";
import VantaNetBG from "../components/Homepage Components/VantaJS";

const Home = () => {
  const [activeTab, setActiveTab] = useState("explore");
  const { darkMode, setDarkMode } = useDarkMode();

  return (
    <>
      <VantaNetBG darkMode={darkMode}>
        <div className="min-h-screen bg-transparent text-white">
          {/* Navbar */}
          <nav className="fixed top-3 left-0 right-0 z-50 bg-black/70 backdrop-blur-lg w-[70%] mx-auto rounded-2xl border border-white/10">
            <div className="container mx-auto flex justify-between items-center p-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <img
                    src="/abya_logo.jpg"
                    alt="ABYA Logo"
                    className="w-30 h-10"
                  />
                </div>
              </div>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Explore
                </a>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Courses
                </a>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Community
                </a>
              </div>
              <div className="flex items-center space-x-4 flex-row gap-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-800 text-yellow-500 hover:bg-gray-700"
                      : "bg-blue-50 text-yellow-600 hover:bg-blue-100"
                  }`}
                  aria-label="Toggle theme"
                >
                  {darkMode ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </button>
                <AbyaConnectButton />
              </div>
            </div>
          </nav>

          <HeroSection darkMode={darkMode} />

          {/* Call to Action */}
          <div className="container mx-auto py-16 px-4">
            <div
              className={
                darkMode
                  ? "bg-gradient-to-r from-black/40 via-yellow-500/20 to-black/40 rounded-3xl p-10 text-center"
                  : "bg-gradient-to-r from-yellow-500/20 via-black/40 to-yellow-500/20 rounded-3xl p-10 text-center"
              }
            >
              <h2 className="text-4xl font-bold mb-6">
                Start Your Learning Journey Today
              </h2>
              <p className="text-xl mb-8 text-gray-200">
                Join thousands of learners transforming education with ABYA
              </p>
              <Link
                to="/mainpage"
                className="bg-yellow-500 text-black px-8 py-4 w-[30%] rounded-lg text-xl flex items-center space-x-3 mx-auto hover:bg-yellow-600 transition-colors"
              >
                <span className="text-center mx-auto">Explore Courses</span>
                <ArrowRight size={24} />
              </Link>
            </div>
          </div>

          <BlockchainLogoMarquee darkMode={darkMode} />

          {/* Footer */}
          <Footer darkMode={darkMode} />
        </div>
      </VantaNetBG>
    </>
  );
};

export default Home;
