#!/usr/bin/env bash
# Linux Package Hardening & Repair Toolkit - Terminal Menu dashboard
# Location: linux-hardening-toolkit/menu.sh

TOOLKIT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="$TOOLKIT_ROOT/scripts"

# Source helpers
if [ -f "$SCRIPT_DIR/helpers.sh" ]; then
    source "$SCRIPT_DIR/helpers.sh"
else
    echo "Helpers script not found at $SCRIPT_DIR/helpers.sh! Exiting."
    exit 1
fi

# Load configs
load_config

show_header() {
    clear
    echo -e "${CYAN}====================================================${NC}"
    echo -e "${BOLD}${PURPLE}   🛡️  LINUX PACKAGE HARDENING & REPAIR TOOLKIT v1.20   ${NC}"
    echo -e "${CYAN}====================================================${NC}"
    echo -e "${BLUE}  System OS:${NC} $OS_NAME | ${BLUE}PM:${NC} $PACKAGE_MANAGER | ${BLUE}UID:${NC} $EUID"
    echo -e "${CYAN}----------------------------------------------------${NC}"
}

press_enter() {
    echo ""
    echo -ne "${YELLOW}Press [ENTER] to return to the Main Menu...${NC}"
    read -r
}

# Main menu loop
while true; do
    show_header
    echo -e "  [1]  ${GREEN}Update Repository Databases${NC}"
    echo -e "  [2]  ${GREEN}Upgrade Installed Packages${NC}"
    echo -e "  [3]  ${GREEN}Repair Packages & Dependencies${NC}"
    echo -e "  [4]  ${GREEN}Clean Up Cache & Orphan Packages${NC}"
    echo -e "  [5]  ${PURPLE}Create Backup of Package States${NC}"
    echo -e "  [6]  ${PURPLE}Restore Package States from Backup${NC}"
    echo -e "  [7]  ${RED}Run Security Assessment & Hardening Audit${NC}"
    echo -e "  [8]  ${BLUE}Compile Diagnostics System Health Report${NC}"
    echo -e "  [9]  Configure Settings & Paths"
    echo -e "  [0]  Exit Toolkit"
    echo -e "${CYAN}====================================================${NC}"
    echo -ne "${BOLD}Select an operation [0-9]: ${NC}"
    read -r CHOICE

    case "$CHOICE" in
        1)
            show_header
            bash "$SCRIPT_DIR/update.sh"
            press_enter
            ;;
        2)
            show_header
            echo "Upgrade modes:"
            echo " 1. Safe Upgrade (Default)"
            echo " 2. Distribution Upgrade (Advanced)"
            echo -ne "Choose an upgrade option [1-2]: "
            read -r UP_OPT
            show_header
            if [ "$UP_OPT" = "2" ]; then
                bash "$SCRIPT_DIR/upgrade.sh" --dist
            else
                bash "$SCRIPT_DIR/upgrade.sh"
            fi
            press_enter
            ;;
        3)
            show_header
            bash "$SCRIPT_DIR/repair.sh"
            press_enter
            ;;
        4)
            show_header
            bash "$SCRIPT_DIR/cleanup.sh"
            press_enter
            ;;
        5)
            show_header
            bash "$SCRIPT_DIR/package_backup.sh"
            press_enter
            ;;
        6)
            show_header
            # Let the user specify a file or auto-latest
            echo -e "Restore Options:"
            echo -e " 1) Auto-restore most recent backup archive"
            echo -e " 2) Select specific .tar.gz backup archive path"
            echo -ne "Select option [1-2]: "
            read -r REST_OPT
            show_header
            if [ "$REST_OPT" = "2" ]; then
                echo -ne "Enter path to backup archive file: "
                read -r RE_PATH
                bash "$SCRIPT_DIR/package_restore.sh" "$RE_PATH"
            else
                bash "$SCRIPT_DIR/package_restore.sh"
            fi
            press_enter
            ;;
        7)
            show_header
            bash "$SCRIPT_DIR/security.sh"
            press_enter
            ;;
        8)
            show_header
            bash "$SCRIPT_DIR/report.sh"
            press_enter
            ;;
        9)
            show_header
            echo -e "${BOLD}Current Configuration Values:${NC}"
            echo -e " - Colorized Output:     ${USE_COLORS:-true}"
            echo -e " - Unicode Symbols:      ${UNICODE_ICONS:-true}"
            echo -e " - Backup directory:     ${LOCAL_BACKUP_DIR:-./backups}"
            echo -e " - Log directory:        ${LOCAL_LOG_DIR:-./logs}"
            echo -e ""
            echo -e "Configs are managed in config/config.conf."
            press_enter
            ;;
        0)
            clear
            echo -e "\n${GREEN}${ICON_SUCCESS} Thank you for using the Linux Package Hardening Toolkit!${NC}\n"
            exit 0
            ;;
        *)
            log_error "Invalid selection! Enter a valid operation number."
            sleep 1.5
            ;;
    esac
done
