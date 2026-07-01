// Shared TypeScript Types
// Location: /src/types.ts

export interface SystemMetrics {
  uptime: string;
  kernel: string;
  cpuModel: string;
  memory: {
    total: string;
    free: string;
    available: string;
  };
  diskUsage: string;
  toolkitSize: string;
  platform: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
}

export interface ToolkitOutputItem {
  name: string;
  size: number;
  mtime: string;
}

export interface ToolkitOutputs {
  logs: ToolkitOutputItem[];
  backups: ToolkitOutputItem[];
  reports: ToolkitOutputItem[];
}

export interface TerminalCommand {
  input: string;
  output: string;
  timestamp: string;
  success: boolean;
}
