"use client";
import {
  LayoutDashboard,
  Users,
  FileText,
  Rocket,
  Inbox,
  Ban,
  Settings,
  Mail
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  outlookConnected: boolean;
}

export default function Sidebar({
  currentView,
  onViewChange,
  outlookConnected
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "leads", label: "Leads Directory", icon: Users },
    { id: "templates", label: "Email Sequences", icon: FileText },
    { id: "campaigns", label: "Campaign Wizard", icon: Rocket },
    { id: "replies", label: "Replies & Inbox", icon: Inbox },
    { id: "dnc", label: "Suppression (DNC)", icon: Ban },
    { id: "outlook", label: "Integration Hub", icon: Settings },
  ];

  return (
    <div className="w-68 bg-[#09090b] border-r border-[#1f1f23] flex flex-col justify-between h-screen sticky top-0 font-sans">
      {/* Upper part: brand & items */}
      <div className="flex flex-col flex-1 py-6 px-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-display font-bold text-xl tracking-tight shadow-lg shadow-indigo-600/30">
            M
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg tracking-tight text-white">
              MailFlow
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
              Sales SaaS Engine
            </p>
          </div>
        </div>

        {/* Integration Status Indicator */}
        <div className="px-3 py-2 bg-[#121214] rounded-xl border border-[#1f1f23] flex items-center justify-between text-xs mb-6">
          <div className="flex items-center gap-2">
            <Mail className="w-4.5 h-4.5 text-zinc-500" />
            <span className="text-zinc-300 font-medium">Outlook Mailbox</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                outlookConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] font-mono font-medium text-zinc-400">
              {outlookConnected ? "Synced" : "Paused"}
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-zinc-400 hover:text-white hover:bg-[#121214]"
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? "text-white" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
