#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Package state & config backup
# Location: linux-hardening-toolkit/scripts/package_backup.sh

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo "Helpers not found! Exiting."
    exit 1
fi

# Determine active directories
BACKUP_PARENT="${LOCAL_BACKUP_DIR:-./backups}"
if [ "$EUID" -eq 0 ]; then
    BACKUP_PARENT="${BACKUP_DIR:-/var/backups/hardening-toolkit}"
fi

TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
TEMP_DIR="/tmp/hardening-backup-$TIMESTAMP"
mkdir -p "$TEMP_DIR" "$BACKUP_PARENT"

log_info "Creating Package State & Repository Backup..."
log_info "Temporary directory: $TEMP_DIR"

# 1. Export Installed Package List
log_info "Exporting list of installed packages..."
case "$PACKAGE_MANAGER" in
    apt)
        dpkg --get-selections > "$TEMP_DIR/installed_packages.txt"
        apt-mark showmanual > "$TEMP_DIR/manually_installed_packages.txt"
        cp -r /etc/apt/sources.list* "$TEMP_DIR/" 2>/dev/null
        ;;
    dnf|yum)
        rpm -qa --qf "%{NAME}\n" | sort > "$TEMP_DIR/installed_packages.txt"
        cp -r /etc/yum.repos.d "$TEMP_DIR/" 2>/dev/null
        ;;
    pacman)
        pacman -Qqe > "$TEMP_DIR/installed_packages.txt"
        cp /etc/pacman.conf "$TEMP_DIR/" 2>/dev/null
        cp -r /etc/pacman.d "$TEMP_DIR/" 2>/dev/null
        ;;
    zypper)
        rpm -qa --qf "%{NAME}\n" | sort > "$TEMP_DIR/installed_packages.txt"
        cp -r /etc/zypp/repos.d "$TEMP_DIR/" 2>/dev/null
        ;;
    *)
        # Generic backup
        uname -a > "$TEMP_DIR/system_info.txt"
        ;;
esac

# 2. Backup Crucial Config Files (SSH, Firewall, sysctl)
log_info "Backing up key configuration files..."
mkdir -p "$TEMP_DIR/configs"
[ -f /etc/ssh/sshd_config ] && cp /etc/ssh/sshd_config "$TEMP_DIR/configs/sshd_config"
[ -f /etc/sysctl.conf ] && cp /etc/sysctl.conf "$TEMP_DIR/configs/sysctl.conf"
[ -d /etc/sysctl.d ] && cp -r /etc/sysctl.d "$TEMP_DIR/configs/sysctl.d"
[ -f /etc/fstab ] && cp /etc/fstab "$TEMP_DIR/configs/fstab"

# 3. Create Compressed Archive
BACKUP_FILE="$BACKUP_PARENT/toolkit-backup-$TIMESTAMP.tar.gz"
log_info "Compressing backup state into $BACKUP_FILE..."

if tar -czf "$BACKUP_FILE" -C "/tmp" "hardening-backup-$TIMESTAMP" 2>/dev/null; then
    rm -rf "$TEMP_DIR"
    log_success "Backup completed successfully!"
    log_success "Archive saved to: $BACKUP_FILE"
else
    rm -rf "$TEMP_DIR"
    log_error "Compression failed during backup archiving."
    exit 1
fi
export EXPORT_BACKUP_PATH="$BACKUP_FILE"
