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
  Coins,
  Crown,
  Medal,
  Star,
  Zap,
  Wallet,
  User,
  LogOut,
  Settings,
  Bell,
  HelpCircle,
  ChevronDown,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  Network,
  Shield,
  Gift,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
} from "thirdweb/react";
import { useDarkMode } from "../../../contexts/themeContext";
import { useUser } from "../../../contexts/userContext";
import { useAmbassadorNetwork } from "../../../contexts/ambassadorNetworkContext";
import ErrorBoundary from "../../ErrorBoundary";
import WalletConnection from "../../WalletConnection";
import { useProfile } from "../../../contexts/ProfileContext";

export default function NetworkNavbar() {
  const { darkMode, setDarkMode } = useDarkMode();
  const { role } = useUser();
  const { ambassadorDetails, fetchAmbassadors } = useAmbassadorNetwork();
  const account = useActiveAccount();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();
  const { clearProfile, profile, hasProfile } = useProfile();

  const currentAmbassador = useMemo(() => {
    if (!account?.address || !Array.isArray(ambassadorDetails)) return null;
    return (
      ambassadorDetails.find(
        (ambassador) =>
          ambassador.address?.toLowerCase() === account.address.toLowerCase(),
      ) || null
    );
  }, [account?.address, ambassadorDetails]);

  const currentLevel =
    currentAmbassador?.level !== undefined && currentAmbassador?.level !== null
      ? Number(currentAmbassador.level)
      : null;

  const currentStatus =
    currentAmbassador?.isActive === true ? "Active" : "Inactive";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  const signOut = () => {
    disconnect(wallet);
    setShowUserMenu(false);
    setShowNotifications(false);
    if (hasProfile) {
      clearProfile();
    }
  };

  useEffect(() => {
    if (
      account?.address &&
      (role === "Founding Ambassador" || role === "General Ambassador") &&
      !currentAmbassador
    ) {
      fetchAmbassadors?.().catch((error) => {
        console.error("Failed to refresh ambassador data for navbar:", error);
      });
    }
  }, [account?.address, role, currentAmbassador, fetchAmbassadors]);

  const handleLinkClick = () => {
    if (menuOpen) setMenuOpen(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  };

  const isActive = (path) => location.pathname === path;

  const roleBadgeMeta =
    role === "Founding Ambassador"
      ? {
          src: "/founding_ambassador.jpg",
          alt: "Founding Ambassador Badge",
          border: "border-yellow-500/60",
          gradient: "from-yellow-500 to-amber-500",
          icon: Crown,
          bgLight: "bg-yellow-500/10",
          text: "text-yellow-600 dark:text-yellow-400",
          bgDark: "bg-yellow-500/20",
        }
      : role === "General Ambassador"
      ? {
          src: "/general_ambassador.jpg",
          alt: "General Ambassador Badge",
          border: "border-green-500/60",
          gradient: "from-green-500 to-emerald-500",
          icon: Medal,
          bgLight: "bg-green-500/10",
          text: "text-green-600 dark:text-green-400",
          bgDark: "bg-green-500/20",
        }
      : null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg dark:bg-slate-900/95 border-b border-slate-200/50 dark:border-slate-800/50"
            : "bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:px-6">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Link
              to="/networkMainpage"
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                {/* Animated logo container */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative">
                  <img
                    src="/abya_logo.jpg"
                    alt="ABYA Logo"
                    className="h-10 w-16 rounded-xl object-cover ring-2 ring-yellow-500/20 transition-all duration-300 group-hover:ring-yellow-500/40 group-hover:scale-105"
                  />
                  {/* Animated ping dot */}
                  <div className="absolute -top-1 -right-1">
                    <div className="relative">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-ping opacity-75" />
                      <div className="absolute inset-0 h-3 w-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand text - hidden on mobile, shown on desktop */}
              <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Ambassador Network
                </p>
                <p className="text-base font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Control Center
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 ml-6">
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

              <Link
                to="/liquidityMainpage"
                onClick={handleLinkClick}
                className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive("/liquidityMainpage")
                    ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/50"
                }`}
              >
                <Coins className="h-4 w-4" />
                <span>Finance & Liquidity</span>
                {isActive("/liquidityMainpage") && (
                  <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                )}
              </Link>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Role Badge - Enhanced */}
            {role && roleBadgeMeta && (
              <div className="hidden lg:block">
                <div
                  className={`group relative flex items-center gap-3 rounded-2xl px-4 py-2 ${
                    role === "Founding Ambassador"
                      ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30"
                      : "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
                  }`}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Badge image with ring */}
                  <div className="relative">
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${roleBadgeMeta.gradient} animate-pulse blur-sm`}
                    />
                    <img
                      src={roleBadgeMeta.src}
                      alt={roleBadgeMeta.alt}
                      className={`relative h-8 w-8 rounded-full object-cover border-2 ${roleBadgeMeta.border} ring-2 ring-white/50 dark:ring-slate-800/50`}
                    />
                    {/* Tier indicator */}
                    <div
                      className={`absolute -bottom-1 -right-1 rounded-full p-0.5 bg-gradient-to-r ${roleBadgeMeta.gradient}`}
                    >
                      {role === "Founding Ambassador" ? (
                        <Crown className="h-2.5 w-2.5 text-white" />
                      ) : (
                        <Medal className="h-2.5 w-2.5 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Role info */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-bold ${roleBadgeMeta.text}`}
                      >
                        {role}
                      </span>
                      <CheckCircle
                        className={`h-3.5 w-3.5 ${roleBadgeMeta.text}`}
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span>Level {currentLevel ?? 1}</span>
                      <span>•</span>
                      <span>{currentStatus}</span>
                    </div>
                  </div>

                  {/* Sparkle icon */}
                  <Sparkles
                    className={`h-3 w-3 ${roleBadgeMeta.text} opacity-50 group-hover:opacity-100 transition-opacity`}
                  />
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="group relative rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-yellow-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-amber-500/0 transition-all duration-300 group-hover:from-yellow-500/20 group-hover:to-amber-500/20" />
                <Bell className="relative h-4 w-4" />
                {/* Notification dot */}
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-700 dark:bg-slate-900/95 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold">Notifications</p>
                  </div>
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {[1, 2, 3].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="rounded-lg bg-blue-500/10 p-2">
                          <Gift className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            New Commission Earned
                          </p>
                          <p className="text-xs text-slate-500">
                            2 minutes ago
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Connection */}
            <div className="hidden lg:block">
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

            {/* User Menu */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="group relative rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-yellow-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-amber-500/0 transition-all duration-300 group-hover:from-yellow-500/20 group-hover:to-amber-500/20" />
                <User className="relative h-4 w-4" />
              </button>

              {/* User menu dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-700 dark:bg-slate-900/95 overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500">
                      ACCOUNT
                    </p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm">
                      <HelpCircle className="h-4 w-4" />
                      <span>Help</span>
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
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
      </nav>

      {/* Mobile Menu Overlay - Outside nav for proper stacking */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-[73px] bg-black/50 backdrop-blur-sm lg:hidden z-[55]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Menu - Outside nav for proper stacking */}
      {menuOpen && (
        <div className="fixed top-[73px] left-0 right-0 bottom-0 lg:hidden bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 z-[60] overflow-y-auto animate-slideIn">
          <div className="flex flex-col p-4 space-y-4">
            {/* Mobile Role Badge - Enhanced */}
            {role && roleBadgeMeta && (
              <div
                className={`flex items-center gap-4 rounded-2xl p-4 ${
                  role === "Founding Ambassador"
                    ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30"
                    : "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
                }`}
              >
                <div className="relative">
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${roleBadgeMeta.gradient} animate-pulse blur-md`}
                  />
                  <img
                    src={roleBadgeMeta.src}
                    alt={roleBadgeMeta.alt}
                    className={`relative h-12 w-12 rounded-full object-cover border-2 ${roleBadgeMeta.border} ring-2 ring-white/50 dark:ring-slate-800/50`}
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 rounded-full p-1 bg-gradient-to-r ${roleBadgeMeta.gradient}`}
                  >
                    {role === "Founding Ambassador" ? (
                      <Crown className="h-3 w-3 text-white" />
                    ) : (
                      <Medal className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-base font-bold ${roleBadgeMeta.text}`}
                    >
                      {role}
                    </span>
                    <CheckCircle className={`h-4 w-4 ${roleBadgeMeta.text}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-xs text-slate-500">
                        Level {currentLevel ?? 1}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">•</span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          currentStatus === "Active"
                            ? "bg-green-500 animate-pulse"
                            : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs text-slate-500">
                        {currentStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <Sparkles
                  className={`h-4 w-4 ${roleBadgeMeta.text} opacity-50`}
                />
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-amber-500/10 dark:text-slate-200"
              >
                <div
                  className={`rounded-lg p-2 ${
                    isActive("/")
                      ? "bg-yellow-500/20"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <Home
                    className={`h-4 w-4 ${
                      isActive("/") ? "text-yellow-600" : "text-slate-500"
                    }`}
                  />
                </div>
                <span className="flex-1">Home</span>
                {isActive("/") && (
                  <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
              </Link>

              <Link
                to="/mainpage"
                onClick={handleLinkClick}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-amber-500/10 dark:text-slate-200"
              >
                <div
                  className={`rounded-lg p-2 ${
                    isActive("/mainpage")
                      ? "bg-yellow-500/20"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <BookOpen
                    className={`h-4 w-4 ${
                      isActive("/mainpage")
                        ? "text-yellow-600"
                        : "text-slate-500"
                    }`}
                  />
                </div>
                <span className="flex-1">LMS</span>
                {isActive("/mainpage") && (
                  <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
              </Link>

              <Link
                to="/liquidityMainpage"
                onClick={handleLinkClick}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 dark:text-slate-200"
              >
                <div
                  className={`rounded-lg p-2 ${
                    isActive("/liquidityMainpage")
                      ? "bg-blue-500/20"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <Coins
                    className={`h-4 w-4 ${
                      isActive("/liquidityMainpage")
                        ? "text-blue-600"
                        : "text-slate-500"
                    }`}
                  />
                </div>
                <span className="flex-1">Finance & Liquidity</span>
                {isActive("/liquidityMainpage") && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </Link>
            </div>

            {/* Mobile Wallet & Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <ErrorBoundary>
                  <WalletConnection />
                </ErrorBoundary>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              </div>

              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
