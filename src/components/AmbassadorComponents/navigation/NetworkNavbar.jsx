import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Moon,
  Sun,
  X,
  CheckCircle,
  Sparkles,
  Home,
  BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDarkMode } from "../../../contexts/themeContext";
import { useUser } from "../../../contexts/userContext";
import ErrorBoundary from "../../ErrorBoundary";
import WalletConnection from "../../WalletConnection";

export default function NetworkNavbar() {
  const { darkMode, setDarkMode } = useDarkMode();
  const { role } = useUser();
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
          <Link to="/networkMainpage" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/abya_logo.jpg"
                alt="ABYA Logo"
                className="h-10 w-16 rounded-xl object-cover ring-0 ring-yellow-500/20 transition-all duration-300 group-hover:ring-yellow-500/40"
              />
              <div className="absolute -top-1 -right-1">
                <div className="relative">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-ping opacity-75" />
                  <div className="absolute inset-0 h-3 w-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500" />
                </div>
              </div>
            </div>
            {/* <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Ambassador Network
              </p>
              <p className="text-base font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Control Center
              </p>
            </div> */}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 ml-6">
            <Link
              to="/"
              onClick={handleLinkClick}
              className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                isActive("/")
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-700 dark:text-yellow-300"
                  : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
              {isActive("/") && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500" />
              )}
            </Link>
            <Link
              to="/mainpage"
              onClick={handleLinkClick}
              className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                isActive("/mainpage")
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-700 dark:text-yellow-300"
                  : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/50"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>LMS</span>
              {isActive("/mainpage") && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500" />
              )}
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Role Badge */}
          {role &&
            (role === "Founding Ambassador" ||
              role === "General Ambassador") && (
              <div
                className={`group relative hidden md:flex items-center gap-2 rounded-xl px-4 py-2 ${
                  role === "Founding Ambassador"
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
                    : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                }`}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CheckCircle
                  className={`h-4 w-4 ${
                    role === "Founding Ambassador"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    role === "Founding Ambassador"
                      ? "text-yellow-700 dark:text-yellow-300"
                      : "text-green-700 dark:text-green-300"
                  }`}
                >
                  {role}
                </span>
                <Sparkles
                  className={`h-3 w-3 ${
                    role === "Founding Ambassador"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                />
              </div>
            )}

          {/* Wallet Connection */}
          <div className="hidden md:block">
            <ErrorBoundary>
              <WalletConnection />
            </ErrorBoundary>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="group relative rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-yellow-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-amber-500/0 transition-all duration-300 group-hover:from-yellow-500/20 group-hover:to-amber-500/20" />
            <div className="relative">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </div>
          </button>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="group relative rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-yellow-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-amber-500/0 transition-all duration-300 group-hover:from-yellow-500/20 group-hover:to-amber-500/20" />
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
            {/* Mobile Role Badge */}
            {role &&
              (role === "Founding Ambassador" ||
                role === "General Ambassador") && (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-2 ${
                    role === "Founding Ambassador"
                      ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
                      : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                  }`}
                >
                  <CheckCircle
                    className={`h-5 w-5 ${
                      role === "Founding Ambassador"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  />
                  <span
                    className={`flex-1 text-sm font-semibold ${
                      role === "Founding Ambassador"
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-green-700 dark:text-green-300"
                    }`}
                  >
                    {role}
                  </span>
                  <Sparkles
                    className={`h-4 w-4 ${
                      role === "Founding Ambassador"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  />
                </div>
              )}

            <Link
              to="/"
              onClick={handleLinkClick}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-amber-500/10 dark:text-slate-200"
            >
              <Home className="h-5 w-5 text-slate-500" />
              <span>Home</span>
            </Link>

            <Link
              to="/mainpage"
              onClick={handleLinkClick}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-amber-500/10 dark:text-slate-200"
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
