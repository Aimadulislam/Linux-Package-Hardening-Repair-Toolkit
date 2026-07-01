import React, { useState, useEffect } from "react";
import { Folder, File, Save, CheckCircle, AlertTriangle, ChevronRight, ChevronDown, RefreshCw, FileText } from "lucide-react";
import { FileNode } from "../types";

interface FileExplorerProps {
  files: FileNode[];
  onSelectFile: (path: string) => void;
  selectedFilePath: string | null;
  selectedFileContent: string | null;
  onSaveFile: (path: string, content: string) => Promise<{ success: boolean; message: string }>;
  loadingFiles: boolean;
  onRefreshFiles: () => void;
}

export default function FileExplorer({
  files,
  onSelectFile,
  selectedFilePath,
  selectedFileContent,
  onSaveFile,
  loadingFiles,
  onRefreshFiles
}: FileExplorerProps) {
  const [editorContent, setEditorContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Synchronize editor content when selected file changes
  useEffect(() => {
    if (selectedFileContent !== null) {
      setEditorContent(selectedFileContent);
    } else {
      setEditorContent("");
    }
    setSaveStatus(null);
  }, [selectedFileContent, selectedFilePath]);

  const handleSave = async () => {
    if (!selectedFilePath || saving) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await onSaveFile(selectedFilePath, editorContent);
      if (res.success) {
        setSaveStatus({ type: "success", msg: "File saved and permissions verified." });
      } else {
        setSaveStatus({ type: "error", msg: res.message || "Failed to save file." });
      }
    } catch (err: any) {
      setSaveStatus({ type: "error", msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Render file tree recursively
  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      const isSelected = selectedFilePath === node.path;
      if (node.type === "directory") {
        return (
          <DirectoryNode
            key={node.path}
            node={node}
            depth={depth}
            renderTree={renderTree}
            onSelectFile={onSelectFile}
            selectedFilePath={selectedFilePath}
          />
        );
      } else {
        return (
          <button
            key={node.path}
            onClick={() => onSelectFile(node.path)}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            className={`w-full flex items-center gap-2 py-1.5 pr-3 text-left text-xs font-mono transition border-l-2 ${
              isSelected 
                ? "bg-indigo-500/10 text-white border-indigo-500 font-semibold" 
                : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            <File className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
            <span className="truncate">{node.name}</span>
          </button>
        );
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="text-indigo-400 w-6 h-6" />
            File Explorer & Code Editor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspect, customize, and edit script components of the open-source toolkit repository on the disk.
          </p>
        </div>

        <button
          onClick={onRefreshFiles}
          disabled={loadingFiles}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loadingFiles ? "animate-spin" : ""}`} />
          Sync Repository
        </button>
      </div>

      {/* Main interface layout: Left Sidebar Tree / Right Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Tree Explorer (1 col) */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 h-[500px] overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold border-b border-slate-800 pb-2 mb-2 select-none">
            <span>REPOSITORY BROWSER</span>
            <span className="text-[10px] text-indigo-400">linux-hardening-toolkit/</span>
          </div>

          <div className="flex-1 space-y-0.5">
            {loadingFiles ? (
              <div className="space-y-3 py-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-5 bg-slate-800/60 rounded w-full" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">Failed to scan local repository directories.</p>
            ) : (
              renderTree(files)
            )}
          </div>
        </div>

        {/* Right Code Editor View (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {selectedFilePath ? (
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl flex flex-col h-[500px]">
              {/* Editor Header */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400">File Path: </span>
                  <span className="text-xs font-mono text-white font-semibold">{selectedFilePath}</span>
                </div>

                <div className="flex items-center gap-3">
                  {saveStatus && (
                    <span className={`text-xs flex items-center gap-1 ${saveStatus.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                      {saveStatus.type === "success" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {saveStatus.msg}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving..." : "Save File"}
                  </button>
                </div>
              </div>

              {/* Editor Workspace Area */}
              <div className="flex-1 flex bg-slate-950">
                {/* Visual Line numbers column */}
                <div className="w-12 bg-slate-900/40 border-r border-slate-800 py-4 select-none font-mono text-slate-600 text-right pr-3 space-y-1 text-xs">
                  {Array.from({ length: editorContent.split("\n").length || 1 }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Textarea code field */}
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="flex-1 bg-transparent text-slate-200 font-mono text-xs p-4 outline-none resize-none leading-relaxed selection:bg-slate-700 select-text focus:ring-0 focus:outline-none"
                  spellCheck="false"
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/35 rounded-xl border border-slate-800/80 p-12 text-center h-[500px] flex flex-col justify-center items-center">
              <File className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Script File Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Click on any file inside the repository browser tree sidebar on the left to review, customize, or save changes immediately to the disk.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DirectoryNodeProps {
  node: FileNode;
  depth: number;
  renderTree: (nodes: FileNode[], depth?: number) => React.ReactNode;
  onSelectFile: (path: string) => void;
  selectedFilePath: string | null;
}

// Collapsible Directory Node Component for Tree structure
const DirectoryNode: React.FC<DirectoryNodeProps> = ({
  node,
  depth,
  renderTree,
  onSelectFile,
  selectedFilePath
}) => {
  const [isOpen, setIsOpen] = useState(depth === 0 || node.name === "scripts" || node.name === "config");

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className="w-full flex items-center gap-1.5 py-1.5 pr-3 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800/30 rounded transition"
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        <Folder className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/10" />
        <span className="truncate">{node.name}</span>
      </button>

      {isOpen && node.children && (
        <div className="space-y-0.5">
          {renderTree(node.children, depth + 1)}
        </div>
      )}
    </div>
  );
}
