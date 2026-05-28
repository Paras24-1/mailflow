"use client";
import { useState, useEffect } from "react";
import {
  Rocket,
  ArrowRight,
  ArrowLeft,
  Users,
  FileText,
  BookmarkCheck,
  CheckCircle,
  Play,
  FileSpreadsheet,
  AlertCircle,
  X,
  Sparkles,
  Trash2,
  ListRestart
} from "lucide-react";
import { Lead, EmailTemplate, Campaign } from "../types";

interface CampaignWizardProps {
  leads: Lead[];
  templates: EmailTemplate[];
  campaigns: Campaign[];
  preselectedLeadIds?: string[];
  onRefresh: () => void;
  onViewChange: (view: string) => void;
  onClearPreselectedLeads?: () => void;
}

export default function CampaignWizard({
  leads,
  templates,
  campaigns,
  preselectedLeadIds = [],
  onRefresh,
  onViewChange,
  onClearPreselectedLeads
}: CampaignWizardProps) {
  // Wizard steps state
  const [showWizardModal, setShowWizardModal] = useState(preselectedLeadIds.length > 0);
  const [wizardStep, setWizardStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplateStep2Id, setSelectedTemplateStep2Id] = useState("");
  const [selectedTemplateStep3Id, setSelectedTemplateStep3Id] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(preselectedLeadIds);
  const [attachPdf, setAttachPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [wizardError, setWizardError] = useState("");

  // Target active leads filter
  const activeLeads = leads.filter(l => l.status === "active");
  const step1Templates = templates.filter(t => t.sequenceStep === 1);
  const step2Templates = templates.filter(t => t.sequenceStep === 2);
  const step3Templates = templates.filter(t => t.sequenceStep === 3);

  useEffect(() => {
    if (showWizardModal) {
      if (!campaignName) {
        setCampaignName(`Target Campaign - ${new Date().toLocaleDateString()}`);
      }
      if (!selectedTemplateId && step1Templates.length > 0) {
        setSelectedTemplateId(step1Templates[0].id);
      }
      if (!selectedTemplateStep2Id && step2Templates.length > 0) {
        setSelectedTemplateStep2Id(step2Templates[0].id);
      }
      if (!selectedTemplateStep3Id && step3Templates.length > 0) {
        setSelectedTemplateStep3Id(step3Templates[0].id);
      }
    }
  }, [showWizardModal, step1Templates, step2Templates, step3Templates, campaignName, selectedTemplateId, selectedTemplateStep2Id, selectedTemplateStep3Id]);

  const startNewCampaign = () => {
    setCampaignName(`Target Campaign - ${new Date().toLocaleDateString()}`);
    setSelectedLeadIds(preselectedLeadIds.length > 0 ? preselectedLeadIds : []);
    setSelectedTemplateId(step1Templates.length > 0 ? step1Templates[0].id : "");
    setSelectedTemplateStep2Id(step2Templates.length > 0 ? step2Templates[0].id : "");
    setSelectedTemplateStep3Id(step3Templates.length > 0 ? step3Templates[0].id : "");
    setAttachPdf(false);
    setPdfUrl("");
    setWizardStep(1);
    setWizardError("");
    setShowWizardModal(true);
  };

  const closeWizard = () => {
    setShowWizardModal(false);
    if (onClearPreselectedLeads) onClearPreselectedLeads();
  };

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!campaignName.trim()) {
        setWizardError("Please define a catchy campaign name first.");
        return;
      }
      setWizardError("");
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (selectedLeadIds.length === 0) {
        setWizardError("You must select at least 1 eligible active prospect.");
        return;
      }
      setWizardError("");
      setWizardStep(3);
    }
  };

  const handlePrevStep = () => {
    setWizardStep(prev => Math.max(1, prev - 1));
  };

  // Launch campaign API execution
  const executeLaunchCampaign = async () => {
    if (!selectedTemplateId) {
      setWizardError("Please select a Step 1 sequence template to launch the campaign.");
      return;
    }
    setWizardError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          templateId: selectedTemplateId,
          templateStep2Id: selectedTemplateStep2Id || null,
          templateStep3Id: selectedTemplateStep3Id || null,
          leadIds: selectedLeadIds,
          attachPdf,
          pdfUrl
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to launch campaign pipeline.");
      }

      closeWizard();
      onRefresh();
      onViewChange("dashboard");
    } catch (err: any) {
      setWizardError(err.message);
    }
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllLeads = () => {
    if (selectedLeadIds.length === activeLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(activeLeads.map(l => l.id));
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign and cancel associated sequences?")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="campaigns-view-container" className="space-y-6 font-sans">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Campaign Hub
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5 font-medium">
            Create multi-touch outbound sequences, monitor enrollment and review delivery performance.
          </p>
        </div>

        <button
          id="new-campaign-trigger-btn"
          onClick={startNewCampaign}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-[#1f1f23] active:scale-95 shadow-lg shadow-indigo-600/15 flex-shrink-0 cursor-pointer"
        >
          <Rocket className="w-4 h-4 text-emerald-300 animate-pulse" />
          <span>Launch Outreach Sequence</span>
        </button>
      </div>

      {/* Campaigns list table */}
      <div className="premium-card bg-[#121214] border border-[#1f1f23] p-6">
        <h3 className="font-display font-semibold text-white mb-4 block">
          Existing Corporate Outreach Campaigns
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-400 border-collapse animate-fade-in">
            <thead className="text-[10px] uppercase font-mono bg-[#18181b] text-zinc-500 border-y border-[#1f1f23]">
              <tr>
                <th className="py-3 px-4 font-bold">Campaign details</th>
                <th className="py-3 px-4 font-bold">Enrollment Count</th>
                <th className="py-3 px-4 font-bold">Dispatch Index</th>
                <th className="py-3 px-4 font-bold">Open Index</th>
                <th className="py-3 px-4 font-bold">Replies</th>
                <th className="py-3 px-4 font-bold">Sync Status</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] font-sans">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-mono text-zinc-500">
                    No active campaign runs logged. Click "Launch Outreach Sequence" to create your first one.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-semibold text-zinc-100 text-sm block">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-zinc-550 font-mono block">
                          ID: {c.id} • Launched: {c.launchedAt ? new Date(c.launchedAt).toLocaleDateString() : "Draft"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-zinc-300">
                      {c.totalLeads} prospects
                    </td>
                    <td className="py-4 px-4 font-mono font-medium text-zinc-400">
                      {c.sentCount} sent
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="font-semibold text-zinc-350 font-mono text-xs block">
                          {c.openCount} opens
                        </span>
                        <span className="text-[10px] font-mono font-bold text-zinc-500 block uppercase">
                          Index: {c.totalLeads > 0 ? Math.round((c.openCount / c.totalLeads) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-400 font-mono text-xs block">
                          {c.replyCount} replies
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">
                          Rate: {c.totalLeads > 0 ? Math.round((c.replyCount / c.totalLeads) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] border font-bold ${
                          c.status === "running"
                            ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                            : "bg-zinc-805 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-full ${c.status === "running" ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        id={`delete-camp-${c.id}`}
                        onClick={() => deleteCampaign(c.id)}
                        className="p-1 px-2.5 border border-[#27272a] text-red-400 hover:text-white hover:bg-red-500 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG: MULTI-STEP NEW CAMPAIGN WIZARD MODAL */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121214] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative border border-[#1f1f23] flex flex-col justify-between max-h-[90vh]">
            <button
              onClick={closeWizard}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Step Wizard Header */}
            <div className="flex items-center gap-3 border-b border-[#1f1f23] pb-4">
              <div className="p-3 bg-indigo-650 text-white rounded-xl shadow-lg shadow-indigo-600/15">
                <Rocket className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="leading-tight">
                <h3 className="text-base font-bold text-white font-display">
                  Launch Sequences Campaign
                </h3>
                <p className="text-zinc-500 text-[10px] font-mono mt-0.5 uppercase tracking-wider font-bold">
                  Wizard Step {wizardStep} of 3 •{" "}
                  {wizardStep === 1
                    ? "Verify Metadata"
                    : wizardStep === 2
                    ? "Select Directory Targets"
                    : "Outbound Templates Alignment"}
                </p>
              </div>
            </div>

            {wizardError && (
              <div className="p-3 bg-red-550/10 text-red-450 border border-red-500/15 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-405" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* STEP 1: CAMPAIGN CONFIG & ATTACHMENTS */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                    Outbound Campaign Name
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. InnovateTech Q2 Enterprise Outbound"
                    className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl bg-[#18181b] outline-none focus:border-indigo-600 text-zinc-200"
                  />
                </div>

                <div className="space-y-3.5 bg-[#18181b] p-4 rounded-xl border border-[#1f1f23]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">
                        Include PDF Pitch Deck / Case Study attachment?
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        Automatically dispatch personalized PDF briefs under campaign.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={attachPdf}
                      onChange={(e) => setAttachPdf(e.target.checked)}
                      className="rounded text-indigo-650 focus:ring-indigo-600 w-4.5 h-4.5 cursor-pointer bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  {attachPdf && (
                    <div className="pt-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                        URL link to hosted PDF Brief
                      </label>
                      <input
                        type="url"
                        required
                        value={pdfUrl}
                        onChange={(e) => setPdfUrl(e.target.value)}
                        placeholder="https://assets.mailflow-saas.com/deck-innovatetech.pdf"
                        className="w-full text-xs font-mono border border-[#1f1f23] px-3.5 py-2.5 bg-[#121214] rounded-xl outline-none focus:border-indigo-600 text-zinc-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: CHOOSE TARGET LEADS */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                    Select Target Prospects ({selectedLeadIds.length} selected)
                  </label>
                  <button
                    onClick={selectAllLeads}
                    className="text-[10px] font-mono underline text-zinc-455 font-bold hover:text-indigo-400 cursor-pointer"
                  >
                    {selectedLeadIds.length === activeLeads.length ? "De-select All" : "Select All Active Directory"}
                  </button>
                </div>

                {/* Leads Selection directory box */}
                <div className="max-h-56 overflow-y-auto border border-[#1f1f23] rounded-2xl divide-y divide-[#1f1f23] bg-[#18181b]">
                  {activeLeads.length === 0 ? (
                    <p className="text-center p-8 text-xs font-bold font-mono text-zinc-500">
                      No active prospects available in Directory. Add leads first before launching.
                    </p>
                  ) : (
                    activeLeads.map((l) => {
                      const isSelected = selectedLeadIds.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => toggleLeadSelection(l.id)}
                          className={`flex items-center gap-3 p-3 px-4 cursor-pointer hover:bg-zinc-800/20 transition-colors ${
                            isSelected ? "bg-[#121214]" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // toggled by parent div click
                            className="rounded text-indigo-600 focus:ring-indigo-600 w-3.5 h-3.5 pointer-events-none bg-zinc-800 border-zinc-700"
                          />
                          <div className="text-[11px] leading-tight">
                            <span className="font-bold text-zinc-200 font-sans block">
                              {l.firstName} {l.lastName} • <span className="text-zinc-400 font-semibold">{l.company}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono font-semibold block uppercase">
                              {l.email}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: SELECT TEMPLATES & LAUNCH CONFIRMATION */}
            {wizardStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                {/* Step 1 template dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                    Select Sequence Step 1 outreach template (Required)
                  </label>
                  {step1Templates.length === 0 ? (
                    <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 rounded-xl text-xs font-medium space-y-1">
                      <p className="font-bold">No Step 1 (Introduction) templates found.</p>
                      <p className="text-zinc-400 text-[11px] font-normal leading-normal">
                        To launch a campaign, you must first create at least one Step 1 sequence template in the <b>Email Sequences</b> tab.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full text-xs font-semibold border border-[#1f1f23] p-2.5 rounded-xl outline-none bg-[#18181b] focus:border-indigo-600 text-zinc-300 cursor-pointer"
                    >
                      {step1Templates.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#121214] text-zinc-200">
                          {t.name} (Step 1 Subject: "{t.subject}")
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Step 2 template dropdown */}
                <div className="space-y-1 mt-3">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                    Select Sequence Step 2 nurture template (Optional)
                  </label>
                  {step2Templates.length === 0 ? (
                    <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 rounded-xl text-xs font-medium space-y-1">
                      <p className="font-bold">No Step 2 (Nurture Thread) templates found.</p>
                      <p className="text-zinc-400 text-[11px] font-normal leading-normal">
                        Create templates in the <b>Email Sequences</b> tab to enable this step.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedTemplateStep2Id}
                      onChange={(e) => setSelectedTemplateStep2Id(e.target.value)}
                      className="w-full text-xs font-semibold border border-[#1f1f23] p-2.5 rounded-xl outline-none bg-[#18181b] focus:border-indigo-600 text-zinc-300 cursor-pointer"
                    >
                      <option value="" className="bg-[#121214] text-zinc-500">
                        -- Use Default / Skip Step 2 --
                      </option>
                      {step2Templates.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#121214] text-zinc-200">
                          {t.name} (Step 2 Subject: "{t.subject}")
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Step 3 template dropdown */}
                <div className="space-y-1 mt-3">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                    Select Sequence Step 3 breakup template (Optional)
                  </label>
                  {step3Templates.length === 0 ? (
                    <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 rounded-xl text-xs font-medium space-y-1">
                      <p className="font-bold">No Step 3 (Breakup Touchpoint) templates found.</p>
                      <p className="text-zinc-400 text-[11px] font-normal leading-normal">
                        Create templates in the <b>Email Sequences</b> tab to enable this step.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedTemplateStep3Id}
                      onChange={(e) => setSelectedTemplateStep3Id(e.target.value)}
                      className="w-full text-xs font-semibold border border-[#1f1f23] p-2.5 rounded-xl outline-none bg-[#18181b] focus:border-indigo-600 text-zinc-300 cursor-pointer"
                    >
                      <option value="" className="bg-[#121214] text-zinc-500">
                        -- Use Default / Skip Step 3 --
                      </option>
                      {step3Templates.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#121214] text-zinc-200">
                          {t.name} (Step 3 Subject: "{t.subject}")
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Final Campaign review brief */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2.5 text-xs text-zinc-300">
                  <h4 className="font-display font-bold text-emerald-450 flex items-center gap-1.5 leading-none">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Sequence Alignment Verified</span>
                  </h4>
                  <ul className="space-y-1.5 text-[11px] list-none pl-0 font-medium font-sans">
                    <li>• Outreach campaign: <b className="text-zinc-100">{campaignName}</b></li>
                    <li>• Scope total prospects: <b className="text-zinc-100">{selectedLeadIds.length} leads</b></li>
                    <li>• Outbox: <b className="text-zinc-100 font-semibold">Step 1 emails will be generated immediately</b></li>
                    <li>• Scheduled: <b className="text-zinc-100 font-semibold">Steps 2 and 3 scheduled for auto sequence simulation</b></li>
                    {attachPdf && <li>• Payload deck inclusion: <b className="text-zinc-100 font-semibold">{pdfUrl}</b></li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Modal action buttons footer */}
            <div className="flex justify-between items-center pt-4 border-t border-[#1f1f23]">
              {wizardStep > 1 ? (
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-[#18181b] rounded-xl text-xs font-bold text-zinc-400 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeWizard}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                {wizardStep < 3 ? (
                  <button
                    onClick={handleNextStep}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
                  >
                    <span>Proceed</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={executeLaunchCampaign}
                    className="px-5 py-2.5 bg-[#34d399] hover:bg-emerald-500 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Rocket className="w-3.5 h-3.5 text-zinc-900" />
                    <span>Launch & Deploy Outreach</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
