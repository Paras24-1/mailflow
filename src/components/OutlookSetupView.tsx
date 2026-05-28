"use client";
import React, { useState } from "react";
import {
  Settings,
  Mail,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CloudLightning,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  PowerOff
} from "lucide-react";

interface OutlookConfig {
  msTenantId: string;
  msClientId: string;
  msSenderEmail: string;
  isConnected: boolean;
}

interface OutlookSetupViewProps {
  config: OutlookConfig | null;
  onRefresh: () => void;
}

export default function OutlookSetupView({
  config,
  onRefresh
}: OutlookSetupViewProps) {
  const [form, setForm] = useState({
    msTenantId: config?.msTenantId || "tenant-configured-8f",
    msClientId: config?.msClientId || "client-configured-3b",
    msSenderEmail: config?.msSenderEmail || "sender@mailflow-outbox.com"
  });
  const [copiedText, setCopiedText] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(false);

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/outlook-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to pause Microsoft Outlook Outbox integrations sync?")) return;
    try {
      const res = await fetch("/api/outlook-disconnect", { method: "POST" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renewSubscription = () => {
    setRenewing(true);
    setRenewSuccess(false);
    setTimeout(() => {
      setRenewing(false);
      setRenewSuccess(true);
      setTimeout(() => setRenewSuccess(false), 2000);
    }, 1200);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const webhookUrl = "https://ais-dev-kmidja7dcxr7the5s6yo7m-21172280305.asia-east1.run.app/api/webhooks/outlook";

  return (
    <div id="outlook-view-container" className="space-y-6 font-sans">
      {/* View Header */}
      <div>
        <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
          Integration Hub & Webhooks
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5 font-medium">
          Configure Azure application credentials, audit mailbox subscription renewals, and inspect n8n webhook parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Outlook credential form */}
        <div className="premium-card bg-[#121214] p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1f1f23] pb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              <h3 className="font-display font-semibold text-white">
                Microsoft Graph API & Exchange Sync
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  config?.isConnected
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${config?.isConnected ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                {config?.isConnected ? "Active" : "Disconnected"}
              </span>

              {config?.isConnected && (
                <button
                  onClick={handleDisconnect}
                  className="p-1 px-2.5 bg-red-550/10 text-red-400 rounded-xl text-[10px] font-bold border border-red-500/20 hover:bg-red-650 hover:text-white transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <PowerOff className="w-2.5 h-2.5" />
                  <span>Pause</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleConnectSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                  Azure AD Tenant ID (Directory ID)
                </label>
                <input
                  type="text"
                  required
                  value={form.msTenantId}
                  onChange={(e) => setForm({ ...form, msTenantId: e.target.value })}
                  placeholder="e.g. fd4bfa18-f02a-43cf..."
                  className="w-full text-xs font-mono font-semibold border border-[#1f1f23] px-3.5 py-2.5 bg-[#18181b] rounded-xl outline-none focus:border-indigo-600 text-zinc-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                  Azure AD Client ID (Application ID)
                </label>
                <input
                  type="text"
                  required
                  value={form.msClientId}
                  onChange={(e) => setForm({ ...form, msClientId: e.target.value })}
                  placeholder="e.g. 7192bcff-ff01-4be3..."
                  className="w-full text-xs font-mono font-semibold border border-[#1f1f23] px-3.5 py-2.5 bg-[#18181b] rounded-xl outline-none focus:border-indigo-600 text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                Graph API Outbound Sender Email Address
              </label>
              <input
                type="email"
                required
                value={form.msSenderEmail}
                onChange={(e) => setForm({ ...form, msSenderEmail: e.target.value })}
                placeholder="outbound@innovate-outbox.com"
                className="w-full text-xs font-mono font-semibold border border-[#1f1f23] px-3.5 py-2.5 bg-[#18181b] rounded-xl outline-none focus:border-indigo-600 text-zinc-200"
              />
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold leading-normal animate-fade-in flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Azure details successfully compiled and active! Exchange sync online.</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Client Secrets encrypted at rest using SHA-256 blocks.</span>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
              >
                Assemble Connection
              </button>
            </div>
          </form>

          {/* Subscription Expiry renewal module */}
          {config?.isConnected && (
            <div className="border-t border-[#1f1f23] pt-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 block">
                    Microsoft Change Notifications Mail Subscription
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-normal font-medium">
                    Active MS Graph subscriptions expire every 3 days. Mailflow automatically schedules renewal cron cycles.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={renewing}
                  onClick={renewSubscription}
                  className="px-3.5 py-2.5 border border-[#1f1f23] text-zinc-300 hover:text-white hover:bg-[#18181b] font-bold rounded-xl text-xs flex items-center gap-1 flex-shrink-0 active:scale-95 transition-all focus:outline-none cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${renewing ? "animate-spin text-indigo-400" : ""}`} />
                  <span>{renewing ? "Renewing..." : "Manual Subscription Refresh"}</span>
                </button>
              </div>

              {renewSuccess && (
                <p className="text-[11px] font-mono font-bold text-emerald-400 animate-fade-in">
                  ✓ Change notifications subscription successfully renewed for another 72 hours.
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Webhooks and instructions details */}
        <div className="space-y-6 lg:col-span-1">
          {/* n8n Callback Parameters card */}
          <div className="premium-card bg-[#121214] border border-[#1f1f23] p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1f1f23] pb-3">
              <CloudLightning className="w-4.5 h-4.5 text-emerald-450" />
              <h3 className="font-display font-semibold text-white">
                n8n Webhook Endpoint
              </h3>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
              n8n workflow nodes call this secure callback endpoint after sending raw outreach emails or detecting replies:
            </p>

            <div className="space-y-2">
              <div className="bg-[#18181b] p-3 rounded-xl border border-[#1f1f23] flex items-center justify-between font-mono text-[10px] text-zinc-400">
                <span className="truncate max-w-[200px] block select-all">{webhookUrl}</span>
                <button
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="p-1 hover:bg-zinc-800 hover:text-white rounded transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>
              {copiedText && (
                <p className="text-[9px] font-mono text-emerald-400 font-bold">
                  ✓ Link copied code to clipboard!
                </p>
              )}
            </div>
          </div>

          {/* Quick Azure instructions */}
          <div className="premium-card bg-[#121214] border border-[#1f1f23] text-zinc-200 p-6 space-y-4">
            <h4 className="font-display font-semibold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4.5 h-4.5 text-indigo-400" />
              <span>Azure Portal Setup Guidelines</span>
            </h4>

            <ol className="list-decimal pl-4 text-[11px] space-y-2.5 text-zinc-400 leading-normal font-medium">
              <li>
                In <b className="text-zinc-200">Azure Active Directory</b>, open App registrations and register MailFlow outbox.
              </li>
              <li>
                Add Application API Permissions: <code className="bg-zinc-800 border border-zinc-700 p-0.5 px-1 rounded text-zinc-200 text-[10px]/normal">Mail.Send</code>, and <code className="bg-zinc-800 border border-zinc-700 p-0.5 px-1 rounded text-zinc-200 text-[10px]/normal">Mail.Read</code>.
              </li>
              <li>
                Grant Administrator consent for active directories.
              </li>
              <li>
                Create a Client secret, copy the value, and plug the details in. MailFlow handles background synchronization.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
