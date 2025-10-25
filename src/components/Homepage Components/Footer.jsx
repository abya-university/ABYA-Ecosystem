import { Github, Linkedin, Send, Twitter } from "lucide-react";
import AbyaLogo from "../../assets/abya.svg";

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
              <div className="flex items-center space-x-2">
                <img src={AbyaLogo} alt="ABYA Logo" className="w-30 h-10" />
                <span className="text-2xl font-bold text-yellow-500">ABYA</span>
              </div>
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

export default Footer;
