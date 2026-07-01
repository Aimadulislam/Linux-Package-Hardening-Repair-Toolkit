import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Layers, 
  ShieldAlert, 
  Terminal, 
  FolderSync, 
  RotateCw, 
  Play, 
  FileText, 
  Download, 
  FileCode,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { SystemMetrics, ToolkitOutputs } from "../types";

interface DashboardProps {
  metrics: SystemMetrics | null;
  outputs: ToolkitOutputs | null;
  loadingMetrics: boolean;
  onRefreshMetrics: () => void;
  onRunQuickScan: (cmd: "security" | "report") => void;
  executingCmd: string | null;
}

export default function Dashboard({
  metrics,
  outputs,
  loadingMetrics,
  onRefreshMetrics,
  onRunQuickScan,
  executingCmd
}: DashboardProps) {
  // Parse disk percentage from df -h output
  const getDiskPercentage = (): number => {
    if (!metrics?.diskUsage) return 15; // fallback
    const lines = metrics.diskUsage.split("\n");
    if (lines.length < 2) return 15;
    const columns = lines[1].trim().split(/\s+/);
    // Usually percentage is in col 4 or 5 (e.g. "45%")
    const pctCol = columns.find((col) => col.includes("%"));
    if (pctCol) {
      return parseInt(pctCol.replace("%", ""), 10);
    }
    return 15;
  };

  const diskPct = getDiskPercentage();

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="text-emerald-500 w-6 h-6 animate-pulse" />
            Toolkit Diagnostic Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time server container diagnostics and package management health overview.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshMetrics}
            disabled={loadingMetrics}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingMetrics ? "animate-spin" : ""}`} />
            Refresh Diagnostics
          </button>
        </div>
      </div>

      {/* Grid: Server Health Indicators */}
      {loadingMetrics || !metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-800/50 rounded-xl border border-slate-700/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card: CPU & Platform */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-5 flex items-start gap-4 hover:border-slate-600/60 transition">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium">Processor & Environment</p>
              <h3 className="text-base font-semibold text-white truncate max-w-[200px]" title={metrics.cpuModel}>
                {metrics.cpuModel}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{metrics.platform}</p>
            </div>
          </div>

          {/* Card: Memory Stats */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-5 flex items-start gap-4 hover:border-slate-600/60 transition">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1 w-full">
              <p className="text-xs text-slate-400 font-medium">Memory Allocation</p>
              <div className="flex justify-between text-sm text-white font-semibold">
                <span>Free: {metrics.memory.available}</span>
                <span className="text-xs text-slate-400">Total: {metrics.memory.total}</span>
              </div>
              {/* Dummy slider for visual polish */}
              <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
          </div>

          {/* Card: Disk Usage */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 p-5 flex items-start gap-4 hover:border-slate-600/60 transition">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <HardDrive className="w-6 h-6" />
            </div>
            <div className="space-y-1 w-full">
              <p className="text-xs text-slate-400 font-medium">Disk Partition Space</p>
              <div className="flex justify-between text-sm text-white font-semibold">
                <span>Active Disk Usage</span>
                <span className="font-mono text-cyan-400">{diskPct}%</span>
              </div>
              <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${diskPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Actions & Output Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Easy Command Trigger Panels */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Quick Actions Panel
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              These operations execute directly on the local sandbox container to perform real diagnostic auditing or report compilations.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => onRunQuickScan("security")}
                disabled={!!executingCmd}
                className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Run Cybersecurity Audit</p>
                    <p className="text-[10px] text-slate-500">SUID files, SSH config, Sysctl security</p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
              </button>

              <button
                onClick={() => onRunQuickScan("report")}
                disabled={!!executingCmd}
                className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500/50 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Compile Diagnostics Report</p>
                    <p className="text-[10px] text-slate-500">HTML, MD, & TXT health summaries</p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
              </button>
            </div>

            {executingCmd && (
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-3.5 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs text-slate-300">Executing `toolkit {executingCmd}`...</span>
              </div>
            )}
          </div>

          {/* Quick Technical Specs Info */}
          <div className="bg-slate-800/20 rounded-xl border border-slate-700/30 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-slate-300">Toolkit Local Info</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/40 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">UPTIME</span>
                <span className="text-slate-300 font-semibold">{metrics?.uptime || "Loading..."}</span>
              </div>
              <div className="bg-slate-800/40 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">KERNEL</span>
                <span className="text-slate-300 font-mono text-[11px]">{metrics?.kernel || "Loading..."}</span>
              </div>
              <div className="bg-slate-800/40 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">WORKSPACE SIZE</span>
                <span className="text-slate-300 font-mono">{metrics?.toolkitSize || "Loading..."}</span>
              </div>
              <div className="bg-slate-800/40 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">COMPATIBILITY</span>
                <span className="text-slate-300">11+ Linux Distros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Lists (Backups, Reports, logs) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Section: Diagnostic Reports List */}
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Generated Security Reports
              </h2>
              <span className="text-slate-500 text-xs font-mono">reports/</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {!outputs?.reports || outputs.reports.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/40 rounded-lg border border-dashed border-slate-700">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No diagnostic reports compiled yet.</p>
                  <p className="text-[10px] text-slate-500 mt-1">Click "Compile Diagnostics Report" to generate one.</p>
                </div>
              ) : (
                outputs.reports.map((report) => (
                  <div
                    key={report.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/70 border border-slate-700 hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4.5 h-4.5 text-cyan-400" />
                      <div>
                        <p className="text-xs text-slate-200 font-semibold truncate max-w-[240px] md:max-w-xs">{report.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(report.mtime).toLocaleString()} | {(report.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                      {report.name.split(".").pop()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grid: Secondary Logs & Backups lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Backups Panel */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderSync className="w-3.5 h-3.5 text-indigo-400" />
                State Backups
              </h3>
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {!outputs?.backups || outputs.backups.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-4 text-center">No backups stored inside backups/</p>
                ) : (
                  outputs.backups.map((bk) => (
                    <div key={bk.name} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700 text-xs">
                      <div className="truncate max-w-[140px]" title={bk.name}>{bk.name}</div>
                      <span className="text-[10px] text-slate-500">{(bk.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Logs Panel */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Toolkit Event Logs
              </h3>
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {!outputs?.logs || outputs.logs.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-4 text-center">No script execution logs recorded.</p>
                ) : (
                  outputs.logs.map((log) => (
                    <div key={log.name} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700 text-xs">
                      <div className="truncate max-w-[140px]" title={log.name}>{log.name}</div>
                      <span className="text-[10px] text-slate-500">{(log.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
