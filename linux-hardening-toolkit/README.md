# 🛡️ Linux Package Hardening & Repair Toolkit

[![ShellCheck](https://img.shields.io/badge/shellcheck-passing-brightgreen.svg)](https://github.com/koalaman/shellcheck)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-linux-lightgrey.svg)]()

An advanced, production-ready, open-source Linux administration toolkit that automates package operations, dependency repair, repository maintenance, automated cleanup, backup states, security audits, and system health reporting across 11+ distributions.

---

## 🚀 Key Features

* **📦 Automated Package Updates & Upgrades**: Support for `safe`, `dist`, and full system upgrades with automatic reboot checks.
* **🔧 Core Dependency & DB Repair**: Identifies broken package relationships, reconfigures half-installed files, clears stale database locks, and syncs GPG signatures.
* **🧹 Comprehensive Space Cleanup**: Removes unused orphan packages, clear package caching indices, and purges older redundant kernels safely.
* **🛡️ Security Auditing & Hardening**: Runs SSH daemon security audits, checks firewall filters, scans for SUID binaries and world-writable folders, and optimizes standard `sysctl` security keys.
* **📊 HTML/Markdown Diagnostics Report**: Writes detailed plain text, markdown, and fully responsive HTML reports.
* **🗃️ Compressed Backup & Restoration**: Saves current package selections, active repository sources list, and configs into compressed, timestamped tar archives.

---

## 🐧 Supported Linux Distributions

The toolkit automatically detects the OS and leverages the respective package manager (`apt`, `dnf`, `yum`, `pacman`, `zypper`):

* **Debian Family**: Debian, Ubuntu, Linux Mint, Kali Linux
* **Red Hat Family**: Fedora, Rocky Linux, AlmaLinux, CentOS Stream
* **Arch Family**: Arch Linux, Manjaro
* **SUSE Family**: OpenSUSE

---

## 📁 Directory Architecture

```ascii
linux-hardening-toolkit/
├── install.sh             # automated install & symlink creator
├── uninstall.sh           # clean system uninstaller
├── toolkit                # primary CLI executable entrypoint
├── menu.sh                # beautiful terminal dashboard interface
├── config/
│   └── config.conf        # global directories & rules configuration
└── scripts/
    ├── helpers.sh         # OS/PM detector, colored logging, progress bar
    ├── update.sh          # repository refresh operations
    ├── upgrade.sh         # system upgrades with reboot alerts
    ├── repair.sh          # broken package repairs and stale locks purging
    ├── cleanup.sh         # orphaned package & cache removal
    ├── package_backup.sh  # package list & configuration backup
    ├── package_restore.sh # restore package layouts from backup
    ├── security.sh        # SSH, SUID, Firewall, & sysctl security audit
    └── report.sh          # compiles TXT, MD, & HTML diagnostics report
```

---

## 🛠️ Quick Start

### 1. Installation
Clone the repository and run the install script:
```bash
git clone https://github.com/username/linux-hardening-toolkit.git
cd linux-hardening-toolkit
sudo ./install.sh
```

### 2. Run Interactive Terminal Dashboard
```bash
toolkit menu
```

### 3. CLI Subcommands
Run specific operations instantly:
```bash
# Update repo caches
sudo toolkit update

# Run safe package upgrades
sudo toolkit upgrade

# Scan for and repair broken dependencies
sudo toolkit repair

# Run security checks
sudo toolkit security

# Compile HTML system diagnostics report
sudo toolkit report
```

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
