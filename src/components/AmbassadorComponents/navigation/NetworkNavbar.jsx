import { Link } from "react-router-dom";
import { Menu, Moon, Sun, X, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useDarkMode } from "../../../contexts/themeContext";
import { useUser } from "../../../contexts/userContext";
import ErrorBoundary from "../../ErrorBoundary";
import WalletConnection from "../../WalletConnection";

export default function NetworkNavbar() {
  const { darkMode, setDarkMode } = useDarkMode();
  const { role } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = () => {
    if (menuOpen) setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/70 backdrop-blur-xl dark:bg-slate-900/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/abya_logo.jpg"
            alt="ABYA Logo"
            className="h-9 w-16 rounded-lg object-cover"
          />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Ambassador Network
            </p>
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              Control Center
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/"
            className="text-sm font-semibold text-slate-600 hover:text-yellow-500 dark:text-slate-300"
          >
            Home
          </Link>
          <Link
            to="/mainpage"
            className="text-sm font-semibold text-slate-600 hover:text-yellow-500 dark:text-slate-300"
          >
            LMS
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {role &&
            (role === "Founding Ambassador" ||
              role === "General Ambassador") && (
              <div
                className={`hidden rounded-lg px-3 py-1.5 text-xs font-semibold md:flex items-center gap-2 ${
                  role === "Founding Ambassador"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                }`}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {role}
              </div>
            )}
          <div className="hidden md:block">
            <ErrorBoundary>
              <WalletConnection />
            </ErrorBoundary>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-700 shadow-sm transition hover:text-yellow-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-md p-2 transition hover:bg-slate-200/60 dark:hover:bg-slate-800"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? (
                <X
                  size={20}
                  className={darkMode ? "text-yellow-500" : "text-slate-800"}
                />
              ) : (
                <Menu
                  size={20}
                  className={darkMode ? "text-yellow-500" : "text-slate-800"}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200/70 bg-white/90 shadow-lg dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-2 px-4 py-4">
            <Link
              to="/"
              onClick={handleLinkClick}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Home
            </Link>
            <Link
              to="/mainpage"
              onClick={handleLinkClick}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              LMS
            </Link>
            <div className="mt-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
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
