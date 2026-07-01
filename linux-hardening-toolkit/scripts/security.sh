#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Security Auditing & Hardening
# Location: linux-hardening-toolkit/scripts/security.sh

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo "Helpers not found! Exiting."
    exit 1
fi

log_info "Initiating Security Scan, Vulnerability Audit, and Hardening Check..."

# Ensure we have a place to dump local audit results
AUDIT_REPORT_DIR="${LOCAL_REPORT_DIR:-./reports}"
if [ "$EUID" -eq 0 ]; then
    AUDIT_REPORT_DIR="${REPORT_DIR:-/var/log/hardening-toolkit/reports}"
fi
mkdir -p "$AUDIT_REPORT_DIR"
AUDIT_LOG="$AUDIT_REPORT_DIR/security_audit_$(date "+%Y%m%d_%H%M%S").txt"

echo "=== SECURITY AUDIT REPORT ===" > "$AUDIT_LOG"
echo "Date: $(date)" >> "$AUDIT_LOG"
echo "OS: $OS_NAME, PM: $PACKAGE_MANAGER" >> "$AUDIT_LOG"
echo "=============================" >> "$AUDIT_LOG"

# 1. Audit SSH Hardening
audit_ssh() {
    log_info "Auditing SSH Daemon Configuration..."
    echo -e "\n[SSH CONFIGURATION AUDIT]" >> "$AUDIT_LOG"
    
    local ssh_cfg="/etc/ssh/sshd_config"
    if [ -f "$ssh_cfg" ]; then
        # Check Root Login
        local root_login
        root_login=$(grep -Ei '^\s*PermitRootLogin' "$ssh_cfg" | awk '{print $2}')
        root_login=${root_login:-"yes (default)"}
        echo "PermitRootLogin: $root_login" >> "$AUDIT_LOG"
        
        if [ "$root_login" = "yes" ] || [ "$root_login" = "prohibit-password" ]; then
            log_warning "SSH: PermitRootLogin is set to '$root_login'. Recommended: 'no'."
        else
            log_success "SSH: PermitRootLogin is secure ($root_login)."
        fi
        
        # Check Password Authentication
        local pass_auth
        pass_auth=$(grep -Ei '^\s*PasswordAuthentication' "$ssh_cfg" | awk '{print $2}')
        pass_auth=${pass_auth:-"yes (default)"}
        echo "PasswordAuthentication: $pass_auth" >> "$AUDIT_LOG"
        if [ "$pass_auth" = "yes" ]; then
            log_warning "SSH: Password Authentication is enabled. Recommended: 'no' (use SSH keys)."
        else
            log_success "SSH: Password Authentication is secure ($pass_auth)."
        fi
    else
        log_warning "SSH: sshd_config not found (SSH server might not be installed)."
        echo "SSH server configuration not found." >> "$AUDIT_LOG"
    fi
}

# 2. Find World-Writable Files
audit_world_writable() {
    log_info "Scanning for world-writable files in the workspace (safely)..."
    echo -e "\n[WORLD-WRITABLE FILES]" >> "$AUDIT_LOG"
    
    # We scan our active workspace and /tmp rather than the whole root filesystem to remain fast
    local search_path="."
    if [ "$EUID" -eq 0 ]; then
        search_path="/etc /usr/local/bin /tmp"
    fi
    
    # Find world-writable files (perm -o+w) that are regular files
    local ww_files
    ww_files=$(find "$search_path" -maxdepth 3 -perm -0002 -type f -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null)
    
    if [ -n "$ww_files" ]; then
        local count
        count=$(echo "$ww_files" | wc -l)
        log_warning "Security Risk: Found $count world-writable files in '$search_path'!"
        echo "Found world-writable files:" >> "$AUDIT_LOG"
        echo "$ww_files" | head -n 20 >> "$AUDIT_LOG"
        if [ "$count" -gt 20 ]; then
            echo "...and $((count - 20)) more." >> "$AUDIT_LOG"
        fi
    else
        log_success "World-writable files check: Secure! No high-risk files discovered."
        echo "No high-risk world-writable files discovered." >> "$AUDIT_LOG"
    fi
}

# 3. Check SUID/SGID Binaries
audit_suid() {
    log_info "Auditing SUID/SGID binaries (potential privilege escalation paths)..."
    echo -e "\n[SUID/SGID BINARIES AUDIT]" >> "$AUDIT_LOG"
    
    # Check standard bin folders
    local folders=("/bin" "/sbin" "/usr/bin" "/usr/sbin")
    local suid_files=""
    
    for folder in "${folders[@]}"; do
        if [ -d "$folder" ]; then
            local found
            found=$(find "$folder" -perm /4000 -type f 2>/dev/null)
            if [ -n "$found" ]; then
                suid_files="$suid_files"$'\n'"$found"
            fi
        fi
    done
    
    suid_files=$(echo "$suid_files" | grep -v '^\s*$')
    if [ -n "$suid_files" ]; then
        local count
        count=$(echo "$suid_files" | wc -l)
        log_info "SUID Check: Identified $count active SUID binaries."
        echo "Identified SUID binaries:" >> "$AUDIT_LOG"
        echo "$suid_files" | head -n 15 >> "$AUDIT_LOG"
    else
        log_success "SUID Check: No SUID files found (unusual for standard installs, secure)."
        echo "No SUID files found." >> "$AUDIT_LOG"
    fi
}

# 4. Check Firewall Status
audit_firewall() {
    log_info "Checking firewall configurations..."
    echo -e "\n[FIREWALL SECURITY STATUS]" >> "$AUDIT_LOG"
    
    if type ufw >/dev/null 2>&1; then
        local ufw_status
        ufw_status=$(ufw status | head -n 1)
        log_info "UFW Status: $ufw_status"
        echo "UFW Firewall: $ufw_status" >> "$AUDIT_LOG"
    elif type firewalld-cmd >/dev/null 2>&1; then
        local fw_status
        fw_status=$(firewall-cmd --state 2>/dev/null)
        log_info "Firewalld Status: $fw_status"
        echo "Firewalld: $fw_status" >> "$AUDIT_LOG"
    elif type iptables >/dev/null 2>&1; then
        # Check iptables rule count
        local rules_count
        rules_count=$(iptables -S 2>/dev/null | wc -l)
        log_info "iptables: Identified $rules_count custom filtering rules."
        echo "iptables rules count: $rules_count" >> "$AUDIT_LOG"
    else
        log_warning "Firewall Alert: No standard firewall manager (ufw, firewalld, iptables) detected!"
        echo "Firewall status: NOT FOUND" >> "$AUDIT_LOG"
    fi
}

# 5. Check Sysctl Security Keys
audit_sysctl() {
    log_info "Evaluating Kernel Security Parameters (sysctl)..."
    echo -e "\n[KERNEL PARAMS SECURITY]" >> "$AUDIT_LOG"
    
    # We inspect standard network hardening recommendations
    local check_keys=(
        "net.ipv4.ip_forward"
        "net.ipv4.conf.all.accept_redirects"
        "net.ipv4.conf.all.send_redirects"
        "net.ipv4.conf.all.rp_filter"
        "net.ipv4.icmp_echo_ignore_broadcasts"
    )
    
    for key in "${check_keys[@]}"; do
        if sysctl "$key" >/dev/null 2>&1; then
            local val
            val=$(sysctl -n "$key")
            echo "$key = $val" >> "$AUDIT_LOG"
            
            # Check rules
            if [ "$key" = "net.ipv4.ip_forward" ] && [ "$val" -ne 0 ]; then
                log_warning "Sysctl Warning: IP forwarding is enabled ($key=$val). Recommended: 0."
            elif [ "$key" = "net.ipv4.conf.all.accept_redirects" ] && [ "$val" -ne 0 ]; then
                log_warning "Sysctl Warning: ICMP Redirect accepts enabled ($key=$val). Recommended: 0."
            fi
        else
            echo "$key = Not available" >> "$AUDIT_LOG"
        fi
    done
}

# Run all checks
audit_ssh
audit_world_writable
audit_suid
audit_firewall
audit_sysctl

log_success "Security auditing completed!"
log_success "Audit file preserved at: $AUDIT_LOG"
export EXPORT_SECURITY_LOG="$AUDIT_LOG"
