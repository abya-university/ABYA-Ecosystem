import { Award, BookOpen, Globe, Play, Users } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const HeroSection = ({ darkMode }) => {
  return (
    <>
      {/* Hero Section */}
      <div className="container mx-auto px-4 relative pt-32 lg:pt-48">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                <span className="text-yellow-500 text-sm font-medium">
                  Web3 Education Platform
                </span>
              </div>
              <h1
                className={`text-4xl md:text-6xl lg:text-7xl font-bold leading-tight ${
                  darkMode ? "text-white" : "text-cyan-900"
                }`}
              >
                Learn. Earn.
                <span className="text-yellow-500 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  {" "}
                  Own Your Future
                </span>
              </h1>
              <p
                className={`text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto lg:mx-0 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Master blockchain technology through immersive courses, earn
                verifiable credentials, and join the decentralized education
                revolution.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to={"/mainpage"}
                className="group bg-yellow-500 text-black px-8 py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
              >
                <Play
                  size={24}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="text-lg font-semibold">Start Learning</span>
              </Link>
              <button className="group border-2 border-yellow-500 text-yellow-500 px-8 py-4 rounded-2xl flex items-center justify-center space-x-3 hover:bg-yellow-500 hover:text-black transition-all duration-300 transform hover:scale-105">
                <BookOpen
                  size={24}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="text-lg font-semibold">Explore Courses</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/20 to-blue-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative z-10 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
              <img
                src="/3D_image.gif"
                alt="ABYA Learning Platform"
                className="w-full h-auto max-w-2xl mx-auto object-cover transform hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto py-20 lg:py-32 px-4">
        <div className="text-center mb-16 lg:mb-24">
          <h2
            className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-6 ${
              darkMode ? "text-white" : "text-cyan-900"
            }`}
          >
            Why Choose{" "}
            <span className="text-yellow-500 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              ABYA
            </span>
            ?
          </h2>
          <p
            className={`text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Revolutionizing education through cutting-edge blockchain technology
            and decentralized learning ecosystems
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: <Users size={40} />,
              title: "Community-Driven",
              description:
                "Learn, teach, and grow with a global community of educators and learners in our decentralized network",
            },
            {
              icon: <Award size={40} />,
              title: "Verifiable Credentials",
              description:
                "Earn blockchain-verified certificates and achievements that are tamper-proof and universally recognized",
            },
            {
              icon: <Globe size={40} />,
              title: "Decentralized Learning",
              description:
                "Access courses from anywhere in the world with transparent and fair reward systems powered by smart contracts",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="group bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-8 rounded-3xl border border-white/10 hover:border-yellow-500/50 transition-all duration-500 hover:transform hover:-translate-y-2 backdrop-blur-sm"
            >
              <div className="text-yellow-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3
                className={`text-2xl font-bold mb-4 ${
                  darkMode ? "text-white" : "text-cyan-900"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`leading-relaxed ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HeroSection;
