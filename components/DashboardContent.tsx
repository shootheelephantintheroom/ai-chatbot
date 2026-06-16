import { ArrowUpRight, MoreHorizontal } from "lucide-react";

const stats = [
  { label: "Active projects", value: "12", delta: "+2 this month" },
  { label: "Tasks due this week", value: "34", delta: "8 overdue" },
  { label: "Team members", value: "18", delta: "3 invited" },
  { label: "Completion rate", value: "87%", delta: "+5% vs last sprint" },
];

const projects = [
  { name: "Website redesign", lead: "Mara Singh", status: "On track", progress: 72, due: "Jun 28" },
  { name: "Mobile app v2", lead: "Tom Becker", status: "At risk", progress: 41, due: "Jul 12" },
  { name: "Q3 marketing site", lead: "Lena Park", status: "On track", progress: 90, due: "Jun 20" },
  { name: "Billing migration", lead: "Sam Reyes", status: "Blocked", progress: 18, due: "Aug 02" },
  { name: "Onboarding revamp", lead: "Priya Nair", status: "On track", progress: 63, due: "Jul 05" },
];

const statusStyles: Record<string, string> = {
  "On track": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "At risk": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Blocked: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function DashboardContent() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-slate-400">{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Projects table */}
      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold">Active projects</h2>
          <button className="flex items-center gap-1 text-xs font-medium text-accent-700 hover:underline">
            View all <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-medium">Project</th>
                <th className="px-5 py-2.5 font-medium">Lead</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Progress</th>
                <th className="px-5 py-2.5 font-medium">Due</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {p.name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{p.lead}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{p.due}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
