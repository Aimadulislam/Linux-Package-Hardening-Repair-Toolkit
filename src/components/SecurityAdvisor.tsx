import React, { useState, useEffect } from "react";
import { Sparkles, ShieldCheck, FileSearch, ShieldAlert, Cpu, Layers, Copy, CheckCircle, BrainCircuit } from "lucide-react";
import { SystemMetrics } from "../types";

interface SecurityAdvisorProps {
  metrics: SystemMetrics | null;
  logsContent: string;
}

export default function SecurityAdvisor({ metrics, logsContent }: SecurityAdvisorProps) {
  const [scanLog, setScanLog] = useState("");
  const [advisoryReport, setAdvisoryReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync scan log when global script outputs update
  useEffect(() => {
    if (logsContent) {
      setScanLog(logsContent);
    }
  }, [logsContent]);

  const handleRunAdvisor = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    setAdvisoryReport(null);

    try {
      const response = await fetch("/api/advisor/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInfo: metrics,
          scanLog: scanLog || "No logs. General audit recommendations."
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to contact advisor backend.");
      }

      const data = await response.json();
      setAdvisoryReport(data.advisory);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch security recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!advisoryReport) return;
    navigator.clipboard.writeText(advisoryReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BrainCircuit className="text-indigo-400 w-6.5 h-6.5" />
            AI Cybersecurity Advisor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Leverage Google Gemini AI model on the server to parse local security audits and generate tailored hardening recommendations.
          </p>
        </div>
      </div>

      {/* Main Grid: Input logs / Output Report */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Input Section (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-indigo-400" />
              Audit Source Log Input
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste logs from any manual audit command, or let the tool use recent outputs from running the local <strong>toolkit security</strong> subcommand.
            </p>

            <textarea
              value={scanLog}
              onChange={(e) => setScanLog(e.target.value)}
              placeholder="Paste security audit scans, SUID listings, or sshd configurations here to trigger AI advice..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs rounded-lg p-3.5 h-[280px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />

            <button
              onClick={handleRunAdvisor}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              {loading ? "Analyzing Audit Data..." : "Analyze with Gemini AI"}
            </button>
          </div>

          {/* Prompt Guidelines */}
          <div className="bg-slate-800/10 p-4 rounded-xl border border-slate-700/20 text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300 block mb-1">What the AI advisor does:</span>
            - Identifies potential privilege escalations from SUID parameters.<br />
            - Audits SSH daemon settings and passwords risks.<br />
            - Evaluates kernel network protection parameters.<br />
            - Drafts a copyable, bespoke custom bash script to resolve identified issues.
          </div>
        </div>

        {/* Right Output Advisor Report Section (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden min-h-[460px] flex flex-col">
            {/* Header tab */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Tailored Hardening Advisory
              </span>

              {advisoryReport && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Advisory"}
                </button>
              )}
            </div>

            {/* Markdown advisory report result content */}
            <div className="flex-1 p-5 overflow-y-auto text-slate-300 text-xs leading-relaxed selection:bg-slate-700 select-text max-h-[440px]">
              {loading ? (
                <div className="space-y-4 py-12 text-center">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Gemini AI is analyzing logs and crafting recommendations...</p>
                </div>
              ) : errorMsg ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs">Analysis Error</p>
                    <p className="text-[11px] mt-1">{errorMsg}</p>
                  </div>
                </div>
              ) : advisoryReport ? (
                <div className="prose prose-invert prose-xs max-w-none space-y-4">
                  {/* Basic parsing helper for display of markdown layout */}
                  {advisoryReport.split("\n").map((line, idx) => {
                    if (line.startsWith("# ")) {
                      return <h2 key={idx} className="text-base font-bold text-white border-b border-slate-800 pb-2 mt-4">{line.replace("# ", "")}</h2>;
                    }
                    if (line.startsWith("## ")) {
                      return <h3 key={idx} className="text-sm font-bold text-indigo-400 mt-4">{line.replace("## ", "")}</h3>;
                    }
                    if (line.startsWith("### ")) {
                      return <h4 key={idx} className="text-xs font-bold text-slate-200 mt-2">{line.replace("### ", "")}</h4>;
                    }
                    if (line.startsWith("```")) {
                      return null; // hide backticks code tags in text flow
                    }
                    if (line.startsWith("- ") || line.startsWith("* ")) {
                      return <li key={idx} className="ml-4 list-disc text-slate-300">{line.replace(/^[-*]\s+/, "")}</li>;
                    }
                    return <p key={idx} className="text-slate-300">{line}</p>;
                  })}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <ShieldCheck className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No Advisory compiled yet.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Provide log files on the left and click "Analyze with Gemini AI" to trigger.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
