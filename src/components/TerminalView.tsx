import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Sparkles, Cpu, AlertTriangle, Play, HelpCircle } from "lucide-react";

interface TerminalViewProps {
  onExecuteCommand: (cmd: string, os: string) => Promise<{ stdout: string; stderr: string; code: number }>;
  onRefreshOutputs: () => void;
}

export default function TerminalView({ onExecuteCommand, onRefreshOutputs }: TerminalViewProps) {
  const [selectedOS, setSelectedOS] = useState("Ubuntu 24.04 LTS");
  const [cliInput, setCliInput] = useState("");
  const [terminalLog, setTerminalLog] = useState<string[]>([
    "===========================================================",
    " 🛡️  Welcome to the Linux Hardening & Repair Toolkit CLI Console",
    "===========================================================",
    "Detected Operating System: Ubuntu 24.04 LTS",
    "Active Package Manager: apt-get (Debian-based)",
    "Type 'toolkit --help' to view all subcommands.",
    "Try running any command using the fast triggers below!",
    ""
  ]);
  const [executing, setExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Map OS names to package managers for high-fidelity outputs
  const getPackageManager = (os: string) => {
    if (os.includes("Ubuntu") || os.includes("Debian") || os.includes("Mint") || os.includes("Kali")) return "apt";
    if (os.includes("Fedora") || os.includes("Rocky") || os.includes("Alma") || os.includes("CentOS")) return "dnf";
    if (os.includes("Arch") || os.includes("Manjaro")) return "pacman";
    if (os.includes("SUSE")) return "zypper";
    return "unknown";
  };

  const handleOsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const os = e.target.value;
    setSelectedOS(os);
    const pm = getPackageManager(os);
    setTerminalLog((prev) => [
      ...prev,
      `>>> Environment Switched to: ${os}`,
      `Detected Package Manager: ${pm}`,
      ""
    ]);
  };

  // Scroll to bottom of terminal when logs update
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLog]);

  const runCommand = async (fullCmd: string) => {
    if (executing) return;
    setExecuting(true);
    setTerminalLog((prev) => [...prev, `$ ${fullCmd}`]);

    // Parse toolkit commands
    const cleanCmd = fullCmd.trim();
    if (!cleanCmd.startsWith("toolkit ") && cleanCmd !== "toolkit") {
      setTerminalLog((prev) => [
        ...prev,
        "Error: Command must start with 'toolkit' binary name. Try 'toolkit --help'",
        ""
      ]);
      setExecuting(false);
      return;
    }

    const subCommand = cleanCmd.replace("toolkit", "").trim();
    if (!subCommand || subCommand === "-h" || subCommand === "--help") {
      // Print help summary in terminal
      setTerminalLog((prev) => [
        ...prev,
        "Linux Package Hardening & Repair Toolkit CLI Helper",
        "Usage: toolkit <subcommand> [options]",
        "",
        "Available Subcommands:",
        "  update             Refresh repositories metadata databases.",
        "  upgrade            Run safe package upgrades (--dist for distro-upgrade).",
        "  repair             Scan for and repair broken dependencies.",
        "  cleanup            Purge old package caches, locks, and orphans.",
        "  backup             Create timestamped compressed backups.",
        "  restore            Restore package state from tar.gz backups.",
        "  security           Audit SSH config, SUID files, and sysctl keys.",
        "  report             Generate plain text, markdown, and HTML reports.",
        "  menu               Launch the interactive menu wizard.",
        "",
        "Global Options:",
        "  --dry-run          Simulate transaction steps without applying changes.",
        "  --verbose          Print trace lines during command executions.",
        ""
      ]);
      setExecuting(false);
      return;
    }

    // Call API executor for authorized commands
    const allowed = ["update", "upgrade", "repair", "cleanup", "security", "report", "backup", "restore"];
    const parsedSub = subCommand.split(" ")[0]; // get the command name

    if (!allowed.includes(parsedSub)) {
      setTerminalLog((prev) => [
        ...prev,
        `Command '${parsedSub}' is not allowed or supported via the web interface.`,
        "Supported subcommands: update, upgrade, repair, cleanup, security, report, backup, restore",
        ""
      ]);
      setExecuting(false);
      return;
    }

    // Show simulated loader
    setTerminalLog((prev) => [...prev, `[i] Sourcing helpers.sh for ${selectedOS}...`, `[i] Sourcing config/config.conf...`]);

    try {
      const response = await onExecuteCommand(parsedSub, selectedOS);
      
      // Clean outputs to print nicely
      const stdoutLines = response.stdout ? response.stdout.split("\n") : [];
      const stderrLines = response.stderr ? response.stderr.split("\n") : [];

      setTerminalLog((prev) => [
        ...prev,
        ...stdoutLines,
        ...stderrLines,
        `Exit Code: ${response.code} (${response.code === 0 ? "SUCCESS" : "FAILED"})`,
        ""
      ]);

      // Trigger callback to reload backups and reports if needed
      onRefreshOutputs();
    } catch (err: any) {
      setTerminalLog((prev) => [...prev, `Execution error: ${err.message}`, ""]);
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    runCommand(cliInput);
    setCliInput("");
  };

  const fastTriggers = [
    { label: "Check Help", cmd: "toolkit --help" },
    { label: "Update Repos", cmd: "toolkit update" },
    { label: "Safe Upgrade", cmd: "toolkit upgrade" },
    { label: "Repair DB & Locks", cmd: "toolkit repair" },
    { label: "Clean Orphans", cmd: "toolkit cleanup" },
    { label: "Security Audit", cmd: "toolkit security" },
    { label: "Create Backup", cmd: "toolkit backup" },
    { label: "Compile Report", cmd: "toolkit report" }
  ];

  return (
    <div className="space-y-5">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="text-indigo-400 w-6 h-6" />
            Interactive CLI Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate and execute real toolkit subcommands inside your targeted operating environments.
          </p>
        </div>

        {/* Operating System Targets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Target Platform:</span>
          <select
            value={selectedOS}
            onChange={handleOsChange}
            disabled={executing}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option>Ubuntu 24.04 LTS</option>
            <option>Debian 12 Bookworm</option>
            <option>Linux Mint 21</option>
            <option>Kali Linux Security</option>
            <option>Fedora 40 Workstation</option>
            <option>Rocky Linux 9 (RHEL)</option>
            <option>Arch Linux (Rolling)</option>
            <option>OpenSUSE Leap 15.6</option>
          </select>
        </div>
      </div>

      {/* Grid structure: Console terminal and shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Terminal Box (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-black rounded-xl border border-slate-800 shadow-2xl flex flex-col h-[460px] overflow-hidden">
            {/* Terminal Window Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">bash - toolkit-runner@{selectedOS.toLowerCase().split(" ")[0]}</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">
                {getPackageManager(selectedOS)} PM
              </span>
            </div>

            {/* Terminal Screen Logs */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-1.5 selection:bg-slate-700 select-text">
              {terminalLog.map((line, idx) => {
                // Formatting for console log cues
                let colorClass = "text-slate-300";
                if (line.startsWith("$ ")) colorClass = "text-emerald-400 font-bold";
                else if (line.startsWith("✔") || line.includes("SUCCESS")) colorClass = "text-emerald-400";
                else if (line.startsWith("ℹ") || line.startsWith("[i]")) colorClass = "text-cyan-400";
                else if (line.startsWith("⚠") || line.includes("Warning:")) colorClass = "text-yellow-400";
                else if (line.startsWith("✘") || line.includes("Error:") || line.includes("FAILED")) colorClass = "text-red-400";
                else if (line.startsWith("===")) colorClass = "text-indigo-400";

                return (
                  <div key={idx} className={`${colorClass} whitespace-pre-wrap leading-relaxed break-all`}>
                    {line}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Input field */}
            <form onSubmit={handleSubmit} className="bg-slate-950 border-t border-slate-800 flex items-center px-4 py-2.5">
              <span className="text-emerald-500 font-mono font-bold mr-2 select-none">$</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                disabled={executing}
                placeholder={executing ? "Executing toolkit script..." : "toolkit subcommand [options]"}
                className="flex-1 bg-transparent font-mono text-xs text-slate-100 outline-none placeholder-slate-600 focus:ring-0"
              />
              <button
                type="submit"
                disabled={executing || !cliInput.trim()}
                className="p-1 text-slate-500 hover:text-emerald-400 transition disabled:opacity-30"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Shortcuts Panel (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Interactive Triggers
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Click any button below to instantly populate and run standard toolkit maintenance operations.
            </p>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {fastTriggers.map((trig) => (
                <button
                  key={trig.cmd}
                  onClick={() => runCommand(trig.cmd)}
                  disabled={executing}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-xs font-mono text-slate-300 hover:text-white transition disabled:opacity-50"
                >
                  {trig.cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Guidelines notes */}
          <div className="bg-slate-800/10 p-4 rounded-xl border border-slate-700/20 text-xs space-y-1.5 text-slate-400">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              Usage Instructions
            </h4>
            <p className="leading-relaxed text-[11px]">
              Subcommands run inside a secure sandbox. Script actions verify non-root contexts safely and adapt backends dynamically using targeted distribution triggers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
