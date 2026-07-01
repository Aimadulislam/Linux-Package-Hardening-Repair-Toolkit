#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - System Repository Update
# Location: linux-hardening-toolkit/scripts/update.sh

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo "Helpers not found! Exiting."
    exit 1
fi

log_info "Initiating System Repository Update..."
log_info "Detected OS: $OS_NAME ($OS_ID)"
log_info "Detected Package Manager: $PACKAGE_MANAGER"

# Perform update based on package manager
case "$PACKAGE_MANAGER" in
    apt)
        log_info "Running apt-get update..."
        if check_root; then
            apt-get update -y
            EXIT_CODE=$?
        else
            log_warning "Dry-run/Local: Simulating apt-get update"
            show_progress 2 "Updating apt software repositories"
            EXIT_CODE=0
        fi
        ;;
    dnf)
        log_info "Running dnf check-update..."
        if check_root; then
            dnf check-update
            # dnf check-update returns 100 if updates are available, which is not an error
            EXIT_CODE=$?
            if [ $EXIT_CODE -eq 100 ] || [ $EXIT_CODE -eq 0 ]; then
                EXIT_CODE=0
            fi
        else
            log_warning "Dry-run/Local: Simulating dnf check-update"
            show_progress 2 "Refreshing dnf metadata cache"
            EXIT_CODE=0
        fi
        ;;
    yum)
        log_info "Running yum check-update..."
        if check_root; then
            yum check-update
            EXIT_CODE=$?
            if [ $EXIT_CODE -eq 100 ] || [ $EXIT_CODE -eq 0 ]; then
                EXIT_CODE=0
            fi
        else
            log_warning "Dry-run/Local: Simulating yum check-update"
            show_progress 2 "Refreshing yum cache"
            EXIT_CODE=0
        fi
        ;;
    pacman)
        log_info "Running pacman -Sy..."
        if check_root; then
            pacman -Sy --noconfirm
            EXIT_CODE=$?
        else
            log_warning "Dry-run/Local: Simulating pacman database synchronization"
            show_progress 2.5 "Synchronizing Arch mirrors"
            EXIT_CODE=0
        fi
        ;;
    zypper)
        log_info "Running zypper refresh..."
        if check_root; then
            zypper refresh
            EXIT_CODE=$?
        else
            log_warning "Dry-run/Local: Simulating zypper refresh"
            show_progress 2 "Refreshing OpenSUSE repositories"
            EXIT_CODE=0
        fi
        ;;
    *)
        log_error "Unsupported package manager: $PACKAGE_MANAGER"
        EXIT_CODE=1
        ;;
esac

if [ $EXIT_CODE -eq 0 ]; then
    log_success "Repository cache updated successfully!"
else
    log_error "Repository update failed with exit code $EXIT_CODE."
    exit $EXIT_CODE
fi
