"use client";
import { useState } from "react";
import {
  Inbox,
  Sparkles,
  Search,
  Check,
  Send,
  X,
  Mail,
  Bot,
  BrainCircuit,
  CornerDownRight,
  User,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CircleCheck,
  CheckCheck,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { ReplyInboxItem } from "../types";

interface RepliesViewProps {
  replies: ReplyInboxItem[];
  onRefresh: () => void;
}

export default function RepliesView({
  replies,
  onRefresh
}: RepliesViewProps) {
  const [activeReplyId, setActiveReplyId] = useState<string>(
    replies.length > 0 ? replies[0].id : ""
  );
  const [draftResponseText, setDraftResponseText] = useState("");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [aiDraftError, setAiDraftError] = useState("");
  const [sendSuccessMsg, setSendSuccessMsg] = useState("");

  const activeReply = replies.find(r => r.id === activeReplyId) || (replies.length > 0 ? replies[0] : null);

  const selectReply = async (id: string, isRead: boolean) => {
    setActiveReplyId(id);
    setSendSuccessMsg("");
    setDraftResponseText("");
    setAiDraftError("");

    if (!isRead) {
      // Mark as read API
      try {
        await fetch(`/api/replies/${id}/read`, { method: "POST" });
        onRefresh();
      } catch (err) {
        console.error("Failed to mark reply as read", err);
      }
    }
  };

  // Generate Sentiment & Draft suggestion using Gemini AI
  const handleGenerateAiResponseDraft = async () => {
    if (!activeReply) return;
    setIsGeneratingDraft(true);
    setAiDraftError("");

    try {
      const res = await fetch(`/api/replies/${activeReply.id}/generate`, {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI draft suggestion.");
      }

      setDraftResponseText(data.draft || "");
      onRefresh(); // Refresh to catch sentiment & draft cache on DB
    } catch (err: any) {
      setAiDraftError(err.message);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Dispatch response email back to prospect and resolve sequence
  const handleSendResponse = async () => {
    if (!activeReply || !draftResponseText.trim()) return;

    try {
      const res = await fetch(`/api/replies/${activeReply.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: draftResponseText })
      });

      if (res.ok) {
        setSendSuccessMsg("Response dispatched successfully! Sequence resolved and marked completed.");
        setDraftResponseText("");
        setTimeout(() => {
          setSendSuccessMsg("");
          onRefresh();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="replies-view-container" className="space-y-6 font-sans">
      {/* View header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Replies Inbox
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5 font-medium">
            Evaluate inbound replies, inspect text sentiment, and draft follow-ups with Gemini.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: List of replies */}
        <div className="premium-card bg-[#121214] lg:col-span-1 overflow-hidden divide-y divide-[#1f1f23] flex flex-col max-h-[600px] overflow-y-auto">
          <div className="p-4 bg-[#18181b] border-b border-[#1f1f23] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              Inbound Messages ({replies.length})
            </span>
            <Inbox className="w-4 h-4 text-zinc-500" />
          </div>

          {replies.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-4">
              <Mail className="w-8 h-8 mx-auto text-zinc-700" />
              <p className="text-xs font-semibold font-mono">No new campaign replies received yet.</p>
              <p className="text-[10.5px]/relaxed text-zinc-500 max-w-xs mx-auto">
                Replies from your outbound campaigns will automatically appear here once detected and classified.
              </p>
            </div>
          ) : (
            replies.map((rep) => {
              const isActive = activeReply?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  id={`reply-item-${rep.id}`}
                  onClick={() => selectReply(rep.id, rep.isRead)}
                  className={`p-4 cursor-pointer transition-colors relative border-l-4 ${
                    isActive
                      ? "bg-zinc-800/30 border-indigo-650"
                      : rep.isRead
                      ? "border-transparent hover:bg-zinc-800/20"
                      : "border-indigo-500 bg-indigo-505/10 hover:bg-zinc-800/10"
                  }`}
                >
                  {/* Subject Name header */}
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="font-semibold text-zinc-200 text-xs truncate max-w-[120px] block font-sans">
                      {rep.fromName}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(rep.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Subject Title */}
                  <span className="text-[11px] font-semibold text-zinc-350 line-clamp-1 block mb-1">
                    {rep.subject}
                  </span>

                  {/* Text snippet */}
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-medium">
                    {rep.body}
                  </p>

                  <div className="flex justify-between items-center mt-3">
                    {/* Sentiment Tag */}
                    {rep.sentiment ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          rep.sentiment === "interested"
                            ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                            : rep.sentiment === "not_interested"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {rep.sentiment === "interested" ? "Interested" : rep.sentiment === "not_interested" ? "Unsubscribe" : "Neutral"}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-[#18181b] border border-[#1f1f23] px-2 py-0.5 text-zinc-500 rounded-full font-mono font-bold lowercase">
                        Pending AI Sentiment
                      </span>
                    )}

                    {!rep.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Active Reply thread details */}
        <div className="lg:col-span-2">
          {activeReply ? (
            <div className="premium-card bg-[#121214] p-6 space-y-6">
              {/* Message Details header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#1f1f23] pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-550/10 flex items-center justify-center font-bold text-indigo-400 shadow-inner">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm font-sans block">
                      {activeReply.fromName}
                    </h3>
                    <p className="text-zinc-500 text-xs font-mono font-semibold">
                      {activeReply.fromEmail}
                    </p>
                  </div>
                </div>

                {/* Sub context info */}
                <div className="text-[10px] bg-[#18181b] border border-[#1f1f23] px-2.5 py-1.5 rounded-xl font-mono text-zinc-400 font-semibold uppercase">
                  Seq Ref: <span className="text-zinc-200 font-bold">{activeReply.sequenceId}</span>
                </div>
              </div>

              {/* Thread Subject + Body */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-bold block">SUBJECT REFERENCE:</span>
                  <span className="text-sm font-bold text-zinc-100 block font-display">
                    {activeReply.subject}
                  </span>
                </div>

                <div className="p-4 bg-[#18181b] border border-[#1f1f23] rounded-2xl text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {activeReply.body}
                </div>
              </div>

              {/* Response Draft assistant controls */}
              <div className="border-t border-[#1f1f23] pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 font-mono uppercase tracking-wider block">
                    SDR Response Draft Panel
                  </span>

                  <button
                    onClick={handleGenerateAiResponseDraft}
                    disabled={isGeneratingDraft}
                    className="flex items-center gap-1 px-3.5 py-2.5 bg-[#18181b] text-zinc-300 hover:text-white border border-[#1f1f23] rounded-xl text-xs font-bold focus:outline-none disabled:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {isGeneratingDraft ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Analyzing sentiment...</span>
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="w-3.5 h-3.5 text-emerald-350" />
                        <span>Generate suggesting response with Gemini AI</span>
                      </>
                    )}
                  </button>
                </div>

                {aiDraftError && (
                  <div className="p-3 bg-red-500/10 text-red-400 border border-red-550/20 rounded-xl text-xs font-semibold">
                    Error drafting AI response: {aiDraftError}
                  </div>
                )}

                {sendSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CircleCheck className="w-4 h-4 text-emerald-400" />
                    <span>{sendSuccessMsg}</span>
                  </div>
                )}

                {/* Actionable Response Draft Box */}
                <div className="space-y-3">
                  <textarea
                    rows={6}
                    value={draftResponseText}
                    onChange={(e) => setDraftResponseText(e.target.value)}
                    placeholder="Draft response copy, or click Gemini suggest draft button above to prepopulate."
                    className="w-full text-xs font-semibold border border-[#1f1f23] p-3.5 rounded-2xl outline-none focus:border-indigo-600 text-zinc-200 bg-[#18181b] whitespace-pre-wrap leading-relaxed"
                  />

                  {draftResponseText.trim() && (
                    <div className="flex justify-end gap-2 animate-fade-in">
                      <button
                        onClick={() => setDraftResponseText("")}
                        className="px-3.5 py-2.5 border border-[#1f1f23] text-zinc-400 text-xs font-bold hover:bg-[#18181b] hover:text-white rounded-xl transition-all"
                      >
                        Clear Draft
                      </button>
                      <button
                        onClick={handleSendResponse}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span>Send Response & Resolve Thread</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="premium-card p-12 text-center text-zinc-500 bg-[#121214] h-96 flex flex-col items-center justify-center space-y-4">
              <Mail className="w-10 h-10 text-zinc-750" />
              <h3 className="text-sm font-bold text-white font-display">No Thread Selected</h3>
              <p className="text-zinc-400 text-xs font-sans max-w-xs leading-normal font-medium">
                Click on any incoming responsive prospect mail inside the left menu to track detail stats and prompt follow-up drafts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
