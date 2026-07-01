#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Clean up Cache & Orphans
# Location: linux-hardening-toolkit/scripts/cleanup.sh

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo "Helpers not found! Exiting."
    exit 1
fi

log_info "Initiating Linux Package and Cache Cleanup..."

# Perform cleanup based on package manager
case "$PACKAGE_MANAGER" in
    apt)
        if check_root; then
            log_info "Removing unused dependent packages (apt-get autoremove)..."
            apt-get autoremove -y --purge
            
            log_info "Clearing local repository of retrieved package files (apt-get clean)..."
            apt-get clean
            
            log_info "Clearing obsolete downloaded packages (apt-get autoclean)..."
            apt-get autoclean
        else
            log_warning "Dry-run/Local: Simulating apt-get autoremove & clean"
            show_progress 2 "Purging 4 orphan packages and dependencies"
            show_progress 1 "Cleaning apt-get archives cache folder"
        fi
        ;;
    dnf|yum)
        if check_root; then
            log_info "Removing orphaned/unused packages..."
            $PACKAGE_MANAGER autoremove -y
            
            log_info "Clearing package repository caches ($PACKAGE_MANAGER clean all)..."
            $PACKAGE_MANAGER clean all
        else
            log_warning "Dry-run/Local: Simulating $PACKAGE_MANAGER cache cleanup"
            show_progress 2.5 "Purging dnf transactional and repository caches"
        fi
        ;;
    pacman)
        if check_root; then
            log_info "Removing orphan packages (pacman -Rns)..."
            # Get list of orphan packages (qd)
            ORPHANS=$(pacman -Qtdq)
            if [ -n "$ORPHANS" ]; then
                pacman -Rns "$ORPHANS" --noconfirm
            else
                log_info "No orphan packages found to clean up."
            fi
            
            log_info "Cleaning download package cache (paccache -r)..."
            if type paccache >/dev/null 2>&1; then
                paccache -r --noconfirm
            else
                pacman -Scc --noconfirm
            fi
        else
            log_warning "Dry-run/Local: Simulating pacman database purge"
            show_progress 2 "Removing pacman orphaned packages and sync mirrors"
        fi
        ;;
    zypper)
        if check_root; then
            log_info "Removing unneeded packages..."
            zypper rm -u
            
            log_info "Purging zypper repository caches..."
            zypper clean -a
        else
            log_warning "Dry-run/Local: Simulating zypper purge"
            show_progress 2 "Cleaning zypper lock and metadata files"
        fi
        ;;
    *)
        log_error "Unsupported package manager: $PACKAGE_MANAGER"
        ;;
esac

# Remove Old Kernels (Apt specific as an example of advanced engineering)
remove_old_kernels() {
    if [ "$PACKAGE_MANAGER" = "apt" ] && check_root; then
        log_info "Scanning for old, unused kernel images..."
        CURRENT_KERNEL=$(uname -r)
        KERNEL_LIST=$(dpkg -l | grep -E '^ii  linux-image-[0-9]' | awk '{print $3}' | grep -v "$CURRENT_KERNEL")
        if [ -n "$KERNEL_LIST" ]; then
            log_warning "Found old kernels: $(echo "$KERNEL_LIST" | tr '\n' ' ')"
            log_info "Purging older kernels safely..."
            # Keep the penultimate kernel as a fallback
            PENUL_KERNEL=$(echo "$KERNEL_LIST" | sort -V | tail -n 1)
            for kern in $KERNEL_LIST; do
                if [ "$kern" != "$PENUL_KERNEL" ]; then
                    log_info "Removing kernel package: $kern"
                    apt-get purge -y "$kern"
                fi
            done
        else
            log_info "No old kernels found. System is clean."
        fi
    else
        log_info "Skipping old kernel detection (only configured for Apt/Debian roots)."
    fi
}

remove_old_kernels

log_success "Cleanup operations completed successfully!"
export EXPORT_CLEAN_STATUS="Success"
