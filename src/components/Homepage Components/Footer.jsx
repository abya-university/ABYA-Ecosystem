import { Github, Linkedin, Send, Twitter } from "lucide-react";
import AbyaLogo from "../../assets/abya.svg";
import { FaDiscord } from "react-icons/fa6";

const Footer = ({ darkMode }) => {
  const socialLinks = [
    {
      icon: <Twitter className="w-5 h-5" />,
      href: "https://twitter.com/abya_ecosystem",
    },
    {
      icon: <Linkedin className="w-5 h-5" />,
      href: "https://linkedin.com/company/abya",
    },
    {
      icon: <Github className="w-5 h-5" />,
      href: "https://github.com/abya-ecosystem",
    },
    {
      icon: <FaDiscord className="w-5 h-5" />,
      href: "https://discord.gg/p5EG7nB6",
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
    <footer
      className={`py-16 lg:py-20 ${
        darkMode ? "bg-black/30" : "bg-white/10"
      } backdrop-blur-sm`}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <img
                src="/abya_logo.jpg"
                alt="ABYA Logo"
                className="w-24 h-12 rounded-lg"
              />
              {/* <span className="text-2xl font-bold text-yellow-500">ABYA</span> */}
            </div>
            <p
              className={`mb-6 leading-relaxed ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Revolutionizing education through blockchain and decentralized
              technologies for a better learning future.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                    darkMode
                      ? "bg-gray-800 text-white hover:bg-yellow-500 hover:text-black"
                      : "bg-white/20 text-gray-700 hover:bg-yellow-500 hover:text-black"
                  }`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h4
                className={`text-lg font-bold mb-6 ${
                  darkMode ? "text-white" : "text-cyan-900"
                }`}
              >
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className={`transition-all duration-300 hover:text-yellow-500 ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
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
            <h4
              className={`text-lg font-bold mb-6 ${
                darkMode ? "text-white" : "text-cyan-900"
              }`}
            >
              Stay Updated
            </h4>
            <div className="flex mb-3">
              <input
                type="email"
                placeholder="Enter your email"
                className={`flex-1 p-4 rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  darkMode
                    ? "bg-gray-800 text-white placeholder-gray-400"
                    : "bg-white/20 text-gray-900 placeholder-gray-600"
                }`}
              />
              <button className="bg-yellow-500 text-black px-6 rounded-r-2xl hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105">
                <Send size={20} />
              </button>
            </div>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-500" : "text-gray-600"
              }`}
            >
              Subscribe for the latest ABYA updates and insights
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div
          className={`border-t mt-12 pt-8 text-center ${
            darkMode
              ? "border-gray-800 text-gray-400"
              : "border-gray-300 text-gray-600"
          }`}
        >
          <p>
            © 2025 ABYA Ecosystem. All rights reserved.
            <br />
            Built with ❤️ for a decentralized future.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
