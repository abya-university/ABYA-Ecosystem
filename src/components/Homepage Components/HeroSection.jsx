import { Award, BookOpen, Globe, Play, Users } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

function HeroSection({ darkMode }) {
  return (
    <>
      {/* Hero Section */}
      <div className="container mx-auto px-4 relative pt-[200px]">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1
              className={
                darkMode
                  ? "text-5xl font-bold leading-tight"
                  : "text-5xl text-gray-600 font-bold leading-tight"
              }
            >
              Decentralized Learning <br />
              <span className="text-yellow-500">Powered by Web3</span>
            </h1>
            <p
              className={
                darkMode ? "text-xl text-gray-300" : "text-xl text-gray-600"
              }
            >
              Unlock knowledge, earn credentials, and join a global learning
              ecosystem where education meets blockchain technology.
            </p>
            <div className="flex space-x-4">
              <Link
                to={"/mainpage"}
                className="bg-yellow-500 text-black px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-yellow-600 transition-colors"
              >
                <Play size={24} />
                <span>Get Started</span>
              </Link>
              <button className="border border-yellow-500 text-yellow-500 px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-yellow-500 hover:text-black transition-colors">
                <BookOpen size={24} />
                <span>Learn More</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 bg-yellow-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10 rounded-3xl overflow-hidden ">
              <img
                src="/3D_image.gif"
                alt="ABYA Learning Platform"
                className="w-[350px] h-[350px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className={darkMode ? "text-white" : "text-gray-700"}>
              Why{" "}
            </span>
            <span className="text-yellow-500">ABYA</span>
            <span className={darkMode ? "text-white" : "text-gray-700"}>
              {" "}
              Ecosystem?
            </span>
          </h2>
          <p
            className={
              darkMode ? "text-xl text-gray-300" : "text-xl text-gray-600"
            }
          >
            Revolutionizing education through blockchain and decentralized
            technologies
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Users size={48} />,
              title: "Community-Driven",
              description:
                "Learn, teach, and grow with a global community of educators and learners",
            },
            {
              icon: <Award size={48} />,
              title: "Verifiable Credentials",
              description:
                "Earn blockchain-verified certificates and achievements",
            },
            {
              icon: <Globe size={48} />,
              title: "Decentralized Learning",
              description:
                "Access courses from anywhere, with transparent and fair rewards",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-gray-900/50 p-6 rounded-3xl border border-cyan-900/30 hover:border-yellow-500 transition-all group"
            >
              <div className="text-yellow-500 mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default HeroSection;
