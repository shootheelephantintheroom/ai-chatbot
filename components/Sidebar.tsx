import {
  LayoutGrid,
  FolderKanban,
  CheckSquare,
  Calendar,
  BarChart3,
  Users,
  Settings,
  ChevronsUpDown,
  Cloud,
} from "lucide-react";

const nav = [
  { label: "Overview", icon: LayoutGrid, active: false },
  { label: "Projects", icon: FolderKanban, active: true },
  { label: "My Tasks", icon: CheckSquare, active: false },
  { label: "Calendar", icon: Calendar, active: false },
  { label: "Reports", icon: BarChart3, active: false },
  { label: "Team", icon: Users, active: false },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      {/* Workspace switcher */}
      <button className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-4 transition-colors hover:bg-slate-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
          <Cloud size={18} />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold">Nimbus</span>
          <span className="text-xs text-slate-500">Acme Inc.</span>
        </span>
        <ChevronsUpDown size={15} className="ml-auto text-slate-400" />
      </button>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {nav.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href="#"
            className={[
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent-50 font-medium text-accent-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            ].join(" ")}
          >
            <Icon
              size={18}
              className={active ? "text-accent-700" : "text-slate-400"}
            />
            {label}
          </a>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-slate-200 px-3 py-3">
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Settings size={18} className="text-slate-400" />
          Settings
        </a>
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            JD
          </span>
          <div className="leading-tight">
            <div className="text-sm font-medium">Jordan Diaz</div>
            <div className="text-xs text-slate-500">jordan@acme.co</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
