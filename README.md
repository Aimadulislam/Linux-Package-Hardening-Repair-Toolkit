# 🛡️ Linux Package Hardening & Repair Toolkit

[![ShellCheck](https://github.com/koalaman/shellcheck/workflows/ShellCheck/badge.svg)](https://github.com/koalaman/shellcheck)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-linux-lightgrey.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

An advanced, production-ready, open-source Linux security and package administration automation suite. The toolkit automatically detects your Linux distribution and active package manager (`apt`, `dnf`, `yum`, `pacman`, `zypper`) to execute comprehensive repository healing, dependency resolution, lock purging, state backups, SSH/firewall security auditing, and system diagnostics report compilation.

---

## 🚀 Key Capabilities & Modules

1. **📦 Intelligent System Upgrades**: Performs clean, safe upgrades, full upgrades, or distribution-level transaction refreshes. Automatically flags pending reboot conditions.
2. **🔧 Dependency & DB Repair**: Identifies broken dependencies, configures interrupted packages (`dpkg --configure -a`), clears stale package manager database locks safely, and refreshes keys/keyrings.
3. **🧹 Automated Package & Cache Purge**: Automatically cleans downloaded package files, purges orphaned packages, and removes old redundant kernel images while maintaining a safe fallback kernel.
4. **📦 Comprehensive Backups & Restoration**: Creates timestamped, gzip-compressed backups containing active package manager selections, configured mirror repositories list, and critical configurations (`/etc/ssh/sshd_config`, `/etc/sysctl.conf`). Restores system packages state fully.
5. **🛡️ Security Auditing & Hardening**: Inspects SSH configurations, scans for SUID binaries and world-writable folders, verifies firewall status, audits sysctl kernel parameters, and generates tailored hardening advice.
6. **📊 Multi-Format Diagnostic Reports**: Gathers CPU load averages, memory allocation margins, disk health, and package states to compile reports in plain text, Markdown, and fully responsive HTML formats.
7. **🤖 Gemini AI Integration**: (Optional) Analyzes security logs on the server using Google Gemini model to produce custom, copyable bash hardening scripts.

---

## 🐧 Supported Distributions & Package Managers

The toolkit dynamically adapts its behavior at runtime. Supported combinations include:

| Linux Distribution Family | Distribution Examples | Native Package Manager | Sourced Command |
| :--- | :--- | :--- | :--- |
| **Debian-based** | Debian, Ubuntu, Linux Mint, Kali Linux | `apt` / `apt-get` | `dpkg`, `apt-get` |
| **Red Hat-based** | Fedora, Rocky Linux, AlmaLinux, CentOS Stream | `dnf` / `yum` | `rpm`, `dnf` |
| **Arch-based** | Arch Linux, Manjaro | `pacman` | `pacman`, `pacman-key` |
| **SUSE-based** | OpenSUSE Leap / Tumbleweed | `zypper` | `zypper` |

---

## 📁 System Architecture Directory Tree

The repository is organized following professional Linux conventions:

```ascii
linux-hardening-toolkit/
├── install.sh             # Universal automated installer (supports Global & Local modes)
├── uninstall.sh           # Reversible system uninstaller
├── toolkit                # Primary CLI binary entrypoint (ShellCheck compliant)
├── menu.sh                # Interactive Terminal TUI Dashboard
├── LICENSE                # MIT License
├── README.md              # Complete manuals & guides
├── config/
│   └── config.conf        # Centralized configurations, directories, & variables
└── scripts/
    ├── helpers.sh         # OS/PM detector, colored logging handlers, & progress UI
    ├── update.sh          # Repository metadata synchronization
    ├── upgrade.sh         # Intelligent system package upgrade transactions
    ├── repair.sh          # Broken package recovery & lock files cleanup
    ├── cleanup.sh         # Orphans purging, caches cleanups & kernel purging
    ├── package_backup.sh  # Compressed timestamped state backups creator
    ├── package_restore.sh # Restores package configurations and layouts from archives
    ├── security.sh        # SSH audit, SUID scanners, and sysctl checking
    └── report.sh          # Builds TXT, MD, & beautiful HTML diagnostic outputs
```

---

## 🛠️ Step-by-Step Server Setup & Installation

### Option A: Global Installation (Recommended for Servers)
Installs the toolkit globally for all shell sessions. This registers the `toolkit` binary symlink inside your global `$PATH` and writes global configurations to `/etc`.

```bash
# 1. Clone the repository
git clone https://github.com/aimadulislam/linux-hardening-toolkit.git

# 2. Enter directory
cd linux-hardening-toolkit

# 3. Execute installer with root privileges
sudo ./install.sh
```

**What the Global Installer Does:**
* Elevates executable privileges (`chmod +x`) safely across all scripts.
* Creates the global config workspace folder at `/etc/hardening-toolkit`.
* Copies default rule sets into `/etc/hardening-toolkit/config.conf`.
* Provisions logging and backup locations at `/var/log/hardening-toolkit` and `/var/backups/hardening-toolkit`.
* Registers a global symbolic binary link inside `/usr/local/bin/toolkit`.

---

### Option B: Local / Sandbox Installation (Non-root users)
If you don't have sudo access, or wish to test the tool inside a sandbox/container without modifying global system workspaces:

```bash
# Run installer without root privileges
./install.sh
```

**What the Local Installer Does:**
* Restricts write actions to the clone repository directory tree.
* Creates local `logs/`, `backups/`, and `reports/` workspace subdirectories.
* Executes operations in simulated/dry-run modes where appropriate.

---

## 🖥️ Usage Guide

### 1. Interactive TUI Menu Dashboard
Launch the colorful terminal interface helper:
```bash
# If installed globally:
sudo toolkit menu

# Or from local clone directory:
./toolkit menu
```

The interactive dashboard provides single-key commands to execute system updates, repair lockouts, trigger manual backups, review configs, or inspect generated logs.

---

### 2. Command Line Interface (CLI) Manual
Run operations directly from your terminal or include them in CI/CD automation pipelines:

```bash
# Sync package lists & metadata indices
sudo toolkit update

# Execute safe upgrade (installs security updates & package patches)
sudo toolkit upgrade

# Execute safe distribution upgrade (resolves advanced package layout changes)
sudo toolkit upgrade --dist

# Purge locked database files, repair broken symbols & half-installed packages
sudo toolkit repair

# Clear orphaned packages, clean metadata cache pools, & purge redundant old kernels
sudo toolkit cleanup

# Create gzip compressed archive containing manual installations list and sources
sudo toolkit backup

# Restore package states and repo source files from the latest stored archive
sudo toolkit restore

# Run security checks on SSH config, SUID/SGID binaries, and network configuration
sudo toolkit security

# Compile plain text, Markdown, and beautiful HTML system diagnostics report
sudo toolkit report
```

---

## 📅 Scheduling Automated Maintenance Tasks

Set up automatic cron schedules or systemd timers to keep your system hardened and clear of clutter.

### Recommended System Crontab Integration
Open your root crontab file:
```bash
sudo crontab -e
```

Paste these patterns to schedule maintenance tasks safely:

```cron
# 1. Every Sunday at 2:00 AM: Run Repository Updates & Safe Package Upgrades
0 2 * * 0 /usr/local/bin/toolkit upgrade >/dev/null 2>&1

# 2. Every Wednesday at 3:00 AM: Run Cleanups & Orphan Purges
0 3 * * 3 /usr/local/bin/toolkit cleanup >/dev/null 2>&1

# 3. Every Month on the 1st at 1:00 AM: Trigger State Backup
0 1 1 * * /usr/local/bin/toolkit backup >/dev/null 2>&1

# 4. Daily at midnight: Run Security Scans & Compile Diagnostics
0 0 * * * /usr/local/bin/toolkit security && /usr/local/bin/toolkit report >/dev/null 2>&1
```

---

## ⚙️ Custom Configuration Customization

Modify rules and storage locations inside `/etc/hardening-toolkit/config.conf` (for global runs) or `./config/config.conf` (for local user testing):

```bash
# Global Directory Settings
BACKUP_DIR="/var/backups/hardening-toolkit"
LOG_DIR="/var/log/hardening-toolkit"

# Style & Aesthetics
USE_COLORS=true
SHOW_PROGRESS_BARS=true
UNICODE_ICONS=true

# Security Settings
DISABLE_SSH_ROOT_LOGIN=true
DISABLE_SSH_WEAK_CIPHERS=true
ENFORCE_STRICT_SYSCTL=true
```

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
