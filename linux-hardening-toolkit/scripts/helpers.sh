#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Shared Helpers
# Location: linux-hardening-toolkit/scripts/helpers.sh

# Colors for output
if [ "${USE_COLORS:-true}" = "true" ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    NC='\033[0m' # No Color
    BOLD='\033[1m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    NC=''
    BOLD=''
fi

# Unicode Icons
if [ "${UNICODE_ICONS:-true}" = "true" ]; then
    ICON_INFO="ℹ"
    ICON_SUCCESS="✔"
    ICON_WARNING="⚠"
    ICON_ERROR="✘"
    ICON_SECURE="🛡"
    ICON_REPAIR="⚙"
    ICON_CLEAN="🧹"
    ICON_BACKUP="📦"
else
    ICON_INFO="[INFO]"
    ICON_SUCCESS="[OK]"
    ICON_WARNING="[WARN]"
    ICON_ERROR="[ERR]"
    ICON_SECURE="[SECURE]"
    ICON_REPAIR="[REPAIR]"
    ICON_CLEAN="[CLEAN]"
    ICON_BACKUP="[BACKUP]"
fi

# Detection of Operating System and Package Manager
detect_system() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_NAME=$NAME
        OS_ID=$ID
        OS_ID_LIKE=$ID_LIKE
    elif type lsb_release >/dev/null 2>&1; then
        OS_NAME=$(lsb_release -si)
        OS_ID=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
    elif [ -f /etc/debian_version ]; then
        OS_NAME="Debian"
        OS_ID="debian"
    elif [ -f /etc/redhat-release ]; then
        OS_NAME="Red Hat Enterprise Linux"
        OS_ID="rhel"
    else
        OS_NAME=$(uname -s)
        OS_ID="unknown"
    fi

    # Detect package manager
    if type apt-get >/dev/null 2>&1; then
        PACKAGE_MANAGER="apt"
    elif type dnf >/dev/null 2>&1; then
        PACKAGE_MANAGER="dnf"
    elif type yum >/dev/null 2>&1; then
        PACKAGE_MANAGER="yum"
    elif type pacman >/dev/null 2>&1; then
        PACKAGE_MANAGER="pacman"
    elif type zypper >/dev/null 2>&1; then
        PACKAGE_MANAGER="zypper"
    else
        PACKAGE_MANAGER="unknown"
    fi
}

# Logging Functions
log_info() {
    local msg="$1"
    echo -e "${BLUE}${ICON_INFO} ${msg}${NC}"
    log_to_file "INFO" "$msg"
}

log_success() {
    local msg="$1"
    echo -e "${GREEN}${ICON_SUCCESS} ${msg}${NC}"
    log_to_file "SUCCESS" "$msg"
}

log_warning() {
    local msg="$1"
    echo -e "${YELLOW}${ICON_WARNING} ${msg}${NC}"
    log_to_file "WARN" "$msg"
}

log_error() {
    local msg="$1"
    echo -e "${RED}${ICON_ERROR} ${msg}${NC}" >&2
    log_to_file "ERROR" "$msg"
}

log_to_file() {
    local level="$1"
    local msg="$2"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    local script_name
    script_name=$(basename "$0")
    
    # Decide log folder
    local target_log_dir="${LOCAL_LOG_DIR:-./logs}"
    if [ "$EUID" -eq 0 ]; then
        target_log_dir="${LOG_DIR:-/var/log/hardening-toolkit}"
    fi
    
    mkdir -p "$target_log_dir"
    echo "[$timestamp] [$level] [$script_name] - $msg" >> "$target_log_dir/toolkit.log"
}

# Root privilege check
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_warning "This action should ideally be run as root. Current user UID: $EUID"
        return 1
    fi
    return 0
}

# Progress bar simulation helper
show_progress() {
    local duration=$1
    local task_name=$2
    local col_width=40
    
    echo -ne "${BOLD}${task_name}...${NC}\n"
    
    if [ "${SHOW_PROGRESS_BARS:-true}" = "true" ]; then
        for ((i=1; i<=col_width; i++)); do
            local percent=$(( i * 100 / col_width ))
            local bar=""
            for ((j=1; j<=i; j++)); do bar="${bar}█"; done
            for ((j=i+1; j<=col_width; j++)); do bar="${bar}░"; done
            
            echo -ne "\r[${bar}] ${percent}%"
            sleep "$(echo "scale=3; $duration / $col_width" | bc -l)"
        done
        echo -e "\n${GREEN}${ICON_SUCCESS} Completed!${NC}\n"
    else
        sleep "$duration"
        log_success "$task_name completed."
    fi
}

# Load main config
load_config() {
    local config_path="./config/config.conf"
    if [ -f "$config_path" ]; then
        # Sourced safely since it only defines variables
        # shellcheck disable=SC1090
        source "$config_path"
    elif [ -f "/etc/hardening-toolkit/config.conf" ]; then
        # shellcheck disable=SC1091
        source "/etc/hardening-toolkit/config.conf"
    fi
}

# Initial detection run
detect_system
load_config
