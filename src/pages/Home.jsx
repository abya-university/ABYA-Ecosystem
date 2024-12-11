import React, { useState } from "react";
import { Globe, BookOpen, Users, Award, Play, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const Home = () => {
  const [activeTab, setActiveTab] = useState("explore");

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-gray-900 to-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-lg">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <Globe className="text-yellow-500" size={32} />
            <span className="text-2xl font-bold text-yellow-500">ABYA</span>
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
          <div className="flex items-center space-x-4">
            {/* <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
              Connect Wallet
            </button> */}
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 relative pt-[200px]">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Decentralized Learning <br />
              <span className="text-yellow-500">Powered by Web3</span>
            </h1>
            <p className="text-xl text-gray-300">
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
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/api/placeholder/600/400"
                alt="ABYA Learning Platform"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Why <span className="text-yellow-500">ABYA</span> Ecosystem?
          </h2>
          <p className="text-xl text-gray-300">
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

      {/* Call to Action */}
      <div className="container mx-auto py-16 px-4">
        <div className="bg-gradient-to-r from-cyan-950 to-yellow-500/20 rounded-3xl p-10 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Start Your Learning Journey Today
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Join thousands of learners transforming education with ABYA
          </p>
          <button className="bg-yellow-500 text-black px-8 py-4 rounded-lg text-xl flex items-center space-x-3 mx-auto hover:bg-yellow-600 transition-colors">
            <span>Explore Courses</span>
            <ArrowRight size={24} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/40 py-8">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            © 2024 ABYA Ecosystem. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
