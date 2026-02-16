export default function NetworkSidebar({ activeSection, onSelect, sections }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-white/70 px-4 py-6 backdrop-blur-xl dark:bg-slate-900/70 lg:block">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Navigation
        </p>
      </div>
      <nav className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => onSelect(section.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                isActive
                  ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                  : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{section.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
