import { useState, useEffect } from "react";
import { LayoutGrid, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

export default function FinanceSidebar({
  activeSection,
  onSelect,
  sections,
  onSidebarToggle,
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);

      // Set default open state based on screen size
      const defaultOpen = !mobile;
      setIsOpen(defaultOpen);

      // Notify parent component
      if (onSidebarToggle) {
        onSidebarToggle(defaultOpen);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [onSidebarToggle]);

  // Handle toggle
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  return (
    <>
      {/* Mobile Overlay - Close sidebar when clicking outside */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
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
        className={`fixed lg:sticky top-0 lg:top-24 h-screen lg:h-[calc(100vh-6rem)] w-72 shrink-0 
        rounded-none lg:rounded-2xl border-r lg:border border-white/10 bg-white/95 lg:bg-white/80 
        p-4 backdrop-blur-xl transition-all duration-300 hover:shadow-xl 
        dark:bg-slate-900/95 dark:lg:bg-slate-900/80 z-50 lg:z-auto
        ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
      `}
      >
        <div className="mb-8 flex items-center gap-2 mt-2">
          <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-2">
            <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Navigation
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Finance Center
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isHovered = hoveredItem === index;

            return (
              <button
                key={section.id}
                onClick={() => {
                  onSelect(section.id);
                  // Auto-close sidebar on mobile after selection
                  if (isMobile) {
                    setIsOpen(false);
                    if (onSidebarToggle) {
                      onSidebarToggle(false);
                    }
                  }
                }}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`group relative w-full overflow-hidden rounded-xl px-4 py-3 text-left transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 shadow-lg shadow-blue-500/10"
                    : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                }`}
              >
                {/* Animated background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 transition-opacity duration-500 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-cyan-500" />
                )}

                <div className="relative flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-br from-blue-500/30 to-cyan-500/30 text-blue-600 dark:text-blue-400"
                        : "bg-slate-100 text-slate-600 group-hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <span
                      className={`text-sm font-semibold ${
                        isActive
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {section.label}
                    </span>

                    {/* Subtle description - you can add descriptions to sections if needed */}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {section.id === "finance-dashboard" &&
                        "Overview & insights"}
                      {section.id === "portfolio" && "Manage holdings"}
                      {section.id === "liquidity" && "Liquidity details"}
                      {section.id === "analytics" && "Analytics & reports"}
                    </p>
                  </div>

                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer section */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-xl bg-gradient-to-br from-slate-100 to-white p-4 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Finance Tips
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Monitor your portfolio and track liquidity metrics!
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Toggle Button - Moves with sidebar */}
      <button
        onClick={handleToggle}
        className={`fixed top-24 bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 transition-all duration-300 z-50 lg:hidden
          ${isMobile && !isOpen ? "left-0" : "left-72"}
        `}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </>
  );
}
