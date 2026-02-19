import { useState } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";

export default function NetworkSidebar({ activeSection, onSelect, sections }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <aside className="sticky top-24 h-[calc(100vh-6rem)] hidden w-72 shrink-0 rounded-2xl border border-white/10 bg-white/80 p-4 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:bg-slate-900/80 lg:block">
      <div className="mb-8 flex items-center gap-2">
        <div className="rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 p-2">
          <LayoutGrid className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Navigation
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Ambassador Portal
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
              onClick={() => onSelect(section.id)}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`group relative w-full overflow-hidden rounded-xl px-4 py-3 text-left transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 shadow-lg shadow-yellow-500/10"
                  : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
              }`}
            >
              {/* Animated background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 transition-opacity duration-500 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-yellow-500 to-amber-500" />
              )}

              <div className="relative flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-br from-yellow-500/30 to-amber-500/30 text-yellow-600 dark:text-yellow-400"
                      : "bg-slate-100 text-slate-600 group-hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1">
                  <span
                    className={`text-sm font-semibold ${
                      isActive
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {section.label}
                  </span>

                  {/* Subtle description - you can add descriptions to sections if needed */}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {section.id === "network-dashboard" && "Track your network"}
                    {section.id === "revenue-portfolio" && "Manage earnings"}
                    {section.id === "about" && "Learn the program"}
                  </p>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse" />
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
            <div className="rounded-lg bg-yellow-500/20 p-2">
              <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ambassador Tips
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Share your referral link to grow your network faster!
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
