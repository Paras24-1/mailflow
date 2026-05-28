"use client";
import React, { useState } from "react";
import { Ban, Search, Plus, Trash2, ShieldAlert, Check } from "lucide-react";
import { DncEntry } from "../types";

interface DncViewProps {
  dncList: DncEntry[];
  onRefresh: () => void;
}

export default function DncView({ dncList, onRefresh }: DncViewProps) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("Manual Single Entry Opt-Out");
  const [errorMsg, setErrorMsg] = useState("");

  const filteredDnc = dncList.filter(d =>
    (d.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.reason || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newEmail.trim()) return;

    try {
      const res = await fetch("/api/dnc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, reason: newReason })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add email to suppression list.");
      }

      setNewEmail("");
      setShowAddForm(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRemoveDnc = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the suppression filter?`)) return;

    try {
      const res = await fetch(`/api/dnc/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="dnc-view-container" className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Suppression Directory (DNC)
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5 font-medium">
            Manage global Do-Not-Contact exclusions to safeguard sender reputation and enforce unsubscribe requests.
          </p>
        </div>

        <button
          id="toggle-add-dnc-btn"
          onClick={() => setShowAddForm(prev => !prev)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold hover:shadow shadow-lg shadow-indigo-600/15 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Suppress New Email</span>
        </button>
      </div>

      {/* Exclude/Add Form Drawer Panel inside list */}
      {showAddForm && (
        <div className="premium-card p-6 bg-[#121214] border border-[#1f1f23] animate-fade-in relative space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider block">
            Suppress Email Manually
          </h3>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/15 rounded-xl text-xs font-semibold mb-3">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddDncSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Ex: competitor-ceo@firm.com"
              className="text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none bg-[#18181b] text-zinc-200 focus:border-indigo-600 flex-1 h-[42px]"
            />
            <input
              type="text"
              required
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Ex: Customer Opt-Out / Competitor domain"
              className="text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl bg-[#18181b] text-zinc-250 outline-none focus:border-indigo-600 flex-1 h-[42px]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 h-[42px] hover:bg-indigo-700 flex-1 shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Enforce Block</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setErrorMsg("");
                }}
                className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl h-[42px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters search */}
      <div className="premium-card p-4 flex items-center gap-3 bg-[#121214] border border-[#1f1f23]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            id="dnc-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search matching excluded emails, domains or unsubscribe reasons..."
            className="w-full bg-[#18181b] outline-none text-xs rounded-xl pl-10 pr-4 py-3 border border-[#1f1f23] text-zinc-200 placeholder-zinc-500 focus:border-indigo-600 transition-colors font-semibold font-sans"
          />
        </div>
      </div>

      {/* DNC List Table Grid */}
      <div className="premium-card overflow-hidden bg-[#121214] border border-[#1f1f23]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-400 border-collapse">
            <thead className="text-[10px] uppercase font-mono bg-[#18181b] text-zinc-500 border-b border-[#1f1f23]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Suppressed Email Name</th>
                <th className="py-3.5 px-4 font-bold">Exclusion Context / Reason</th>
                <th className="py-3.5 px-4 font-bold">Logged Date</th>
                <th className="py-3.5 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] font-sans">
              {filteredDnc.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center font-mono text-zinc-500">
                    No matching exclusions listed in Directory. Campaigns will launch without outbox blocks.
                  </td>
                </tr>
              ) : (
                filteredDnc.map((d) => (
                  <tr key={d.id} id={`dnc-entry-${d.id}`} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-200 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span>{d.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-350">
                      {d.reason}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-500">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        id={`delete-dnc-${d.id}`}
                        onClick={() => handleRemoveDnc(d.id, d.email)}
                        className="p-1.5 px-3 border border-[#27272a] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-zinc-500" />
                        <span>Clear Block</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
