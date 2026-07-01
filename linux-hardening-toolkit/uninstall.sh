#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Uninstaller Script
# Location: linux-hardening-toolkit/uninstall.sh

TOOLKIT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="$TOOLKIT_ROOT/scripts"

# Sourced helpers safely
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo -e "\033[0;31mError: Shared helpers.sh not found at $SCRIPT_DIR/helpers.sh! Can not proceed.\033[0m"
    exit 1
fi

log_info "Initiating uninstallation of the Linux Hardening & Repair Toolkit..."

INSTALL_DEST="/usr/local/bin/toolkit"
CFG_DEST_DIR="/etc/hardening-toolkit"

if check_root; then
    log_info "Removing global executable symlink..."
    rm -f "$INSTALL_DEST"
    
    log_info "Removing configurations..."
    rm -rf "$CFG_DEST_DIR"
    
    log_info "Removing global log directories..."
    rm -rf "/var/log/hardening-toolkit"
    
    echo -ne "${YELLOW}Do you want to delete all saved package backups? [y/N]: ${NC}"
    read -r DEL_BACKUP
    if [[ "$DEL_BACKUP" =~ ^[Yy]$ ]]; then
        log_warning "Removing global backup directory..."
        rm -rf "/var/backups/hardening-toolkit"
        log_success "Backups deleted."
    else
        log_info "Backups preserved in /var/backups/hardening-toolkit."
    fi
    
    log_success "Uninstallation completed globally!"
else
    log_warning "Running uninstaller without root permissions. Cleaning local logs/reports..."
    rm -rf "$TOOLKIT_ROOT/logs" "$TOOLKIT_ROOT/reports"
    
    echo -ne "${YELLOW}Do you want to delete local backups? [y/N]: ${NC}"
    read -r DEL_BACKUP
    if [[ "$DEL_BACKUP" =~ ^[Yy]$ ]]; then
        rm -rf "$TOOLKIT_ROOT/backups"
        log_success "Local backups deleted."
    fi
    log_success "Local uninstallation completed."
fi
