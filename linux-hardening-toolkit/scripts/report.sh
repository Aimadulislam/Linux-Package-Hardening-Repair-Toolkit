#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - System Health & Audit Report Generator
# Location: linux-hardening-toolkit/scripts/report.sh

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo "Helpers not found! Exiting."
    exit 1
fi

log_info "Gathering System Metrics & Compiling Diagnostics Report..."

# Paths
REPORT_OUT_DIR="${LOCAL_REPORT_DIR:-./reports}"
if [ "$EUID" -eq 0 ]; then
    REPORT_OUT_DIR="${REPORT_DIR:-/var/log/hardening-toolkit/reports}"
fi
mkdir -p "$REPORT_OUT_DIR"

TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
TXT_REPORT="$REPORT_OUT_DIR/system_report_$TIMESTAMP.txt"
MD_REPORT="$REPORT_OUT_DIR/system_report_$TIMESTAMP.md"
HTML_REPORT="$REPORT_OUT_DIR/system_report_$TIMESTAMP.html"

# Compile Basic Info
UPTIME_RAW=$(uptime -p 2>/dev/null || uptime)
LOAD_RAW=$(uptime | awk -F'load average:' '{ print $2 }' | xargs)
MEM_RAW=$(free -h 2>/dev/null || echo "Memory stats unavailable (Not Linux/Mock container)")
DISK_RAW=$(df -h / 2>/dev/null || echo "Disk stats unavailable")
KERNEL_RAW=$(uname -r)
IP_RAW=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

# Package statistics
PKGS_COUNT="Unknown"
case "$PACKAGE_MANAGER" in
    apt) PKGS_COUNT=$(dpkg -l | grep -c '^ii') ;;
    dnf|yum) PKGS_COUNT=$(rpm -qa | wc -l) ;;
    pacman) PKGS_COUNT=$(pacman -Qq | wc -l) ;;
    zypper) PKGS_COUNT=$(rpm -qa | wc -l) ;;
esac

# 1. Plain Text Report
{
    echo "==============================================="
    echo "LINUX HARDENING & REPAIR TOOLKIT SYSTEM REPORT"
    echo "Generated on: $(date)"
    echo "==============================================="
    echo "System OS: $OS_NAME ($OS_ID)"
    echo "Kernel Version: $KERNEL_RAW"
    echo "Local IP: $IP_RAW"
    echo "Package Manager: $PACKAGE_MANAGER"
    echo "Installed Packages Count: $PKGS_COUNT"
    echo "Uptime: $UPTIME_RAW"
    echo "Load Average: $LOAD_RAW"
    echo ""
    echo "-----------------------------------------------"
    echo "MEMORY CONSUMPTION STATUS"
    echo "-----------------------------------------------"
    echo "$MEM_RAW"
    echo ""
    echo "-----------------------------------------------"
    echo "DISK UTILIZATION STATUS"
    echo "-----------------------------------------------"
    echo "$DISK_RAW"
    echo ""
    echo "-----------------------------------------------"
    echo "RUNNING PROCESSES SUMMARY"
    echo "-----------------------------------------------"
    ps aux --sort=-%cpu | head -n 10
    echo ""
    echo "-----------------------------------------------"
    echo "RECOMMENDED SECURITY MITIGATIONS"
    echo "-----------------------------------------------"
    echo "1. Verify SSH parameters are secured in /etc/ssh/sshd_config."
    echo "2. Keep firewall rules structured and active."
    echo "3. Purge orphaned packages weekly to reduce surface vulnerabilities."
    echo "4. Set up periodic automated package upgrades."
} > "$TXT_REPORT"

# 2. Markdown Report
{
    echo "# Linux Hardening & Repair Toolkit Report"
    echo "*Generated automatically on **$(date)***"
    echo ""
    echo "## 📊 System Overview"
    echo "| Metric | Value |"
    echo "| :--- | :--- |"
    echo "| **OS Name** | $OS_NAME ($OS_ID) |"
    echo "| **Kernel** | \`$KERNEL_RAW\` |"
    echo "| **IP Address** | $IP_RAW |"
    echo "| **Package Manager** | $PACKAGE_MANAGER |"
    echo "| **Packages Installed** | $PKGS_COUNT |"
    echo "| **Uptime** | $UPTIME_RAW |"
    echo "| **Load Average** | \`$LOAD_RAW\` |"
    echo ""
    echo "## 🧠 Memory Usage"
    echo "\`\`\`"
    echo "$MEM_RAW"
    echo "\`\`\`"
    echo ""
    echo "## 💾 Storage & Filesystem Health"
    echo "\`\`\`"
    echo "$DISK_RAW"
    echo "\`\`\`"
    echo ""
    echo "## ⚙️ Top CPU Utilizing Processes"
    echo "\`\`\`"
    ps aux --sort=-%cpu | head -n 8
    echo "\`\`\`"
    echo ""
    echo "## 🛡️ Hardening Assessment Checklist"
    echo "- [ ] SSH Hardened Configuration (Root Login Disabled)"
    echo "- [ ] Firewall Active and Rules Structured"
    echo "- [ ] Automated Repository Maintenance Active"
    echo "- [ ] Stale dependencies and orphans cleared"
} > "$MD_REPORT"

# 3. HTML Report (Beautifully Styled)
{
    echo "<!DOCTYPE html>"
    echo "<html lang='en'>"
    echo "<head>"
    echo "  <meta charset='UTF-8'>"
    echo "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
    echo "  <title>System Hardening & Repair Report</title>"
    echo "  <style>"
    echo "    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 24px; }"
    echo "    .card { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 24px; max-width: 800px; margin: 0 auto; }"
    echo "    h1 { color: #111827; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-top: 0; }"
    echo "    h2 { color: #374151; font-size: 18px; margin-top: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }"
    echo "    table { width: 100%; border-collapse: collapse; margin-top: 12px; }"
    echo "    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }"
    echo "    th { background-color: #f9fafb; font-weight: 600; color: #4b5563; }"
    echo "    pre { background-color: #1f2937; color: #f9fafb; padding: 14px; border-radius: 6px; overflow-x: auto; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12px; line-height: 1.5; }"
    echo "    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }"
    echo "    .badge-info { background-color: #e0f2fe; color: #0369a1; }"
    echo "    .meta { font-size: 12px; color: #6b7280; text-align: center; margin-top: 24px; }"
    echo "  </style>"
    echo "</head>"
    echo "<body>"
    echo "  <div class='card'>"
    echo "    <h1>🛡️ Linux Hardening Toolkit Diagnostics Report</h1>"
    echo "    <p style='color: #4b5563; font-size: 14px;'>Compiled automatically on <strong>$(date)</strong></p>"
    echo ""
    echo "    <h2>📊 Core System Overview</h2>"
    echo "    <table>"
    echo "      <thead>"
    echo "        <tr><th>Parameter</th><th>Value</th></tr>"
    echo "      </thead>"
    echo "      <tbody>"
    echo "        <tr><td><strong>OS Distribution</strong></td><td><span class='badge badge-info'>$OS_NAME</span></td></tr>"
    echo "        <tr><td><strong>Kernel Core</strong></td><td><code>$KERNEL_RAW</code></td></tr>"
    echo "        <tr><td><strong>Network IP</strong></td><td>$IP_RAW</td></tr>"
    echo "        <tr><td><strong>Active Package Manager</strong></td><td><code>$PACKAGE_MANAGER</code></td></tr>"
    echo "        <tr><td><strong>Total System Packages</strong></td><td>$PKGS_COUNT</td></tr>"
    echo "        <tr><td><strong>Uptime Interval</strong></td><td>$UPTIME_RAW</td></tr>"
    echo "        <tr><td><strong>System Load average</strong></td><td><code>$LOAD_RAW</code></td></tr>"
    echo "      </tbody>"
    echo "    </table>"
    echo ""
    echo "    <h2>🧠 Memory Allocation Analysis</h2>"
    echo "    <pre>$MEM_RAW</pre>"
    echo ""
    echo "    <h2>💾 Active Storage Partition Utilization</h2>"
    echo "    <pre>$DISK_RAW</pre>"
    echo ""
    echo "    <h2>⚙️ CPU Intensive System Processes</h2>"
    echo "    <pre>$(ps aux --sort=-%cpu | head -n 6)</pre>"
    echo ""
    echo "    <div class='meta'>Linux Hardening & Repair Toolkit | Open-Source Diagnostics Release</div>"
    echo "  </div>"
    echo "</body>"
    echo "</html>"
} > "$HTML_REPORT"

log_success "Reports compiled in three standard formats:"
log_success " - TEXT: $TXT_REPORT"
log_success " - MD:   $MD_REPORT"
log_success " - HTML: $HTML_REPORT"

export EXPORT_REPORT_PATH_TXT="$TXT_REPORT"
export EXPORT_REPORT_PATH_MD="$MD_REPORT"
export EXPORT_REPORT_PATH_HTML="$HTML_REPORT"
