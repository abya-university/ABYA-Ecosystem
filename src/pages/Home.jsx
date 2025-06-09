import React, { useState } from "react";
import {
  Globe,
  BookOpen,
  Users,
  Award,
  Play,
  ArrowRight,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import BitcoinLogo from "/bitcoin.svg";
import EthereumLogo from "/ethereum3.svg";
import StellarLogo from "/stellar.svg";
import LitecoinLogo from "/litecoin.svg";
import MoneroLogo from "/monero.svg";
import SolanaLogo from "/solana.svg";
import TronLogo from "/tron.svg";
import WorldcoinLogo from "/worldcoin.svg";
import SkaleLogo from "/skale.svg";
import PolygonLogo from "/polygon.svg";
import AvalancheLogo from "/avalanche.svg";
import ArbitrumLogo from "/arbitrum.svg";
import BinanceLogo from "/binance.svg";
import UniswapLogo from "/uniswap.svg";
import MetamaskLogo from "/metamask.svg";

const BlockchainLogoMarquee = () => {
  const logos = [
    { Logo: BitcoinLogo, name: "Bitcoin" },
    { Logo: EthereumLogo, name: "Ethereum" },
    { Logo: StellarLogo, name: "Stellar" },
    { Logo: LitecoinLogo, name: "Litecoin" },
    { Logo: MoneroLogo, name: "Monero" },
    { Logo: SolanaLogo, name: "Solana" },
    { Logo: TronLogo, name: "Tron" },
    { Logo: WorldcoinLogo, name: "Worldcoin" },
    { Logo: AvalancheLogo, name: "Avalanche" },
    { Logo: ArbitrumLogo, name: "Arbitrum" },
    { Logo: BinanceLogo, name: "Binance" },
    { Logo: UniswapLogo, name: "Uniswap" },
    { Logo: MetamaskLogo, name: "Metamask" },
    { Logo: SkaleLogo, name: "Skale" },
    { Logo: PolygonLogo, name: "Polygon" },
  ];

  return (
    <div className="relative overflow-hidden py-8">
      <div className="animate-marquee flex">
        {[...logos, ...logos].map((logo, index) => (
          <div
            key={index}
            className="flex-shrink-0 mx-8 opacity-50 hover:opacity-100 transition-opacity"
            title={logo.name}
          >
            <img
              src={logo.Logo}
              alt={logo.name}
              className="h-12 w-[120px] grayscale hover:grayscale-0 transition-all"
            />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

const Footer = () => {
  const socialLinks = [
    {
      icon: (
        <Twitter className="text-white hover:text-yellow-500 transition-colors" />
      ),
      href: "https://twitter.com/abya_ecosystem",
    },
    {
      icon: (
        <Linkedin className="text-white hover:text-yellow-500 transition-colors" />
      ),
      href: "https://linkedin.com/company/abya",
    },
    {
      icon: (
        <Github className="text-white hover:text-yellow-500 transition-colors" />
      ),
      href: "https://github.com/abya-ecosystem",
    },
  ];

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Courses", href: "#" },
        { name: "Community", href: "#" },
        { name: "Credentials", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Press", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Terms", href: "#" },
        { name: "Privacy", href: "#" },
        { name: "Cookies", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-black/40 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="text-yellow-500" size={32} />
              <span className="text-2xl font-bold text-yellow-500">ABYA</span>
            </div>
            <p className="text-gray-400 mb-4">
              Revolutionizing education through blockchain and decentralized
              technologies.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h4 className="text-lg font-bold text-white mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Signup */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Stay Updated</h4>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-2 bg-gray-800 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button className="bg-yellow-500 text-black px-4 rounded-r-lg hover:bg-yellow-600 transition-colors">
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Subscribe for the latest ABYA updates and insights
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400">
            © 2024 ABYA Ecosystem. All rights reserved.
            <br />
            Built with ❤️ for a decentralized future.
          </p>
        </div>
      </div>
    </footer>
  );
};

const Home = () => {
  const [activeTab, setActiveTab] = useState("explore");

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-gray-900 to-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-lg">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <Globe className="text-yellow-500" size={32} />
            <span className="text-2xl font-bold text-yellow-500">
              ABYA University
            </span>
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
          <Link
            to="/mainpage"
            className="bg-yellow-500 text-black px-8 py-4 w-[30%] rounded-lg text-xl flex items-center space-x-3 mx-auto hover:bg-yellow-600 transition-colors"
          >
            <span className="text-center mx-auto">Explore Courses</span>
            <ArrowRight size={24} />
          </Link>
        </div>
      </div>

      <BlockchainLogoMarquee />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
