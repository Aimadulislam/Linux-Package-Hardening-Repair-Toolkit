# 🛡️ Linux Package Hardening & Repair Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux-lightgrey.svg)]()
[![Shell](https://img.shields.io/badge/Shell-Bash%20%2F%20POSIX-orange.svg)]()
[![Tested on](https://img.shields.io/badge/Tested%20on-Ubuntu%20%7C%20Debian%20%7C%20RHEL%20%7C%20Arch-brightgreen.svg)]()

An advanced, production-ready, open-source Linux automation and security hardening suite. It automates package operations, dependency repairs, repository maintenance, file integrity auditing, and system metrics compilation across 11+ distributions.

Included is a **Bash Terminal Dashboard Wizard** as well as a full-featured **React/Express Web Console Interface** allowing you to browse, edit, monitor, and run AI-assisted security scans with Gemini integration.

---

## 🚀 Key Features

* **📦 Smart Package Management**: Support for repository updates, safe upgrades, and full distribution-level updates with automated reboot requirement detection.
* **🔧 Core Dependency & DB Repair**: Clears stale package manager locks, resolves interrupted installations (`dpkg`, `rpm`), and syncs local package registries.
* **🧹 Disk-Space Optimization**: Safely purges obsolete download caches, uninstalls unused/orphaned packages, and clears legacy redundant kernels.
* **🛡️ Security Auditing & Hardening**: Scans for world-writable files, discovers high-risk `SUID`/`SGID` binaries, checks active firewall boundaries, audits `sshd_config`, and optimizes `sysctl` security keys.
* **📊 Multi-Format Diagnostic Reports**: Automatically generates rich diagnostics summaries in **Plain Text**, standard **Markdown**, and modern, fully responsive **HTML layouts**.
* **🗃️ Compressed Backup & Recovery**: Instantly saves current package states, manually-installed package manifests, and repository configs into timestamped tarballs for easy bare-metal restoration.
* **🤖 AI Security Advisor**: Integrated server-side Gemini intelligence that parses audit logs and generates custom, copy-pasteable hardening scripts tailored to the system's specs.

---

## 🐧 Supported Linux Distributions & Managers

The toolkit dynamically detects the active operating system and hooks into the respective package manager (`apt`, `dnf`, `yum`, `pacman`, `zypper`):

| Operating System | Package Manager | Arch Family | Enterprise Family |
| :--- | :--- | :--- | :--- |
| **Debian / Ubuntu / Mint / Kali** | `apt` / `dpkg` | Yes | - |
| **Fedora / Rocky / Alma / CentOS** | `dnf` / `yum` | - | Yes |
| **Arch Linux / Manjaro** | `pacman` | Yes | - |
| **OpenSUSE / SUSE Enterprise** | `zypper` | - | Yes |

---

## 📂 Project Architecture

```ascii
linux-hardening-toolkit/
├── install.sh             # Global/local installation & symlink builder
├── uninstall.sh           # Clean removal of toolkit configurations and binaries
├── toolkit                # Primary CLI binary executable entrypoint
├── menu.sh                # Interactive Bash Terminal Wizard & Dashboard
├── config/
│   └── config.conf        # Global directory rules & maintenance flags
└── scripts/
    ├── helpers.sh         # OS/PM detector, colored logging, progress indicators
    ├── update.sh          # Repository metadata synchronization
    ├── upgrade.sh         # System package upgrades with reboot alerts
    ├── repair.sh          # Package database restorations & locks purging
    ├── cleanup.sh         # Orphaned packages removal and cache pruning
    ├── package_backup.sh  # Package selection state and repository backups
    ├── package_restore.sh # Restores package layout from backup archives
    ├── security.sh        # SUID, world-writable files, SSH and sysctl auditor
    └── report.sh          # Compiles TXT, MD, & HTML diagnostics reports
