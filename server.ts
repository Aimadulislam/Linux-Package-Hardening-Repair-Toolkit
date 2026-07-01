import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in AI Studio Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Ensure local directories exist for logs, backups, and reports
const TOOLKIT_ROOT = path.join(process.cwd(), "linux-hardening-toolkit");
const BACKUPS_DIR = path.join(TOOLKIT_ROOT, "backups");
const LOGS_DIR = path.join(TOOLKIT_ROOT, "logs");
const REPORTS_DIR = path.join(TOOLKIT_ROOT, "reports");

[BACKUPS_DIR, LOGS_DIR, REPORTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper: safe exec async wrapper
const executeCommand = (cmd: string): Promise<{ stdout: string; stderr: string; code: number }> => {
  return new Promise((resolve) => {
    exec(cmd, { cwd: TOOLKIT_ROOT }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || "",
        stderr: stderr || "",
        code: error?.code ?? 0,
      });
    });
  });
};

// API: System Diagnostics (Real container stats!)
app.get("/api/system-health", async (req, res) => {
  try {
    const uptimeRes = await executeCommand("uptime -p 2>/dev/null || uptime");
    const unameRes = await executeCommand("uname -a");
    const dfRes = await executeCommand("df -h /");
    
    // Parse /proc/meminfo or free if available
    let memoryInfo = { total: "Unknown", free: "Unknown", available: "Unknown" };
    if (fs.existsSync("/proc/meminfo")) {
      const meminfo = fs.readFileSync("/proc/meminfo", "utf-8");
      const lines = meminfo.split("\n");
      const parseKB = (key: string) => {
        const line = lines.find((l) => l.startsWith(key));
        if (!line) return "0";
        const val = line.replace(/[^0-9]/g, "");
        const mb = parseInt(val, 10) / 1024;
        return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
      };
      memoryInfo = {
        total: parseKB("MemTotal:"),
        free: parseKB("MemFree:"),
        available: parseKB("MemAvailable:") || parseKB("MemFree:"),
      };
    }

    // CPU info
    let cpuModel = "Generic CPU";
    if (fs.existsSync("/proc/cpuinfo")) {
      const cpuinfo = fs.readFileSync("/proc/cpuinfo", "utf-8");
      const match = cpuinfo.match(/model name\s+:\s+(.+)/);
      if (match) cpuModel = match[1];
    }

    // Fetch local workspace directory size
    const workspaceSizeRes = await executeCommand("du -sh . 2>/dev/null || echo 'Unknown'");
    const workspaceSize = workspaceSizeRes.stdout.trim().split(/\s+/)[0];

    res.json({
      uptime: uptimeRes.stdout.trim(),
      kernel: unameRes.stdout.trim().split(/\s+/)[2],
      cpuModel,
      memory: memoryInfo,
      diskUsage: dfRes.stdout.trim(),
      toolkitSize: workspaceSize,
      platform: "Linux (Cloud Run Container Sandbox)",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Browse Toolkit files
app.get("/api/toolkit/files", (req, res) => {
  try {
    const walk = (dir: string): any[] => {
      let results: any[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        // Skip hidden folders or node_modules inside root if any
        if (file.startsWith(".") || file === "node_modules") return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        const relativePath = path.relative(TOOLKIT_ROOT, filePath);
        
        if (stat.isDirectory()) {
          results.push({
            name: file,
            path: relativePath,
            type: "directory",
            children: walk(filePath),
          });
        } else {
          results.push({
            name: file,
            path: relativePath,
            type: "file",
            size: stat.size,
          });
        }
      });
      return results;
    };

    const fileTree = walk(TOOLKIT_ROOT);
    res.json(fileTree);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Read file contents
app.get("/api/toolkit/file", (req, res) => {
  const filePathParam = req.query.path as string;
  if (!filePathParam) {
    res.status(400).json({ error: "Missing file path parameter." });
    return;
  }

  // Resolve and guard against directory traversal
  const resolvedPath = path.resolve(TOOLKIT_ROOT, filePathParam);
  if (!resolvedPath.startsWith(TOOLKIT_ROOT)) {
    res.status(403).json({ error: "Access denied. Paths must remain within the toolkit." });
    return;
  }

  try {
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      const content = fs.readFileSync(resolvedPath, "utf-8");
      res.json({ path: filePathParam, content });
    } else {
      res.status(404).json({ error: "File not found or is a directory." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Write/Edit file contents
app.post("/api/toolkit/file", (req, res) => {
  const { path: filePathParam, content } = req.body;
  if (!filePathParam || content === undefined) {
    res.status(400).json({ error: "Missing file path or content." });
    return;
  }

  const resolvedPath = path.resolve(TOOLKIT_ROOT, filePathParam);
  if (!resolvedPath.startsWith(TOOLKIT_ROOT)) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  try {
    const parentDir = path.dirname(resolvedPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, content, "utf-8");
    // Ensure it remains executable if it's a script or main executable
    if (filePathParam.endsWith(".sh") || filePathParam === "toolkit") {
      fs.chmodSync(resolvedPath, "755");
    }
    res.json({ success: true, message: `Successfully updated ${filePathParam}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Execute Toolkit operation
app.post("/api/toolkit/execute", async (req, res) => {
  const { command, osType } = req.body;
  if (!command) {
    res.status(400).json({ error: "Missing command input." });
    return;
  }

  // Sanitize and secure command parameters
  const allowedCommands = ["update", "upgrade", "repair", "cleanup", "security", "report", "backup", "restore"];
  if (!allowedCommands.includes(command)) {
    res.status(400).json({ error: `Command '${command}' not allowed via web interface.` });
    return;
  }

  try {
    // Run bash on our local shell inside the container sandbox!
    // Since we are running on a non-root environment or container, we pass the local files
    // The scripts are smart enough to run in simulated/dry-run/local mode when not root!
    const shellCmd = `bash ./toolkit ${command}`;
    logLocalMessage(`Web Executor triggered: ${shellCmd}`);

    const result = await executeCommand(shellCmd);
    
    // Gather lists of updated logs, backups, or reports
    const logsList = fs.existsSync(LOGS_DIR) ? fs.readdirSync(LOGS_DIR) : [];
    const backupsList = fs.existsSync(BACKUPS_DIR) ? fs.readdirSync(BACKUPS_DIR) : [];
    const reportsList = fs.existsSync(REPORTS_DIR) ? fs.readdirSync(REPORTS_DIR) : [];

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
      logs: logsList,
      backups: backupsList,
      reports: reportsList,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Fetch list of diagnostics reports, logs, and backups
app.get("/api/toolkit/outputs", (req, res) => {
  try {
    const listFiles = (dir: string) => {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir)
        .map((name) => {
          const filePath = path.join(dir, name);
          const stat = fs.statSync(filePath);
          return {
            name,
            size: stat.size,
            mtime: stat.mtime,
          };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    };

    res.json({
      logs: listFiles(LOGS_DIR),
      backups: listFiles(BACKUPS_DIR),
      reports: listFiles(REPORTS_DIR),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Download full toolkit repository as compressed tarball (.tar.gz)
app.get("/api/toolkit/download", async (req, res) => {
  try {
    const parentDir = path.dirname(TOOLKIT_ROOT);
    const tarPath = path.join(parentDir, "linux-hardening-toolkit.tar.gz");
    
    // Run native tar command as specified in standard Linux utilities requirement!
    await executeCommand(`tar -czf "${tarPath}" -C "${parentDir}" "linux-hardening-toolkit"`);
    
    if (fs.existsSync(tarPath)) {
      res.download(tarPath, "linux-hardening-toolkit.tar.gz", () => {
        // Clean up tarball after sending
        try { fs.unlinkSync(tarPath); } catch {}
      });
    } else {
      res.status(500).json({ error: "Failed to generate package bundle tarball." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Gemini AI Security Advisory (Server-side & Lazy initialized)
app.post("/api/advisor/audit", async (req, res) => {
  const { systemInfo, scanLog } = req.body;
  
  try {
    const ai = getGeminiClient();
    const prompt = `
You are an expert Linux Security Architect and Cybersecurity Auditor.
Review the following diagnostics and scan output from our "Linux Package Hardening & Repair Toolkit".
Generate a professional, structured Security Advisory in Markdown format with the following:
1. Executive Summary & Risk Rating (High/Medium/Low) based on the scan logs.
2. Hardening Action Plan (Prioritized recommendations for SSH, Firewall, SUID files, or Packages).
3. Custom Remediation Script (A highly polished, self-contained shell script block that users can copy and run to harden their systems).

System Info gathered:
${JSON.stringify(systemInfo, null, 2)}

Hardening Toolkit Scan Logs:
${scanLog || "No active logs provided. Provide general hardening guidance for their detected environment."}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, professional Linux security advisor. Provide pragmatic, expert hardening recommendations without fluff.",
      }
    });

    res.json({ advisory: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Utility function to log internally to local logs folder
function logLocalMessage(msg: string) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(
      path.join(LOGS_DIR, "web-console.log"),
      `[${timestamp}] - ${msg}\n`
    );
  } catch {}
}

// Vite and static asset integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
