import { Link, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, X, Home, BookOpen, UsersRound } from "lucide-react";
import { useState, useEffect } from "react";
import { useDarkMode } from "../../../contexts/themeContext";
import ErrorBoundary from "../../ErrorBoundary";
import WalletConnection from "../../WalletConnection";

export default function FinanceNavbar() {
  const { darkMode, setDarkMode } = useDarkMode();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = () => {
    if (menuOpen) setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-lg dark:bg-slate-900/90"
          : "bg-white/70 backdrop-blur-xl dark:bg-slate-900/70"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Link
            to="/liquidityMainpage"
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <img
                src="/abya_logo.jpg"
                alt="ABYA Logo"
                className="h-10 w-16 rounded-xl object-cover ring-0 ring-blue-500/20 transition-all duration-300 group-hover:ring-blue-500/40"
              />
              <div className="absolute -top-1 -right-1">
                <div className="relative">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-ping opacity-75" />
                  <div className="absolute inset-0 h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 ml-6">
            <Link
              to="/"
              onClick={handleLinkClick}
              className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                isActive("/")
                  ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
              {isActive("/") && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              )}
            </Link>
            <Link
              to="/mainpage"
              onClick={handleLinkClick}
              className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                isActive("/mainpage")
                  ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>LMS</span>
              {isActive("/mainpage") && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              )}
            </Link>
            {/* //link to ambassador page */}
            <Link
              to="/networkMainpage"
              onClick={handleLinkClick}
              className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                isActive("/networkMainpage")
                  ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              <UsersRound className="h-4 w-4" />
              <span>Ambassadors</span>
              {isActive("/networkMainpage") && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              )}
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Wallet Connection */}
          <div className="hidden md:block">
            <ErrorBoundary>
              <WalletConnection />
            </ErrorBoundary>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="group relative rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-cyan-500/0 transition-all duration-300 group-hover:from-blue-500/20 group-hover:to-cyan-500/20" />
            <div className="relative">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </div>
          </button>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="group relative rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-cyan-500/0 transition-all duration-300 group-hover:from-blue-500/20 group-hover:to-cyan-500/20" />
              <div className="relative">
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex flex-col gap-2 px-4 py-6">
            <Link
              to="/"
              onClick={handleLinkClick}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 dark:text-slate-200"
            >
              <Home className="h-5 w-5 text-slate-500" />
              <span>Home</span>
            </Link>

            <Link
              to="/mainpage"
              onClick={handleLinkClick}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 dark:text-slate-200"
            >
              <BookOpen className="h-5 w-5 text-slate-500" />
              <span>LMS</span>
            </Link>

            <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-800">
              <ErrorBoundary>
                <WalletConnection />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
