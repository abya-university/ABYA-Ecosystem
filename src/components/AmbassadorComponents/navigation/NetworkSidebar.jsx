import { useState, useEffect, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  LayoutGrid,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Crown,
  Medal,
  Star,
  Award,
  TrendingUp,
  Users,
  Info,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { useUser } from "../../../contexts/userContext";
import { useAmbassadorNetwork } from "../../../contexts/ambassadorNetworkContext";

export default function NetworkSidebar({
  activeSection,
  onSelect,
  sections,
  onSidebarToggle,
}) {
  const { role } = useUser();
  const { ambassadorDetails, fetchAmbassadors } = useAmbassadorNetwork();
  const account = useActiveAccount();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  const roleBadgeMeta =
    role === "Founding Ambassador"
      ? {
          src: "/founding_ambassador.jpg",
          alt: "Founding Ambassador Badge",
          gradient: "from-yellow-500 to-amber-500",
          accent: "from-yellow-500/20 to-amber-500/20",
          border: "border-yellow-500/30",
          text: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-500/10",
          icon: Crown,
        }
      : role === "General Ambassador"
      ? {
          src: "/general_ambassador.jpg",
          alt: "General Ambassador Badge",
          gradient: "from-green-500 to-emerald-500",
          accent: "from-green-500/20 to-emerald-500/20",
          border: "border-green-500/30",
          text: "text-green-600 dark:text-green-400",
          bg: "bg-green-500/10",
          icon: Medal,
        }
      : null;

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      const defaultOpen = !mobile;
      setIsOpen(defaultOpen);
      if (onSidebarToggle) {
        onSidebarToggle(defaultOpen);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onSidebarToggle]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  useEffect(() => {
    if (
      account?.address &&
      (role === "Founding Ambassador" || role === "General Ambassador") &&
      !currentAmbassador
    ) {
      fetchAmbassadors?.().catch((error) => {
        console.error("Failed to refresh ambassador data for sidebar:", error);
      });
    }
  }, [account?.address, role, currentAmbassador, fetchAmbassadors]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[35]"
          onClick={() => {
            setIsOpen(false);
            if (onSidebarToggle) {
              onSidebarToggle(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-24 h-screen lg:h-[calc(100vh-6rem)] 
        shrink-0 rounded-none lg:rounded-2xl border-r lg:border border-white/10 
        bg-white/95 lg:bg-white/80 backdrop-blur-xl transition-all duration-300 
        hover:shadow-xl dark:bg-slate-900/95 dark:lg:bg-slate-900/80 z-[40] lg:z-auto
        ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
        ${isOpen ? "w-72" : "w-20"}
      `}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-2 p-4 transition-all duration-300 ${
            !isOpen && "justify-center"
          }`}
        >
          <div className="rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 p-2 shrink-0">
            <LayoutGrid className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          {isOpen && (
            <div className="overflow-hidden animate-fadeIn">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Navigation
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Ambassador Portal
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`px-2 space-y-1 ${isOpen ? "mt-6" : "mt-8"}`}>
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isHovered = hoveredItem === index;

            return (
              <button
                key={section.id}
                onClick={() => {
                  onSelect(section.id);
                  if (isMobile) {
                    setIsOpen(false);
                    if (onSidebarToggle) {
                      onSidebarToggle(false);
                    }
                  }
                }}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`group relative w-full overflow-hidden rounded-xl transition-all duration-300 ${
                  isOpen ? "px-4 py-3" : "px-2 py-3 flex justify-center"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 shadow-lg shadow-yellow-500/10"
                    : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                }`}
              >
                {/* Animated background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 transition-opacity duration-500 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Active indicator */}
                {isActive && isOpen && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-yellow-500 to-amber-500" />
                )}

                <div
                  className={`relative flex items-center ${
                    !isOpen && "justify-center"
                  }`}
                >
                  <div
                    className={`rounded-lg p-2 transition-all duration-300 shrink-0 ${
                      isActive
                        ? "bg-gradient-to-br from-yellow-500/30 to-amber-500/30 text-yellow-600 dark:text-yellow-400"
                        : "bg-slate-100 text-slate-600 group-hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {isOpen && (
                    <div className="ml-3 flex-1 overflow-hidden animate-fadeIn">
                      <span
                        className={`block text-sm font-semibold ${
                          isActive
                            ? "text-yellow-700 dark:text-yellow-300"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {section.label}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {section.id === "network-dashboard" &&
                          "Track your network"}
                        {section.id === "revenue-portfolio" &&
                          "Manage earnings"}
                        {section.id === "about" && "Learn the program"}
                      </p>
                    </div>
                  )}

                  {/* Active indicator dot for collapsed mode */}
                  {isActive && !isOpen && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Section - Condensed for collapsed mode */}
        <div className={`absolute bottom-4 left-0 right-0 px-4 space-y-3`}>
          {/* Ambassador Badge - Moved to footer */}
          {roleBadgeMeta && (
            <div
              className={`rounded-xl border ${
                roleBadgeMeta.border
              } overflow-hidden transition-all duration-300 ${
                isOpen ? "p-3" : "p-2 flex justify-center"
              }`}
            >
              {isOpen ? (
                <div className="flex items-center gap-3">
                  {/* Badge image with glow effect */}
                  <div className="relative">
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${roleBadgeMeta.gradient} animate-pulse blur-sm`}
                    />
                    <img
                      src={roleBadgeMeta.src}
                      alt={roleBadgeMeta.alt}
                      className="relative h-10 w-10 rounded-full object-cover border-2 border-white/60 dark:border-slate-700 ring-2 ring-white/50 dark:ring-slate-800/50"
                    />
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
                  <div className="flex-1">
                    <p
                      className={`text-xs font-semibold ${roleBadgeMeta.text}`}
                    >
                      {role}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-xs text-slate-500">
                        Level {currentLevel ?? 1}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">
                        {currentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Compact badge for collapsed mode
                <div className="relative">
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${roleBadgeMeta.gradient} animate-pulse blur-sm`}
                  />
                  <img
                    src={roleBadgeMeta.src}
                    alt={roleBadgeMeta.alt}
                    className="relative h-8 w-8 rounded-full object-cover border-2 border-white/60 dark:border-slate-700"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 rounded-full p-0.5 bg-gradient-to-r ${roleBadgeMeta.gradient}`}
                  >
                    {role === "Founding Ambassador" ? (
                      <Crown className="h-2 w-2 text-white" />
                    ) : (
                      <Medal className="h-2 w-2 text-white" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ambassador Tips - Moved to bottom and more compact */}
          <div
            className={`rounded-xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 transition-all duration-300 ${
              isOpen ? "p-4" : "p-2"
            }`}
          >
            <div
              className={`flex items-start gap-3 ${
                !isOpen && "justify-center"
              }`}
            >
              <div className="rounded-lg bg-yellow-500/20 p-2 shrink-0">
                <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              {isOpen && (
                <div className="overflow-hidden animate-fadeIn">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ambassador Tips
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Share your referral link to grow your network faster!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Help Link - New addition */}
          <a
            href="#"
            className={`block rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 ${
              isOpen ? "p-3" : "p-2"
            }`}
          >
            <div
              className={`flex items-center gap-3 ${
                !isOpen && "justify-center"
              }`}
            >
              <div className="rounded-lg bg-slate-200/50 dark:bg-slate-700/50 p-2 shrink-0">
                <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              {isOpen && (
                <div className="overflow-hidden animate-fadeIn">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Help & Support
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Get assistance
                  </p>
                </div>
              )}
            </div>
          </a>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={`fixed top-24 bg-gradient-to-r from-yellow-500 to-amber-500 text-black p-2 rounded-r-lg hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 z-50 lg:hidden
          ${isMobile && !isOpen ? "left-0" : "left-72"}
        `}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </>
  );
}
