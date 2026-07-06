"use client";
import React, { useState } from "react";
import {
  FileText,
  Plus,
  Edit2,
  Sparkles,
  Clipboard,
  X,
  Bot,
  BrainCircuit,
  CornerDownRight,
  RefreshCw,
  Send,
  Sliders,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { EmailTemplate } from "../types";

interface TemplatesViewProps {
  templates: EmailTemplate[];
  onRefresh: () => void;
}

export default function TemplatesView({
  templates,
  onRefresh
}: TemplatesViewProps) {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Editor form state
  const [editorForm, setEditorForm] = useState({
    name: "",
    subject: "",
    body: ""
  });

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: "",
    sequenceStep: 1 as 1 | 2 | 3,
    subject: "",
    body: ""
  });

  // AI assistant input states
  const [aiProduct, setAiProduct] = useState("");
  const [aiDesc, setAiDesc] = useState("");
  const [aiStep, setAiStep] = useState<number>(1);
  const [aiTone, setAiTone] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [generatedResult, setGeneratedResult] = useState<{ subject: string; body: string } | null>(null);
  const [insertSuccess, setInsertSuccess] = useState(false);
  const [aiTemplateName, setAiTemplateName] = useState("");
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);

  const [editTab, setEditTab] = useState<"write" | "preview">("write");
  const [createTab, setCreateTab] = useState<"write" | "preview">("write");

  // Group templates by step
  const sortedTemplates = [...templates].sort((a,b) => a.sequenceStep - b.sequenceStep);

  const startEdit = (temp: EmailTemplate) => {
    setEditingTemplate(temp);
    setEditTab("write");
    setEditorForm({
      name: temp.name,
      subject: temp.subject,
      body: temp.body
    });
    setGeneratedResult(null);
    setShowEditModal(true);
  };

  const handleEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      const res = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editorForm)
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingTemplate(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          sequenceStep: createForm.sequenceStep,
          subject: createForm.subject,
          body: createForm.body
        })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          sequenceStep: 1,
          subject: "",
          body: ""
        });
        onRefresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to create template.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this outreach template?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        onRefresh();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete template.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Email Copy using Server-Side Gemini API
  const generateAiCopy = async () => {
    if (!aiProduct || !aiDesc) {
      setAiError("Please fill out both the Product Name and Product/Service Description first.");
      return;
    }
    setAiError("");
    setIsGenerating(true);
    setGeneratedResult(null);
    setInsertSuccess(false);

    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: aiProduct,
          productDesc: aiDesc,
          step: aiStep,
          tone: aiTone
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate optimized SDR outbound copy.");
      }

      setGeneratedResult({
        subject: data.subject || "",
        body: data.body || ""
      });
      setAiTemplateName(`AI Generated ${aiTone} (Step ${aiStep})`);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply Generated Copy to Active Editor Drawer Fields
  const applyAiCopy = () => {
    if (!generatedResult) return;
    setEditorForm(prev => ({
      ...prev,
      subject: generatedResult.subject,
      body: generatedResult.body
    }));
    setInsertSuccess(true);
    setTimeout(() => setInsertSuccess(false), 2000);
  };

  const saveGeneratedAsTemplate = async () => {
    if (!generatedResult) return;
    if (!aiTemplateName.trim()) {
      setAiError("Please provide a Template Name to save.");
      return;
    }
    setAiError("");
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: aiTemplateName.trim(),
          sequenceStep: aiStep,
          subject: generatedResult.subject,
          body: generatedResult.body
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save template.");
      }
      setAiSaveSuccess(true);
      setAiTemplateName("");
      onRefresh();
      setTimeout(() => {
        setAiSaveSuccess(false);
        setShowAiAssistant(false);
        setGeneratedResult(null);
      }, 2000);
    } catch (err: any) {
      setAiError(err.message);
    }
  };

  const compilePreviewHtml = (bodyText: string, subjectText: string) => {
    const vars: Record<string, string> = {
      first_name: "John",
      company: "Acme Corp",
    };
    let compiledBody = bodyText || "";
    let compiledSubject = subjectText || "";
    for (const [key, val] of Object.entries(vars)) {
      const regex = new RegExp(`{{\\\\s*${key}\\\\s*}}`, "g");
      compiledBody = compiledBody.replace(regex, val);
      compiledSubject = compiledSubject.replace(regex, val);
    }
    const isHtml = /<[a-z][\\s\\S]*>/i.test(compiledBody);
    if (!isHtml) {
      compiledBody = compiledBody.replace(/\\n/g, "<br />");
    }
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #333333;
              background-color: #ffffff;
              margin: 0;
              padding: 16px;
            }
            p { margin: 0 0 16px 0; }
          </style>
        </head>
        <body>
          <div style="font-size: 11px; color: #666; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
            <strong>Subject:</strong> ${compiledSubject}
          </div>
          <div>
            ${compiledBody}
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div id="templates-view-container" className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Email Campaign Sequences
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5 font-medium">
            Optimize, personalize and save sequence templates utilized inside multi-touch outreach.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="create-template-btn"
            onClick={() => {
              setShowCreateModal(true);
              setCreateForm({
                name: "",
                sequenceStep: 1,
                subject: "",
                body: ""
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#121214] border border-[#1f1f23] text-zinc-200 hover:text-white rounded-xl text-xs font-bold hover:bg-[#18181b] transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-455 text-indigo-400" />
            <span>Create Template</span>
          </button>

          <button
            id="open-copilot-panel-btn"
            onClick={() => {
              setShowAiAssistant(true);
              setGeneratedResult(null);
              setInsertSuccess(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#121214] border border-[#1f1f23] text-zinc-200 hover:text-white rounded-xl text-xs font-bold hover:bg-[#18181b] transition-all active:scale-95 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-emerald-450 animate-pulse" />
            <span>SDR AI Copywriter Copilot</span>
          </button>
        </div>
      </div>

      {/* Grid of Templates grouped by sequence step */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sortedTemplates.map((temp) => (
          <div
            key={temp.id}
            id={`template-card-${temp.id}`}
            className="premium-card bg-[#121214] p-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Header card indicator */}
              <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/10">
                    {temp.sequenceStep}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-200 font-sans block truncate max-w-[130px]" title={temp.name}>
                      {temp.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
                      Step {temp.sequenceStep} • {temp.sequenceStep === 1
                        ? "Introduction"
                        : temp.sequenceStep === 2
                        ? "Nurture"
                        : "Breakup"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`edit-temp-btn-${temp.id}`}
                    onClick={() => startEdit(temp)}
                    className="p-1.5 border border-[#1f1f23] rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181b] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!temp.isDefault && (
                    <button
                      id={`delete-temp-btn-${temp.id}`}
                      onClick={() => handleDeleteTemplate(temp.id)}
                      className="p-1.5 border border-[#1f1f23] rounded-xl text-zinc-450 hover:text-red-400 hover:bg-[#18181b] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Template details */}
              <div className="space-y-3.5 text-xs text-zinc-450">
                <div className="space-y-1">
                  <strong className="text-[10px] text-zinc-500 uppercase font-bold font-mono tracking-wider block">Subject Reference:</strong>
                  <span className="font-semibold text-zinc-200 font-sans block max-w-xs truncate">
                    {temp.subject}
                  </span>
                </div>

                <div className="space-y-1">
                  <strong className="text-[10px] text-zinc-500 uppercase font-bold font-mono tracking-wider block">Email Body Sample:</strong>
                  <p className="bg-[#18181b] border border-[#1f1f23] p-3 rounded-xl font-sans leading-relaxed text-[11px] h-40 overflow-y-auto text-zinc-300 scrollbar-thin">
                    {temp.body}
                  </p>
                </div>
              </div>
            </div>

            {/* Template dynamic tags info footer */}
            <div className="flex items-center justify-between border-t border-[#1f1f23] pt-3.5 mt-4 text-[11px] font-mono text-zinc-500 font-medium">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-zinc-550" />
                Tags: <span className="text-zinc-300 font-semibold font-sans">{"{{first_name}}"}, {"{{company}}"}</span>
              </span>
              <span>
                Updated {new Date(temp.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* DIALOG A: EDIT TEMPLATE DETAIL MODAL */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 animate-fade-in animate-duration-150">
          <div className="bg-[#121214] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative border border-[#1f1f23] flex flex-col justify-between">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingTemplate(null);
              }}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#1f1f23] pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/15 text-indigo-400 font-mono flex items-center justify-center font-bold">
                {editingTemplate.sequenceStep}
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Tweak Outreach Template Step {editingTemplate.sequenceStep}
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5 font-medium">
                  Refining target messaging variables for automated campaigns outbox.
                </p>
              </div>
            </div>

            {/* Tab selector */}
            <div className="flex border-b border-[#1f1f23] mb-2">
              <button
                type="button"
                onClick={() => setEditTab("write")}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  editTab === "write"
                    ? "border-indigo-600 text-white"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Template Editor
              </button>
              <button
                type="button"
                onClick={() => setEditTab("preview")}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  editTab === "preview"
                    ? "border-indigo-600 text-white"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                HTML / Output Preview
              </button>
            </div>

            <form onSubmit={handleEditorSubmit} className="space-y-4">
              {editTab === "write" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Template Name</label>
                    <input
                      type="text"
                      required
                      value={editorForm.name}
                      onChange={(e) => setEditorForm({ ...editorForm, name: e.target.value })}
                      placeholder="Introductory Subject Outreach"
                      className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Subject Title</label>
                    <input
                      type="text"
                      required
                      value={editorForm.subject}
                      onChange={(e) => setEditorForm({ ...editorForm, subject: e.target.value })}
                      placeholder="Quick question about {{company}}"
                      className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Email Body Copy (Supports HTML)</label>
                      <span className="text-[9px] font-mono text-zinc-500 font-bold">Available: {"{{first_name}}"}, {"{{company}}"}</span>
                    </div>
                    <textarea
                      required
                      rows={8}
                      value={editorForm.body}
                      onChange={(e) => setEditorForm({ ...editorForm, body: e.target.value })}
                      placeholder="Write clear outreach copy or paste custom HTML code..."
                      className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b] whitespace-pre-wrap leading-relaxed focus:bg-[#18181b]"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Real-time Sandbox Preview (Simulated Variables)</label>
                  <div className="h-96 w-full rounded-2xl overflow-hidden bg-white border border-[#1f1f23] shadow-inner">
                    <iframe
                      title="Live Email Preview"
                      srcDoc={compilePreviewHtml(editorForm.body, editorForm.subject)}
                      className="w-full h-full border-none"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium font-sans">
                    Variables like <code className="text-zinc-400 font-mono">{"{{first_name}}"}</code> and <code className="text-zinc-400 font-mono">{"{{company}}"}</code> are automatically compiled with mock data ("John" and "Acme Corp") inside the sandbox.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                {editTab === "write" ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Prepopulate this exact template editor with Gemini AI Copilot context!
                      setAiStep(editingTemplate.sequenceStep);
                      setShowAiAssistant(true);
                    }}
                    className="flex items-center gap-1 px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-bold rounded-xl transition-all border border-indigo-500/10 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Draft this with AI</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG C: CREATE TEMPLATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 animate-fade-in animate-duration-150">
          <div className="bg-[#121214] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative border border-[#1f1f23] flex flex-col justify-between">
            <button
              onClick={() => {
                setShowCreateModal(false);
              }}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#1f1f23] pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/15 text-indigo-400 font-mono flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Create Sequence Template
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5 font-medium">
                  Add a new template to use inside your multi-touch outreach.
                </p>
              </div>
            </div>

            {/* Tab selector */}
            <div className="flex border-b border-[#1f1f23] mb-2">
              <button
                type="button"
                onClick={() => setCreateTab("write")}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  createTab === "write"
                    ? "border-indigo-600 text-white"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Template Editor
              </button>
              <button
                type="button"
                onClick={() => setCreateTab("preview")}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  createTab === "preview"
                    ? "border-indigo-600 text-white"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                HTML / Output Preview
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createTab === "write" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Template Name</label>
                      <input
                        type="text"
                        required
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="Introductory Subject Outreach"
                        className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Sequence Step</label>
                      <select
                        value={createForm.sequenceStep}
                        onChange={(e) => setCreateForm({ ...createForm, sequenceStep: parseInt(e.target.value) as 1 | 2 | 3 })}
                        className="w-full text-xs font-semibold border border-[#1f1f23] p-2.5 rounded-xl bg-[#18181b] text-zinc-350 outline-none cursor-pointer"
                      >
                        <option value={1}>Step 1 (Introduction)</option>
                        <option value={2}>Step 2 (Nurture Thread)</option>
                        <option value={3}>Step 3 (Breakup Touchpoint)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Subject Title</label>
                    <input
                      type="text"
                      required
                      value={createForm.subject}
                      onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                      placeholder="Quick question about {{company}}"
                      className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Email Body Copy (Supports HTML)</label>
                      <span className="text-[9px] font-mono text-zinc-500 font-bold">Available: {"{{first_name}}"}, {"{{company}}"}</span>
                    </div>
                    <textarea
                      required
                      rows={8}
                      value={createForm.body}
                      onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                      placeholder="Write clear outreach copy or paste custom HTML code..."
                      className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b] whitespace-pre-wrap leading-relaxed focus:bg-[#18181b]"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Real-time Sandbox Preview (Simulated Variables)</label>
                  <div className="h-96 w-full rounded-2xl overflow-hidden bg-white border border-[#1f1f23] shadow-inner">
                    <iframe
                      title="Live Email Preview"
                      srcDoc={compilePreviewHtml(createForm.body, createForm.subject)}
                      className="w-full h-full border-none"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium font-sans">
                    Variables like <code className="text-zinc-400 font-mono">{"{{first_name}}"}</code> and <code className="text-zinc-400 font-mono">{"{{company}}"}</code> are automatically compiled with mock data ("John" and "Acme Corp") inside the sandbox.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                  }}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PANEL B: COPRWRITER AI-ASSISTANT SLIDE-OUT PANEL */}
      {showAiAssistant && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-[#09090b] shadow-2xl overflow-y-auto h-screen border-l border-[#27272a] p-6 flex flex-col justify-between animate-slide-in font-sans">
          <div className="space-y-6">
            {/* Header close */}
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/10">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    SDR Copy Copilot
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Gemini AI Personalized Outreach
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAiAssistant(false);
                  setGeneratedResult(null);
                  setInsertSuccess(false);
                }}
                className="p-1 px-2 border border-[#27272a] rounded-xl hover:bg-[#121214] active:scale-95 transition-all outline-none cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-zinc-400" />
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/15 rounded-xl text-xs font-semibold">
                {aiError}
              </div>
            )}

            {/* AI Generator Inputs */}
            <div className="space-y-4 bg-[#121214] p-4 rounded-2xl border border-[#1f1f23]">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Product / SaaS Name</label>
                <input
                  type="text"
                  value={aiProduct}
                  onChange={(e) => setAiProduct(e.target.value)}
                  placeholder="e.g., MailFlow"
                  className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl bg-[#18181b] outline-none focus:border-indigo-600 text-zinc-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Value Prop / Service Core description</label>
                <textarea
                  rows={3}
                  value={aiDesc}
                  onChange={(e) => setAiDesc(e.target.value)}
                  placeholder="Outreach automation tracking, duplicate checks & Outlook inbox sync for B2B reps."
                  className="w-full text-xs font-medium border border-[#1f1f23] px-3.5 py-2.5 rounded-xl bg-[#18181b] outline-none focus:border-indigo-600 text-zinc-200 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Campaign Step</label>
                  <select
                    value={aiStep}
                    onChange={(e) => setAiStep(parseInt(e.target.value))}
                    className="w-full text-xs font-semibold border border-[#1f1f23] p-2.5 rounded-xl bg-[#18181b] text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value={1}>Step 1 (Intro)</option>
                    <option value={2}>Step 2 (Follow-up)</option>
                    <option value={3}>Step 3 (Breakup)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Outbound Tone</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full text-xs font-semibold border border-[#1f1f23] p-2.5 rounded-xl bg-[#18181b] text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Bold">Bold / Disruptive</option>
                    <option value="Friendly">Friendly / Warm</option>
                    <option value="Direct">Concise & Direct</option>
                    <option value="Creative">Creative Pitch</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                id="generate-copy-ai-btn"
                disabled={isGenerating}
                onClick={generateAiCopy}
                className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-zinc-800 transition-all rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing Copy...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Generate Copy with Gemini AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated results block */}
            {generatedResult && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-t border-[#1f1f23] pt-4">
                  <h4 className="text-xs font-bold text-[#34d399] font-mono uppercase tracking-wider">
                    AI Copywriter Draft Results
                  </h4>
                  <span className="text-[9px] bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full font-bold text-emerald-400">
                    SDR Approved
                  </span>
                </div>

                <div className="space-y-3 bg-[#121214] p-4 rounded-xl border border-[#1f1f23] font-sans text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-mono block">SUBJECT</span>
                    <span className="font-bold text-white block font-sans">
                      {generatedResult.subject}
                    </span>
                  </div>

                  <div className="space-y-1 border-t border-[#1f1f23] pt-2">
                    <span className="text-[10px] text-zinc-500 font-mono block">EMAIL BODY</span>
                    <p className="whitespace-pre-wrap font-sans leading-relaxed text-[11px] text-zinc-350 max-h-56 overflow-y-auto bg-[#18181b] p-3 rounded-xl border border-[#1f1f23]">
                      {generatedResult.body}
                    </p>
                  </div>
                </div>

                {/* If edit modal is active, allow insert action */}
                {editingTemplate ? (
                  <button
                    onClick={applyAiCopy}
                    className="w-full py-2.5 bg-[#34d399] hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    {insertSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                        <span>Inserted into Editor!</span>
                      </>
                    ) : (
                      <>
                        <CornerDownRight className="w-4 h-4 text-zinc-900" />
                        <span className="text-zinc-900">Apply Copy as Step {aiStep} Template</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3 border-t border-[#1f1f23] pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Template Name</label>
                      <input
                        type="text"
                        value={aiTemplateName}
                        onChange={(e) => setAiTemplateName(e.target.value)}
                        placeholder="e.g., AI Generated Step 1"
                        className="w-full text-xs font-semibold border border-[#1f1f23] px-3.5 py-2.5 rounded-xl bg-[#18181b] outline-none focus:border-indigo-600 text-zinc-200"
                      />
                    </div>
                    <button
                      onClick={saveGeneratedAsTemplate}
                      className="w-full py-2.5 bg-[#34d399] hover:bg-emerald-450 text-zinc-950 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      {aiSaveSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-zinc-900" />
                          <span>Saved Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-zinc-900" />
                          <span className="text-zinc-900">Save as New Step {aiStep} Template</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
