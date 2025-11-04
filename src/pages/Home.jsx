import React, { useState } from "react";
import { ArrowRight, Menu, MoonIcon, SunIcon, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <VantaNetBG darkMode={darkMode}>
      <div className="min-h-screen bg-transparent">
        {/* Enhanced Navbar */}
        <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] lg:w-[70%]">
          <div
            className={`backdrop-blur-xl rounded-2xl border ${
              darkMode
                ? "bg-black/40 border-white/10"
                : "bg-white/20 border-white/20"
            } shadow-2xl`}
          >
            <div className="container mx-auto flex justify-between items-center p-4">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <img
                  src="/abya_logo.jpg"
                  alt="ABYA Logo"
                  className="w-24 h-10 rounded-lg"
                />
                {/* <span
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  ABYA
                </span> */}
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex space-x-8">
                {["Explore", "Courses", "Community", "About"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className={`font-medium transition-all duration-300 hover:text-yellow-500 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {item}
                  </a>
                ))}
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                {/* Theme Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                    darkMode
                      ? "bg-gray-800 text-yellow-500 hover:bg-gray-700"
                      : "bg-white/20 text-yellow-600 hover:bg-white/30"
                  }`}
                  aria-label="Toggle theme"
                >
                  {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
                </button>

                {/* Connect Button */}
                <div className="hidden sm:block">
                  <AbyaConnectButton />
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden p-3 rounded-xl transition-all duration-300"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X
                      size={24}
                      className={darkMode ? "text-yellow-500" : "text-gray-800"}
                    />
                  ) : (
                    <Menu
                      size={24}
                      className={darkMode ? "text-yellow-500" : "text-gray-800"}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div
                className={`lg:hidden border-t ${
                  darkMode ? "border-white/10" : "border-white/20"
                } p-4`}
              >
                <div className="flex flex-col space-y-4">
                  {["Explore", "Courses", "Community", "About"].map((item) => (
                    <a
                      key={item}
                      href="#"
                      className={`py-3 px-4 rounded-xl transition-all duration-300 ${
                        darkMode
                          ? "text-gray-300 hover:bg-gray-800 hover:text-yellow-500"
                          : "text-gray-700 hover:bg-white/30 hover:text-yellow-600"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item}
                    </a>
                  ))}
                  <div className="pt-4 border-t border-white/10">
                    <AbyaConnectButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <HeroSection darkMode={darkMode} />

          {/* Blockchain Partners Section */}
          <div className="py-16 lg:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h3
                  className={`text-2xl lg:text-4xl font-bold mb-4 ${
                    darkMode ? "text-white" : "text-cyan-900"
                  }`}
                >
                  Trusted by Leading Blockchain Ecosystems
                </h3>
                <p
                  className={`text-lg ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Integrated with the most innovative blockchain platforms
                </p>
              </div>
              <BlockchainLogoMarquee darkMode={darkMode} />
            </div>
          </div>

          {/* CTA Section */}
          <div className="container mx-auto py-16 lg:py-24 px-4">
            <div
              className={`rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden ${
                darkMode
                  ? "bg-gradient-to-r from-gray-900/50 via-yellow-500/10 to-gray-900/50"
                  : "bg-gradient-to-r from-white/20 via-yellow-500/20 to-white/20"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-blue-500/5 rounded-3xl"></div>
              <div className="relative z-10">
                <h2
                  className={
                    darkMode
                      ? "text-3xl lg:text-5xl text-gray-100 font-bold mb-6"
                      : "text-3xl lg:text-5xl font-bold mb-6 text-cyan-900"
                  }
                >
                  Ready to Transform Your Learning?
                </h2>
                <p
                  className={`text-xl lg:text-2xl mb-8 max-w-2xl mx-auto ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Join thousands of learners who are already building the future
                  with ABYA
                </p>
                <Link
                  to="/mainpage"
                  className="group bg-yellow-500 text-black px-8 lg:px-12 py-4 lg:py-6 rounded-2xl text-lg lg:text-xl font-semibold inline-flex items-center space-x-3 hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
                >
                  <span>Start Your Journey Now</span>
                  <ArrowRight
                    size={24}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer darkMode={darkMode} />
      </div>
    </VantaNetBG>
  );
};

export default Home;
