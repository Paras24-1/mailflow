"use client";
import React, { useState } from "react";
import {
  Users,
  Send,
  Mail,
  MessageSquare,
  Clock,
  ExternalLink,
  Ban,
  CircleDot
} from "lucide-react";

interface DashboardStats {
  totalLeadsCount: number;
  dncCount: number;
  activeSequencesCount: number;
  repliedSequencesCount: number;
  completedSequencesCount: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  totalReplies: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  stepStats: {
    step1Sent: number;
    step1Open: number;
    step1Reply: number;
    step2Sent: number;
    step2Open: number;
    step2Reply: number;
    step3Sent: number;
    step3Open: number;
    step3Reply: number;
  };
  recentEvents: any[];
}

interface DashboardViewProps {
  stats: DashboardStats | null;
  onPageChange: (page: string) => void;
}

export default function DashboardView({
  stats,
  onPageChange
}: DashboardViewProps) {
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium font-mono text-zinc-400">Loading live analytics data...</p>
      </div>
    );
  }

  // Define metric cards
  const cards = [
    {
      title: "Active Pipelines",
      value: stats.activeSequencesCount,
      icon: CircleDot,
      color: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
      desc: `${stats.repliedSequencesCount} already replied`,
      target: "leads"
    },
    {
      title: "Total Emails Dispatched",
      value: stats.totalEmailsSent,
      icon: Send,
      color: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
      desc: "Combined across all sequences",
      target: "leads"
    },
    {
      title: "Suppressed (DNC)",
      value: stats.dncCount,
      icon: Ban,
      color: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
      desc: "Opt-outs & bounced exclusion",
      target: "dnc"
    },
    {
      title: "Conversion (Replies)",
      value: stats.totalReplies,
      icon: MessageSquare,
      color: "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20",
      desc: `Avg reply index is ${stats.replyRate}%`,
      target: "replies"
    }
  ];

  return (
    <div id="dashboard-view-container" className="space-y-8 animate-fade-in font-sans">
      {/* Upper header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold text-white tracking-tight">
            Outreach Hub Overview
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5 font-medium">
            Real-time delivery rates, sequence progression and active lead telemetry.
          </p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => onPageChange(card.target)}
              className="premium-card p-6 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white tracking-tight font-display mb-1.5">
                  {card.value}
                </h3>
                <p className="text-xs text-zinc-400 font-semibold">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analysis Section: Rates Conversion Index */}
      <div className="premium-card p-6">
        <div className="mb-6">
          <h3 className="font-display font-semibold text-white mb-1">Outreach Rate Metrics</h3>
          <p className="text-xs text-zinc-400 font-medium font-sans">Interaction conversions per sent package.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Open Rate Meter */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5 font-sans">
              <span className="text-zinc-400 font-semibold">Open Rate Index</span>
              <span className="font-bold text-zinc-200 font-mono">{stats.openRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1c1c1f] overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500 animate-pulse"
                style={{ width: `${stats.openRate}%` }}
              />
            </div>
          </div>

          {/* Click Rate Meter */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5 font-sans">
              <span className="text-zinc-400 font-semibold">Click-Through Rate</span>
              <span className="font-bold text-zinc-200 font-mono">{stats.clickRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1c1c1f] overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.clickRate}%` }}
              />
            </div>
          </div>

          {/* Reply Rate Meter */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5 font-sans">
              <span className="text-zinc-400 font-semibold">Prospect Positive Reply Rate</span>
              <span className="font-bold text-zinc-200 font-mono">{stats.replyRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1c1c1f] overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.replyRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick info footer */}
        <div className="border-t border-[#1f1f23] mt-6 pt-4 text-[10px] flex items-center gap-2 text-zinc-500 leading-normal font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Telemetry calculated from active campaigns logging.</span>
        </div>
      </div>

      {/* Under Section: Recent Live Audit Stream */}
      <div className="premium-card p-6">
        <div className="mb-4">
          <h3 className="font-display font-semibold text-white">Campaign Dispatch & Activity Stream</h3>
          <p className="text-xs text-zinc-400 font-medium">Real-time audit trailing of outbound mail events logged by MailFlow.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="text-[10px] uppercase font-mono bg-[#121214] border-y border-[#1f1f23] text-zinc-500">
              <tr>
                <th className="py-3 px-4 font-bold">Lead Address</th>
                <th className="py-3 px-4 font-bold">Activity</th>
                <th className="py-3 px-4 font-bold">Phase</th>
                <th className="py-3 px-4 font-bold">Subject Context</th>
                <th className="py-3 px-4 font-bold">Occurred At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] font-sans">
              {stats.recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center font-mono text-zinc-500">
                    No outbound events captured. Launch a campaign to view logs.
                  </td>
                </tr>
              ) : (
                stats.recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-200 font-mono">
                      {evt.toEmail}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-[9px] border ${
                          evt.eventType === "replied"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : evt.eventType === "opened"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : evt.eventType === "clicked"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            evt.eventType === "replied"
                              ? "bg-emerald-400 animate-pulse"
                              : evt.eventType === "opened"
                              ? "bg-blue-400"
                              : evt.eventType === "clicked"
                              ? "bg-amber-400"
                              : "bg-zinc-500"
                          }`}
                        />
                        {evt.eventType.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-300">
                      Step {evt.step}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate">
                      {evt.subject}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                      {new Date(evt.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
