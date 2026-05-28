"use client";
import React, { useState, useRef } from "react";
import {
  Users,
  Search,
  Upload,
  Plus,
  Trash2,
  Ban,
  Clock,
  X,
  FileSpreadsheet,
  Building2,
  Phone,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { Lead } from "../types";

interface LeadsViewProps {
  leads: Lead[];
  onRefresh: () => void;
  onLaunchCampaignWithLeads: (leadIds: string[]) => void;
}

export default function LeadsView({
  leads,
  onRefresh,
  onLaunchCampaignWithLeads
}: LeadsViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // Modals & Panels state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedDetailLead, setSelectedDetailLead] = useState<Lead | null>(null);
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(false);
  const [leadEvents, setLeadEvents] = useState<any[]>([]);

  // Add lead form state
  const [newLeadForm, setNewLeadForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    title: "",
    phone: ""
  });
  const [addFormError, setAddFormError] = useState("");

  // CSV Import State
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importFilename, setImportFilename] = useState("");
  const [importSuccessMsg, setImportSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Leads list
  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch =
      (l.firstName || "").toLowerCase().includes(q) ||
      (l.lastName || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.company || "").toLowerCase().includes(q) ||
      (l.title || "").toLowerCase().includes(q);

    const matchesStatus = statusFilter ? l.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Handle row individual select
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  // Create single lead
  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeadForm)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create lead.");
      }

      setNewLeadForm({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        title: "",
        phone: ""
      });
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setAddFormError(err.message);
    }
  };

  // Bulk DNC Suppression
  const handleBulkDNC = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to suppress ${selectedLeadIds.length} leads in the global suppressed directory?`)) return;

    try {
      const res = await fetch("/api/leads/bulk-dnc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedLeadIds })
      });
      if (res.ok) {
        setSelectedLeadIds([]);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected leads and associated sequences?`)) return;

    try {
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedLeadIds })
      });
      if (res.ok) {
        setSelectedLeadIds([]);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // View Lead History Timeline Drawer
  const openLeadTimeline = async (lead: Lead) => {
    setSelectedDetailLead(lead);
    setShowTimelineDrawer(true);

    try {
      const res = await fetch(`/api/events?leadId=${lead.id}`);
      if (res.ok) {
        const events = await res.json();
        setLeadEvents(events);
      }
    } catch (err) {
      console.error("Error fetching lead audit logs", err);
    }
  };

  // Drag and drop CSV handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Parse header matching
    const headerRow = lines[0].split(",");
    const cleanedHeaders = headerRow.map(h => h.trim().toLowerCase().replace(/["']/g, ""));
    
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
      const rObj: any = {};
      cleanedHeaders.forEach((header, index) => {
        // Map common headers
        if (header.includes("mail") || header === "to" || header === "address") rObj.email = values[index];
        else if (header.includes("first") || header === "name") rObj.firstName = values[index];
        else if (header.includes("last")) rObj.lastName = values[index];
        else if (header.includes("company") || header === "org") rObj.company = values[index];
        else if (header.includes("title") || header === "role") rObj.title = values[index];
        else if (header.includes("phone") || header === "tel") rObj.phone = values[index];
        else rObj[header] = values[index];
      });
      if (rObj.email) {
        rows.push(rObj);
      }
    }
    return rows;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCSVFile(e.target.files[0]);
    }
  };

  const processCSVFile = (file: File) => {
    setImportFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSVText(text);
      setParsedRows(parsed);
    };
    reader.readAsText(file);
  };

  const executeBulkImport = async () => {
    if (parsedRows.length === 0) return;
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, filename: importFilename })
      });
      const data = await res.json();
      if (res.ok) {
        setImportSuccessMsg(`Imports complete! Registered ${data.imported} leads, skipped ${data.dupes} duplicates, suppressed ${data.dncCount} DNC.`);
        setParsedRows([]);
        setImportFilename("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="leads-view-container" className="space-y-6 font-sans">
      {/* Upper action header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Leads Directory
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5 font-medium">
            Bulk upload prospects, filter active campaign streams, and organize company target lists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-import-modal-btn"
            onClick={() => {
              setImportSuccessMsg("");
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#121214] border border-[#1f1f23] rounded-xl text-xs font-bold hover:bg-[#18181b] active:scale-95 transition-all text-zinc-300 font-sans cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel/CSV Import</span>
          </button>
          <button
            id="open-add-modal-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/15 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Single Prospect</span>
          </button>
        </div>
      </div>

      {/* Directory filters & Bulk options */}
      <div className="premium-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#121214]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              id="directory-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by first name, domain email, job title or corporate firm..."
              className="w-full bg-[#18181b] outline-none text-xs rounded-xl pl-10 pr-4 py-3 border border-[#1f1f23] text-zinc-200 placeholder-zinc-500 focus:border-indigo-600 transition-colors font-semibold font-sans"
            />
          </div>

          {/* Status selector filter */}
          <div className="w-full sm:w-48">
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full outline-none text-xs rounded-xl px-3 py-3 border border-[#1f1f23] font-semibold text-zinc-300 bg-[#18181b] focus:border-indigo-600 h-[42px] cursor-pointer"
            >
              <option value="">All Lead Statuses</option>
              <option value="active">Active Pipeline</option>
              <option value="replied">Replied (Converted)</option>
              <option value="pending">Awaiting Contact</option>
              <option value="dnc">Suppressed (DNC)</option>
            </select>
          </div>
        </div>

        {/* Selected bulk action bar */}
        {selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#18181b] border border-[#1f1f23] rounded-2xl leading-none animate-fade-in animate-duration-200">
            <span className="text-[10px] font-mono font-bold text-zinc-400 mr-2 uppercase tracking-wider">
              Selected <b className="text-zinc-200">{selectedLeadIds.length}</b> rows
            </span>
            <button
              id="bulk-launch-wizard-btn"
              onClick={() => onLaunchCampaignWithLeads(selectedLeadIds)}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Launch Outreach</span>
            </button>
            <button
              id="bulk-dnc-suppress-btn"
              onClick={handleBulkDNC}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-amber-500/20 transition-colors cursor-pointer"
            >
              <Ban className="w-3 h-3" />
              <span>DNC Prevent</span>
            </button>
            <button
              id="bulk-delete-btn"
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-red-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Leads Directory Table */}
      <div className="premium-card overflow-hidden bg-[#121214]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-400 border-collapse">
            <thead className="text-[10px] uppercase font-mono bg-[#18181b] text-zinc-500 border-b border-[#1f1f23]">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    onChange={toggleSelectAll}
                    className="rounded text-indigo-600 border-zinc-700 bg-zinc-800 focus:ring-indigo-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 font-bold">Prospect Details</th>
                <th className="py-3.5 px-4 font-bold">Enterprise Firm</th>
                <th className="py-3.5 px-4 font-bold">Title/Role</th>
                <th className="py-3.5 px-4 font-bold">Contact Details</th>
                <th className="py-3.5 px-4 font-bold">Sequence Status</th>
                <th className="py-3.5 px-4 w-12 header-action-col"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] font-sans">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-mono text-zinc-500">
                    No matching prospects registered in directory. Try adding or importing some!
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => {
                  const isChecked = selectedLeadIds.includes(l.id);
                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-zinc-800/20 transition-colors ${
                        isChecked ? "bg-zinc-800/35" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectLead(l.id)}
                          className="rounded text-indigo-600 border-zinc-700 bg-zinc-800 focus:ring-indigo-600 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold flex items-center justify-center text-xs shadow-inner">
                            {l.firstName[0]}
                            {l.lastName ? l.lastName[0] : ""}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-100 text-sm block">
                              {l.firstName} {l.lastName}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono tracking-wider block">
                              ID: {l.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-300 text-xs">
                        {l.company ? (
                           <div className="flex items-center gap-1.5">
                             <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                             <span>{l.company}</span>
                           </div>
                        ) : (
                          <span className="text-zinc-650 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-zinc-400">
                        {l.title ? (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{l.title}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-650 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-mono block font-semibold text-zinc-300">{l.email}</span>
                          {l.phone && (
                            <span className="text-zinc-500 text-[11px] font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3 text-zinc-600" />
                              {l.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] border font-bold ${
                            l.status === "active"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : l.status === "replied"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : l.status === "dnc"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${
                              l.status === "active"
                                ? "bg-blue-400"
                                : l.status === "replied"
                                ? "bg-emerald-400 animate-pulse"
                                : l.status === "dnc"
                                ? "bg-amber-400"
                                : "bg-zinc-500"
                            }`}
                          />
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`view-timeline-${l.id}`}
                          onClick={() => openLeadTimeline(l)}
                          className="p-1 px-2.5 border border-[#27272a] rounded-xl hover:bg-zinc-800 hover:text-white active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold text-zinc-400 cursor-pointer"
                        >
                          <span>Track</span>
                          <ChevronRight className="w-3 h-3 text-zinc-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG A: ADD SINGLE PROSPECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-[#1f1f23]">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Register Single Prospect
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Securely insert an individual CRM outreach entry.
                </p>
              </div>
            </div>

            {addFormError && (
              <div className="p-3 bg-red-500/10 text-red-400 border border-red-550/20 rounded-xl text-xs font-semibold">
                {addFormError}
              </div>
            )}

            <form onSubmit={handleCreateLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">First Name</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.firstName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, firstName: e.target.value })}
                    placeholder="Jane"
                    className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Last Name</label>
                  <input
                    type="text"
                    value={newLeadForm.lastName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, lastName: e.target.value })}
                    placeholder="Miller"
                    className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Outbound Email Address</label>
                <input
                  type="email"
                  required
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  placeholder="jane.miller@firm-domain.com"
                  className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Corporate Company</label>
                  <input
                    type="text"
                    value={newLeadForm.company}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                    placeholder="Tech Corp"
                    className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Job Title</label>
                  <input
                    type="text"
                    value={newLeadForm.title}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, title: e.target.value })}
                    placeholder="Operational Lead"
                    className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Direct Phone Contact</label>
                <input
                  type="text"
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  placeholder="+1 555-0823 (Optional)"
                  className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15"
                >
                  Secure Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG B: DIRECT CSV IMPORTER MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-[#1f1f23]">
            <button
              onClick={() => {
                setShowImportModal(false);
                setParsedRows([]);
              }}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  SaaS CSR/CSV Bulk Importer
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5 font-medium">
                  Direct drag-and-drop parser mapping headers like Name, Email, and Company.
                </p>
              </div>
            </div>

            {importSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-xl text-xs font-semibold">
                {importSuccessMsg}
              </div>
            )}

            {/* CSV File Dropzone */}
            {parsedRows.length === 0 ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-505/10 text-zinc-200"
                    : "border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:bg-[#18181b]/40"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv"
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto text-zinc-500 mb-3" />
                <p className="text-xs font-semibold text-zinc-300">
                  Drag and drop cold outreach CSV file here, or click to browse
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-2">
                  Format standard headers for: first_name, email, company, title, phone.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-[#18181b] rounded-2xl border border-[#1f1f23]">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">
                        {importFilename}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Identified {parsedRows.length} prospects
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setParsedRows([])}
                    className="p-1 text-zinc-500 hover:text-white rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* CSV parsed rows preview */}
                <div className="max-h-40 overflow-y-auto border border-[#1f1f23] rounded-2xl">
                  <table className="w-full text-left text-[11px] text-zinc-400 font-mono">
                    <thead className="bg-[#18181b] text-zinc-500 uppercase text-[9px] sticky top-0">
                      <tr>
                        <th className="p-2 px-3 font-bold">Name</th>
                        <th className="p-2 font-bold">Email</th>
                        <th className="p-2 font-bold">Firm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f23]">
                      {parsedRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="bg-[#121214]">
                          <td className="p-2 px-3 font-bold text-zinc-350">
                            {row.firstName || "SDR Lead"} {row.lastName || ""}
                          </td>
                          <td className="p-2 text-zinc-400">{row.email}</td>
                          <td className="p-2 text-zinc-500">{row.company || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 10 && (
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 text-center p-2">
                      + {parsedRows.length - 10} more rows inside file template...
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setParsedRows([])}
                    className="px-4 py-2.5 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl"
                  >
                    Clear File
                  </button>
                  <button
                    onClick={executeBulkImport}
                    className="px-4 py-2.5 bg-[#34d399] hover:bg-emerald-500 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Run Bulk Import</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANEL C: LEAD DETAILS HISTORY TIMELINE SLIDE-OUT PANEL */}
      {showTimelineDrawer && selectedDetailLead && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-[#09090b] shadow-2xl overflow-y-auto h-screen border-l border-[#27272a] p-6 flex flex-col justify-between animate-slide-in font-sans">
          <div className="space-y-6">
            {/* Drawer upper header */}
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl font-display font-medium shadow-md shadow-indigo-600/10">
                  Trace
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    Lead Telemetry Trace
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-mono">
                    ID: {selectedDetailLead.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTimelineDrawer(false)}
                className="p-1 px-2 border border-[#27272a] rounded-xl hover:bg-[#121214] active:scale-95 transition-all outline-none cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-zinc-400" />
              </button>
            </div>

            {/* General Bio detail block */}
            <div className="space-y-3.5 bg-[#121214] p-4 rounded-2xl border border-[#1f1f23]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold font-display text-sm">
                  {selectedDetailLead.firstName[0]}
                  {selectedDetailLead.lastName ? selectedDetailLead.lastName[0] : ""}
                </div>
                <div>
                  <span className="font-bold text-white text-base font-display block">
                    {selectedDetailLead.firstName} {selectedDetailLead.lastName}
                  </span>
                  <span className="text-zinc-400 text-xs font-semibold">
                    {selectedDetailLead.title || "Target Account"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-[#1f1f23] pt-3 text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-mono uppercase text-[10px]">Email Destination</span>
                  <span className="font-mono font-bold text-zinc-200">{selectedDetailLead.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-mono uppercase text-[10px]">Target Corporate</span>
                  <span className="font-semibold text-zinc-200">{selectedDetailLead.company || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-mono uppercase text-[10px]/normal">Registry Date</span>
                  <span className="font-mono text-zinc-450">
                    {new Date(selectedDetailLead.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-mono uppercase text-[10px]">Active Status</span>
                  <span className="capitalize font-bold text-white">{selectedDetailLead.status}</span>
                </div>
              </div>
            </div>

            {/* Campaign sequence timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 font-mono uppercase tracking-wider block">
                Outbound Event History Link
              </h4>

              <div className="relative border-l border-zinc-800 pl-4 ml-2 space-y-6">
                {leadEvents.length === 0 ? (
                  <p className="text-zinc-500 font-mono text-[11px] py-4">
                    No outreach actions triggered yet for this target.
                  </p>
                ) : (
                  leadEvents.map((evt, j) => (
                    <div key={evt.id} className="relative">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border border-[#09090b] ${
                          evt.eventType === "replied"
                            ? "bg-emerald-400 shadow-md shadow-emerald-400/20"
                            : evt.eventType === "opened"
                            ? "bg-blue-400 shadow-md shadow-blue-450/20"
                            : "bg-zinc-650"
                        }`}
                      />

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-zinc-200 capitalize flex items-center gap-1.5">
                            {evt.eventType.toUpperCase()}
                            <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-0.5 rounded-lg font-normal font-mono">
                              Step {evt.step}
                            </span>
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(evt.occurredAt).toLocaleDateString()}
                          </span>
                        </div>
                        {evt.subject && (
                          <p className="text-[11px] text-zinc-400 font-medium">
                            Sub: "{evt.subject}"
                          </p>
                        )}
                        {evt.bodyPreview && (
                          <p className="text-[11px] bg-[#121214] border border-[#1f1f23] p-2.5 rounded-xl text-zinc-400 leading-normal font-sans">
                            {evt.bodyPreview}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#1f1f23] pt-4 flex gap-2">
            <button
              onClick={() => {
                setShowTimelineDrawer(false);
                onLaunchCampaignWithLeads([selectedDetailLead.id]);
              }}
              className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>Launch Custom Outreach Sync</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
