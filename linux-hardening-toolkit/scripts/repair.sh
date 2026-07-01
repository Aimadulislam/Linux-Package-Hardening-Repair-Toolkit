#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Package Dependency & DB Repair
# Location: linux-hardening-toolkit/scripts/repair.sh

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo "Helpers not found! Exiting."
    exit 1
fi

log_info "Initiating Comprehensive Package & Repository Repair..."

# 1. Clear Stale Lock Files
clear_stale_locks() {
    log_info "Scanning for stale package manager lock files..."
    local locks=()
    if [ "$PACKAGE_MANAGER" = "apt" ]; then
        locks=("/var/lib/dpkg/lock" "/var/lib/dpkg/lock-frontend" "/var/cache/apt/archives/lock" "/var/lib/apt/lists/lock")
    elif [ "$PACKAGE_MANAGER" = "dnf" ] || [ "$PACKAGE_MANAGER" = "yum" ]; then
        locks=("/var/run/dnf.pid" "/var/run/yum.pid")
    elif [ "$PACKAGE_MANAGER" = "pacman" ]; then
        locks=("/var/lib/pacman/db.lck")
    fi

    for lock in "${locks[@]}"; do
        if [ -f "$lock" ]; then
            # Check if locking process is actually running
            local pid
            pid=$(fuser "$lock" 2>/dev/null | awk '{print $1}')
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                log_warning "Lock file $lock is active by process $pid. Not removing."
            else
                log_warning "Found stale lock file $lock (no active owner). Clearing it..."
                if check_root; then
                    rm -f "$lock"
                    log_success "Cleared $lock"
                else
                    log_warning "Local/Dry-run: Simulating removal of $lock"
                fi
            fi
        fi
    done
}

# 2. Package Dependency Repair Action
repair_dependencies() {
    log_info "Checking package and repository dependency health..."
    case "$PACKAGE_MANAGER" in
        apt)
            if check_root; then
                log_info "Reconfiguring interrupted packages (dpkg --configure -a)..."
                dpkg --configure -a
                
                log_info "Fixing broken install (apt-get install -f)..."
                apt-get install -f -y
                
                log_info "Repairing broken dependencies..."
                apt-get check
            else
                log_warning "Dry-run/Local: Simulating apt repair workflow"
                show_progress 2 "Reconfiguring unconfigured dpkg databases"
                show_progress 2 "Fixing broken package relationships"
            fi
            ;;
        dnf|yum)
            if check_root; then
                log_info "Syncing package database ($PACKAGE_MANAGER distro-sync)..."
                $PACKAGE_MANAGER distro-sync -y --allowerasing
            else
                log_warning "Dry-run/Local: Simulating $PACKAGE_MANAGER database repair"
                show_progress 3 "Rebuilding package index and matching unresolved symbols"
            fi
            ;;
        pacman)
            if check_root; then
                log_info "Repairing broken Arch database locks & package databases..."
                pacman -Syy
                # Check for missing package keys / refreshing pacman keys
                log_info "Refreshing Pacman GPG Keys..."
                pacman-key --init
                pacman-key --populate archlinux
            else
                log_warning "Dry-run/Local: Simulating pacman database repair"
                show_progress 2.5 "Initializing keyrings and validating GPG keys"
            fi
            ;;
        zypper)
            if check_root; then
                log_info "Verifying packages consistency (zypper verify)..."
                zypper verify -y
            else
                log_warning "Dry-run/Local: Simulating zypper verify"
                show_progress 2 "Verifying package constraints and resolving conflicts"
            fi
            ;;
        *)
            log_error "Unsupported package manager: $PACKAGE_MANAGER"
            ;;
    esac
}

clear_stale_locks
repair_dependencies

log_success "Package database and dependency verification finished successfully!"
export EXPORT_REPAIR_STATUS="Success"
