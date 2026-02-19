import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, Users, Info, Sparkles, ArrowRight } from "lucide-react";
import NetworkNavbar from "../../components/AmbassadorComponents/navigation/NetworkNavbar";
import NetworkSidebar from "../../components/AmbassadorComponents/navigation/NetworkSidebar";
import NetworkDashboard from "./NetworkDashboard";
import RevenuePortfolio from "./RevenuePortfolio";
import AmbassadorAbout from "./AmbassadorAbout";
import { useDarkMode } from "../../contexts/themeContext";

export default function NetworkMainpage() {
  const { darkMode } = useDarkMode();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const sections = useMemo(
    () => [
      {
        id: "network-dashboard",
        label: "Network Dashboard",
        icon: Users,
        component: <NetworkDashboard />,
        description: "Track your network growth and performance",
        color: "yellow",
      },
      {
        id: "revenue-portfolio",
        label: "Revenue & Vesting",
        icon: BarChart3,
        component: <RevenuePortfolio />,
        description: "Manage earnings and vesting schedules",
        color: "green",
      },
      {
        id: "about",
        label: "Program Guide",
        icon: Info,
        component: <AmbassadorAbout />,
        description: "Learn about the ambassador program",
        color: "blue",
      },
    ],
    [],
  );

  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sectionFromUrl = searchParams.get("section");
    if (
      sectionFromUrl &&
      sections.some((section) => section.id === sectionFromUrl)
    ) {
      setActiveSection(sectionFromUrl);
    }
  }, [searchParams, sections]);

  const activeContent =
    sections.find((section) => section.id === activeSection)?.component ||
    sections[0].component;

  const activeSectionData = sections.find((s) => s.id === activeSection);

  const colorVariants = {
    yellow:
      "from-yellow-500/20 to-amber-500/20 text-yellow-600 dark:text-yellow-400",
    green:
      "from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400",
    blue: "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <NetworkNavbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-300 border-t-yellow-500 dark:border-slate-600 dark:border-t-yellow-400"></div>
            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-yellow-500/20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      <NetworkNavbar />

      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-yellow-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[90%] px-4 pt-24 lg:max-w-[85%]">
        {/* Welcome Banner */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-transparent p-6 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 p-3">
                <Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  Welcome to the Ambassador Control Center
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage your network, track earnings, and grow your community
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <span>Active Section:</span>
              <span className="font-semibold">{activeSectionData?.label}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <NetworkSidebar
            activeSection={activeSection}
            onSelect={setActiveSection}
            sections={sections}
          />

          <main className="flex-1 py-4">
            {/* Section Header */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className={`rounded-xl bg-gradient-to-br p-3 ${
                  colorVariants[activeSectionData?.color || "yellow"]
                }`}
              >
                {activeSectionData && (
                  <activeSectionData.icon className="h-5 w-5" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {activeSectionData?.label}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {activeSectionData?.description}
                </p>
              </div>
            </div>

            {/* Content with animation */}
            <div
              key={activeSection}
              className="animate-fadeIn transition-all duration-500"
            >
              <div className="mx-auto max-w-5xl space-y-8">{activeContent}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
