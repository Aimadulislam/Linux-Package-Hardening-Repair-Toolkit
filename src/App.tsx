import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Terminal as TerminalIcon, 
  FileCode, 
  BrainCircuit, 
  HelpCircle, 
  ShieldCheck, 
  Download, 
  BookOpen, 
  CheckCircle,
  Copy
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import TerminalView from "./components/TerminalView";
import FileExplorer from "./components/FileExplorer";
import SecurityAdvisor from "./components/SecurityAdvisor";
import { SystemMetrics, FileNode, ToolkitOutputs } from "./types";

type Tab = "dashboard" | "console" | "editor" | "advisor" | "guide";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [outputs, setOutputs] = useState<ToolkitOutputs | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [logsContent, setLogsContent] = useState("");
  
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingOutputs, setLoadingOutputs] = useState(false);
  const [executingCmd, setExecutingCmd] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch("/api/system-health");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load metrics", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchFileTree = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/toolkit/files");
      if (res.ok) {
        const data = await res.json();
        setFileTree(data);
        
        // Auto-select config.conf by default if available
        if (!selectedFilePath && data.length > 0) {
          const configNode = data.find((n: any) => n.name === "config")?.children?.find((c: any) => c.name === "config.conf");
          if (configNode) {
            fetchFileContent(configNode.path);
          } else {
            const readmeNode = data.find((n: any) => n.name === "README.md");
            if (readmeNode) {
              fetchFileContent(readmeNode.path);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load file tree", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchOutputs = async () => {
    setLoadingOutputs(true);
    try {
      const res = await fetch("/api/toolkit/outputs");
      if (res.ok) {
        const data = await res.json();
        setOutputs(data);
      }
    } catch (err) {
      console.error("Failed to load outputs", err);
    } finally {
      setLoadingOutputs(false);
    }
  };

  const fetchFileContent = async (path: string) => {
    setSelectedFilePath(path);
    setSelectedFileContent(null);
    try {
      const res = await fetch(`/api/toolkit/file?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedFileContent(data.content);
      }
    } catch (err) {
      console.error("Failed to load file content", err);
    }
  };

  const saveFileContent = async (path: string, content: string) => {
    try {
      const res = await fetch("/api/toolkit/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content })
      });
      if (res.ok) {
        // Reload file tree inside list to sync details
        fetchFileTree();
        return { success: true, message: "File saved." };
      }
      const data = await res.json();
      return { success: false, message: data.error || "Save error." };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const executeToolkitCommand = async (command: string, osType: string) => {
    try {
      const res = await fetch("/api/toolkit/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, osType })
      });
      const data = await res.json();
      
      // Update local outputs
      fetchOutputs();
      
      // If we ran security, let's load the latest security log content for AI advisory
      if (command === "security" && data.stdout) {
        setLogsContent(data.stdout);
      }

      return data;
    } catch (err) {
      console.error("Command execution failure", err);
      return { stdout: "", stderr: "Internal server error.", code: 1 };
    }
  };

  const runQuickScan = async (cmd: "security" | "report") => {
    if (executingCmd) return;
    setExecutingCmd(cmd);
    try {
      const data = await executeToolkitCommand(cmd, metrics?.platform || "Linux");
      if (cmd === "security") {
        setLogsContent(data.stdout);
        // Switch to AI Advisor page to let users analyze the log automatically
        setActiveTab("advisor");
      } else {
        // Switch to dashboard to review reports lists
        setActiveTab("dashboard");
      }
    } catch {} finally {
      setExecutingCmd(null);
    }
  };

  // Run initial queries
  useEffect(() => {
    fetchMetrics();
    fetchFileTree();
    fetchOutputs();
  }, []);

  const downloadFullBundle = () => {
    window.open("/api/toolkit/download", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-[#111827] border-b border-slate-800/80 px-6 py-4 sticky top-0 z-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              Linux Package Hardening & Repair Toolkit
            </h1>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
              Production-Ready Automation Suite
            </p>
          </div>
        </div>

        {/* Global Export actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={downloadFullBundle}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition duration-150"
          >
            <Download className="w-3.5 h-3.5" />
            Download Toolkit (.tar.gz)
          </button>
        </div>
      </header>

      {/* Primary Sub-Navigation Tab Panel */}
      <div className="bg-[#111827]/40 border-b border-slate-800/60 px-6 py-2 flex gap-1 overflow-x-auto select-none scrollbar-none">
        {(
          [
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "console", label: "CLI Console", icon: TerminalIcon },
            { id: "editor", label: "File Explorer & Editor", icon: FileCode },
            { id: "advisor", label: "AI Advisor", icon: BrainCircuit },
            { id: "guide", label: "Setup Guide", icon: BookOpen }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition duration-150 whitespace-nowrap ${
                isActive 
                  ? "bg-slate-800 text-white font-bold" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Core Tab Component Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === "dashboard" && (
          <Dashboard
            metrics={metrics}
            outputs={outputs}
            loadingMetrics={loadingMetrics}
            onRefreshMetrics={fetchMetrics}
            onRunQuickScan={runQuickScan}
            executingCmd={executingCmd}
          />
        )}

        {activeTab === "console" && (
          <TerminalView
            onExecuteCommand={executeToolkitCommand}
            onRefreshOutputs={fetchOutputs}
          />
        )}

        {activeTab === "editor" && (
          <FileExplorer
            files={fileTree}
            onSelectFile={fetchFileContent}
            selectedFilePath={selectedFilePath}
            selectedFileContent={selectedFileContent}
            onSaveFile={saveFileContent}
            loadingFiles={loadingFiles}
            onRefreshFiles={fetchFileTree}
          />
        )}

        {activeTab === "advisor" && (
          <SecurityAdvisor
            metrics={metrics}
            logsContent={logsContent}
          />
        )}

        {activeTab === "guide" && <SetupGuide />}
      </main>

      {/* Universal professional credit footer */}
      <footer className="bg-[#111827]/10 border-t border-slate-800/40 py-5 text-center text-xs text-slate-500">
        Linux Package Hardening & Repair Toolkit v1.2.0 | Standard Open-Source Compliance (MIT License)
      </footer>
    </div>
  );
}

// Markdown-style static Setup & Installation Guide
function SetupGuide() {
  const [copiedInstall, setCopiedInstall] = useState(false);
  
  const copyCommand = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const codeString = `git clone https://github.com/username/linux-hardening-toolkit.git
cd linux-hardening-toolkit
sudo ./install.sh`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BookOpen className="text-indigo-400 w-6 h-6" />
          Server Deployment & Installation Manual
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Follow these standard guidelines to deploy the security automation toolkit onto real production systems.
        </p>
      </div>

      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 space-y-6">
        {/* Quick clone installation block */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">1. Server Quick Install</h3>
            <button
              onClick={() => copyCommand(codeString)}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {copiedInstall ? "Copied!" : "Copy Commands"}
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-300 font-mono text-xs p-4 rounded-lg border border-slate-800 leading-relaxed overflow-x-auto select-text">
            {codeString}
          </pre>
        </div>

        {/* Configuration manual */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">2. Configuration Options</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The toolkit reads directives from <code className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">/etc/hardening-toolkit/config.conf</code>. Key directives include:
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1.5 leading-relaxed">
            <li><strong className="text-slate-300 font-semibold">BACKUP_DIR</strong>: Location to store compressed states (defaults to <code className="font-mono text-indigo-400">/var/backups/hardening-toolkit</code>).</li>
            <li><strong className="text-slate-300 font-semibold">LOG_DIR</strong>: Logging traces outputs (defaults to <code className="font-mono text-indigo-400">/var/log/hardening-toolkit</code>).</li>
            <li><strong className="text-slate-300 font-semibold">ENABLE_TERMINAL_NOTIFICATIONS</strong>: Output styled unicode banners in terminal.</li>
            <li><strong className="text-slate-300 font-semibold">AUTO_REBOOT_ON_KERNEL_UPDATE</strong>: Forces automated restarts if kernel updates are identified.</li>
          </ul>
        </div>

        {/* CLI Subcommands summary table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">3. CLI Command Guide</h3>
          <p className="text-xs text-slate-400">
            Once installed, you can trigger operations globally by prefixing command arguments:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="py-2.5 px-3 text-slate-300 font-semibold">Command</th>
                  <th className="py-2.5 px-3 text-slate-300 font-semibold">Description</th>
                  <th className="py-2.5 px-3 text-slate-300 font-semibold">Target Managers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                <tr>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">sudo toolkit update</td>
                  <td className="py-2.5 px-3 text-slate-400">Syncs metadata archives & packages repositories</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">apt, dnf, yum, pacman, zypper</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">sudo toolkit upgrade</td>
                  <td className="py-2.5 px-3 text-slate-400">Upgrades packages cleanly (add --dist for distro-upgrade)</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">apt, dnf, yum, pacman, zypper</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">sudo toolkit repair</td>
                  <td className="py-2.5 px-3 text-slate-400">Resolves broken symbols, reconfigures, clears locks</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">apt, dnf, yum, pacman, zypper</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">sudo toolkit cleanup</td>
                  <td className="py-2.5 px-3 text-slate-400">Removes orphan package trees and clears disk caching</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">apt, dnf, yum, pacman, zypper</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">sudo toolkit security</td>
                  <td className="py-2.5 px-3 text-slate-400">Audits SUID, world-writable logs, SSH configuration checks</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">all systems</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">sudo toolkit report</td>
                  <td className="py-2.5 px-3 text-slate-400">Compiles detailed plain text, markdown, & HTML diagnostics</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">all systems</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
