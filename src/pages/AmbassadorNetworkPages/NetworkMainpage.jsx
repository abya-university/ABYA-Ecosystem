import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, Users } from "lucide-react";
import NetworkNavbar from "../../components/AmbassadorComponents/navigation/NetworkNavbar";
import NetworkSidebar from "../../components/AmbassadorComponents/navigation/NetworkSidebar";
import NetworkDashboard from "./NetworkDashboard";
import RevenuePortfolio from "./RevenuePortfolio";

export default function NetworkMainpage() {
  const [searchParams] = useSearchParams();
  const sections = useMemo(
    () => [
      {
        id: "network-dashboard",
        label: "Network",
        icon: Users,
        component: <NetworkDashboard />,
      },
      {
        id: "revenue-portfolio",
        label: "Revenue Sharing",
        icon: BarChart3,
        component: <RevenuePortfolio />,
      },
    ],
    [],
  );

  const [activeSection, setActiveSection] = useState(sections[0].id);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      <NetworkNavbar />

      <div className="mx-auto w-full max-w-[90%] px-4 pt-20 lg:max-w-[85%]">
        <div className="flex gap-6">
          <NetworkSidebar
            activeSection={activeSection}
            onSelect={setActiveSection}
            sections={sections}
          />

          <main className="flex-1 py-8">
            <div className="mx-auto max-w-5xl space-y-8">{activeContent}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
