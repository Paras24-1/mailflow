import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  ChevronRight,
  Mail,
  RefreshCw,
  ChevronDown,
  Bell
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import LeadsView from "./components/LeadsView";
import TemplatesView from "./components/TemplatesView";
import CampaignWizard from "./components/CampaignWizard";
import RepliesView from "./components/RepliesView";
import DncView from "./components/DncView";
import OutlookSetupView from "./components/OutlookSetupView";
import { Lead, EmailTemplate, Campaign, ReplyInboxItem, DncEntry } from "./types";

export default function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [preselectedLeadIds, setPreselectedLeadIds] = useState<string[]>([]);

  // DB datasets
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [replies, setReplies] = useState<ReplyInboxItem[]>([]);
  const [dncList, setDncList] = useState<DncEntry[]>([]);
  const [outlookConfig, setOutlookConfig] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) setLeads(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) setTemplates(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReplies = async () => {
    try {
      const res = await fetch("/api/replies");
      if (res.ok) setReplies(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDNCList = async () => {
    try {
      const res = await fetch("/api/dnc");
      if (res.ok) setDncList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOutlookConfig = async () => {
    try {
      const res = await fetch("/api/outlook-setup");
      if (res.ok) setOutlookConfig(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllState = () => {
    fetchLeads();
    fetchTemplates();
    fetchCampaigns();
    fetchReplies();
    fetchDNCList();
    fetchOutlookConfig();
    fetchStats();
  };

  useEffect(() => {
    fetchAllState();
  }, [currentView]);

  const handleLaunchCampaignFromLeads = (selectedIds: string[]) => {
    setPreselectedLeadIds(selectedIds);
    setCurrentView("campaigns");
  };

  const handleClearPreselectedLeads = () => {
    setPreselectedLeadIds([]);
  };

  // Render sub page views
  const renderViewContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView
            stats={stats}
            onPageChange={setCurrentView}
          />
        );
      case "leads":
        return (
          <LeadsView
            leads={leads}
            onRefresh={fetchAllState}
            onLaunchCampaignWithLeads={handleLaunchCampaignFromLeads}
          />
        );
      case "templates":
        return <TemplatesView templates={templates} onRefresh={fetchAllState} />;
      case "campaigns":
        return (
          <CampaignWizard
            leads={leads}
            templates={templates}
            campaigns={campaigns}
            preselectedLeadIds={preselectedLeadIds}
            onRefresh={fetchAllState}
            onViewChange={setCurrentView}
            onClearPreselectedLeads={handleClearPreselectedLeads}
          />
        );
      case "replies":
        return (
          <RepliesView
            replies={replies}
            onRefresh={fetchAllState}
          />
        );
      case "dnc":
        return <DncView dncList={dncList} onRefresh={fetchAllState} />;
      case "outlook":
        return <OutlookSetupView config={outlookConfig} onRefresh={fetchAllState} />;
      default:
        return (
          <DashboardView
            stats={stats}
            onPageChange={setCurrentView}
          />
        );
    }
  };

  return (
    <div className="flex bg-[#09090b] text-[#f4f4f5] font-sans antialiased min-h-screen">
      {/* Side Navigation panel */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        outlookConnected={outlookConfig?.isConnected}
      />

      {/* Main Panel Content with Header Topbar */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#09090b]">
        {/* Topbar Header */}
        <header className="h-16 bg-[#09090b] border-b border-[#1f1f23] px-8 flex items-center justify-between sticky top-0 z-40">
          {/* Left info Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <span className="font-mono tracking-wider font-bold text-zinc-500 uppercase">
              Organization Space
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-200 font-sans capitalize font-bold">
              {currentView === "dnc" ? "Suppression Filter (DNC)" : currentView === "outlook" ? "Azure Integration Setup" : `${currentView} Control`}
            </span>
          </div>

          {/* Right actions: UTC local clock and User bio metadata */}
          <div className="flex items-center gap-6">
            {/* Time badge */}
            <div className="hidden sm:flex items-center gap-2 text-zinc-400 text-xs font-mono font-bold bg-[#121214] border border-[#1f1f23] py-1.5 px-3 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>18:21 UTC</span>
            </div>

            {/* User profile dropdown item */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#1f1f23]">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner border border-zinc-700">
                S
              </div>
              <div className="text-left leading-none hidden sm:block">
                <span className="text-xs font-bold text-zinc-200 font-sans block">
                  Senior SDR Cofounder
                </span>
                <span className="text-[10px] text-zinc-500 block font-mono font-semibold mt-0.5">
                  webtech131@gmail.com
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Core Sub Content Body */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto bg-[#09090b]">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
}
