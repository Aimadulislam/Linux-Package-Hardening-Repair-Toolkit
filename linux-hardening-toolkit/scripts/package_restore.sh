#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Package state restoration
# Location: linux-hardening-toolkit/scripts/package_restore.sh

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo "Helpers not found! Exiting."
    exit 1
fi

# Determine active backup folder
BACKUP_PARENT="${LOCAL_BACKUP_DIR:-./backups}"
if [ "$EUID" -eq 0 ]; then
    BACKUP_PARENT="${BACKUP_DIR:-/var/backups/hardening-toolkit}"
fi

# Locate latest backup or use user argument
BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
    log_info "No backup file specified. Searching in $BACKUP_PARENT..."
    LATEST_BACKUP=$(find "$BACKUP_PARENT" -name "toolkit-backup-*.tar.gz" | sort | tail -n 1)
    if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
        BACKUP_FILE="$LATEST_BACKUP"
    else
        log_error "No backups found in $BACKUP_PARENT. Please provide a backup file path."
        exit 1
    fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file '$BACKUP_FILE' does not exist."
    exit 1
fi

log_info "Restoring package state from $BACKUP_FILE..."

# Create extraction workspace
TEMP_RESTORE_DIR="/tmp/hardening-restore-$(date "+%s")"
mkdir -p "$TEMP_RESTORE_DIR"

if tar -xzf "$BACKUP_FILE" -C "$TEMP_RESTORE_DIR"; then
    # Find the nested backup directory (it was archived as /tmp/hardening-backup-TIMESTAMP)
    EXTRACTED_DIR=$(find "$TEMP_RESTORE_DIR" -maxdepth 2 -type d -name "hardening-backup-*" | head -n 1)
    if [ -z "$EXTRACTED_DIR" ]; then
        log_error "Corrupted or invalid backup archive format."
        rm -rf "$TEMP_RESTORE_DIR"
        exit 1
    fi
    
    log_info "Extracted state files. Processing recovery..."
    
    # 1. Restore Repositories & Packages lists
    if check_root; then
        case "$PACKAGE_MANAGER" in
            apt)
                if [ -d "$EXTRACTED_DIR/sources.list.d" ]; then
                    log_info "Restoring APT repositories sources.list.d..."
                    cp -r "$EXTRACTED_DIR/sources.list.d/"* /etc/apt/sources.list.d/ 2>/dev/null
                fi
                if [ -f "$EXTRACTED_DIR/sources.list" ]; then
                    log_info "Restoring APT main sources.list..."
                    cp "$EXTRACTED_DIR/sources.list" /etc/apt/sources.list
                fi
                apt-get update -y
                
                if [ -f "$EXTRACTED_DIR/installed_packages.txt" ]; then
                    log_info "Re-installing selected packages from dpkg lists..."
                    dpkg --set-selections < "$EXTRACTED_DIR/installed_packages.txt"
                    apt-get dselect-upgrade -y
                fi
                ;;
            dnf|yum)
                if [ -d "$EXTRACTED_DIR/yum.repos.d" ]; then
                    log_info "Restoring YUM/DNF repositories..."
                    cp -r "$EXTRACTED_DIR/yum.repos.d/"* /etc/yum.repos.d/ 2>/dev/null
                    $PACKAGE_MANAGER clean all
                    $PACKAGE_MANAGER makecache
                fi
                if [ -f "$EXTRACTED_DIR/installed_packages.txt" ] && [ -s "$EXTRACTED_DIR/installed_packages.txt" ]; then
                    log_info "Installing package list from backup file..."
                    # Read the names and install
                    xargs $PACKAGE_MANAGER install -y < "$EXTRACTED_DIR/installed_packages.txt"
                fi
                ;;
            pacman)
                if [ -f "$EXTRACTED_DIR/pacman.conf" ]; then
                    log_info "Restoring pacman configuration..."
                    cp "$EXTRACTED_DIR/pacman.conf" /etc/pacman.conf
                fi
                if [ -d "$EXTRACTED_DIR/pacman.d" ]; then
                    log_info "Restoring pacman mirror lists..."
                    cp -r "$EXTRACTED_DIR/pacman.d/"* /etc/pacman.d/ 2>/dev/null
                fi
                pacman -Syy
                if [ -f "$EXTRACTED_DIR/installed_packages.txt" ]; then
                    log_info "Restoring pacman package states..."
                    pacman -S --needed --noconfirm - < "$EXTRACTED_DIR/installed_packages.txt"
                fi
                ;;
            *)
                log_warning "Restoration on unsupported package manager: Only manual config restoration applies."
                ;;
        esac
        
        # 2. Restore Key Configurations
        if [ -d "$EXTRACTED_DIR/configs" ]; then
            log_info "Restoring configurations..."
            [ -f "$EXTRACTED_DIR/configs/sshd_config" ] && cp "$EXTRACTED_DIR/configs/sshd_config" /etc/ssh/sshd_config && systemctl restart sshd 2>/dev/null
            [ -f "$EXTRACTED_DIR/configs/sysctl.conf" ] && cp "$EXTRACTED_DIR/configs/sysctl.conf" /etc/sysctl.conf && sysctl -p 2>/dev/null
        fi
        
        log_success "System state restored successfully!"
    else
        log_warning "Dry-run/Local: Simulating system package restoration"
        show_progress 3 "Extracting packages index and applying layout overrides"
        log_success "Simulated restoration completed successfully!"
    fi
    
    # Cleanup workspace
    rm -rf "$TEMP_RESTORE_DIR"
else
    log_error "Failed to extract package archive."
    rm -rf "$TEMP_RESTORE_DIR"
    exit 1
fi
export EXPORT_RESTORE_STATUS="Success"
