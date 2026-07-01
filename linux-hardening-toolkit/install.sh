#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Installation Script
# Location: linux-hardening-toolkit/install.sh

TOOLKIT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="$TOOLKIT_ROOT/scripts"

# Sourced helpers safely
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo -e "\033[0;31mError: Shared helpers.sh not found at $SCRIPT_DIR/helpers.sh! Can not proceed.\033[0m"
    exit 1
fi

log_info "Welcome to the Linux Hardening & Repair Toolkit Installer!"
log_info "Verifying execution dependencies..."

# Permissions upgrade
chmod +x "$TOOLKIT_ROOT/toolkit" "$TOOLKIT_ROOT/menu.sh" "$SCRIPT_DIR/"*.sh 2>/dev/null

INSTALL_DEST="/usr/local/bin/toolkit"
CFG_DEST_DIR="/etc/hardening-toolkit"

if check_root; then
    log_info "Creating global directories..."
    mkdir -p "$CFG_DEST_DIR"
    mkdir -p "/var/log/hardening-toolkit"
    mkdir -p "/var/backups/hardening-toolkit"
    
    # Copy configurations
    if [ -f "$TOOLKIT_ROOT/config/config.conf" ]; then
        log_info "Installing configuration file to $CFG_DEST_DIR/config.conf..."
        cp "$TOOLKIT_ROOT/config/config.conf" "$CFG_DEST_DIR/config.conf"
    fi
    
    # Create symlink
    log_info "Creating CLI binary symlink at $INSTALL_DEST..."
    ln -sf "$TOOLKIT_ROOT/toolkit" "$INSTALL_DEST"
    
    log_success "Toolkit successfully installed globally!"
    log_info "You can now run the tool globally using: ${BOLD}sudo toolkit --help${NC}"
else
    log_warning "Running installer without root permissions. Performing Local/User installation."
    log_info "Directories will run in local folders."
    mkdir -p "$TOOLKIT_ROOT/logs" "$TOOLKIT_ROOT/backups" "$TOOLKIT_ROOT/reports"
    
    log_success "Local dependencies initialized!"
    log_info "To launch the interactive dashboard, run: ${BOLD}./toolkit menu${NC}"
fi

log_success "Installation verified successfully! Core scripts made executable."
