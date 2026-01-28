#!/bin/bash
# install-security-tools.sh
# Install all security testing tools

set -e

echo "========================================"
echo " SECURITY TESTING TOOLS INSTALLER"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root for some commands
check_sudo() {
  if [ "$EUID" -ne 0 ]; then 
    log_warn "Some tools require sudo. You may be prompted for password."
  fi
}

echo "Installing security testing tools..."
echo ""

# Update package manager
log_info "Updating package manager..."
sudo apt-get update -qq

# 1. curl & wget (usually pre-installed)
log_info "Installing curl & wget..."
sudo apt-get install -y curl wget > /dev/null 2>&1

# 2. nmap
log_info "Installing nmap (port scanner)..."
sudo apt-get install -y nmap > /dev/null 2>&1

# 3. nikto
log_info "Installing nikto (web scanner)..."
sudo apt-get install -y nikto > /dev/null 2>&1

# 4. sqlmap
log_info "Installing sqlmap (SQL injection tester)..."
sudo apt-get install -y sqlmap > /dev/null 2>&1

# 5. jq (JSON processor)
log_info "Installing jq (JSON processor)..."
sudo apt-get install -y jq > /dev/null 2>&1

# 6. hydra (brute force)
log_info "Installing hydra (brute force tester)..."
sudo apt-get install -y hydra > /dev/null 2>&1

# 7. netcat
log_info "Installing netcat..."
sudo apt-get install -y netcat-openbsd > /dev/null 2>&1

# 8. git (for cloning tools)
log_info "Installing git..."
sudo apt-get install -y git > /dev/null 2>&1

# 9. Apache Bench (ab)
log_info "Installing apache2-utils (includes ab)..."
sudo apt-get install -y apache2-utils > /dev/null 2>&1

# 10. OWASP ZAP (optional, large download)
log_info "OWASP ZAP - Download manually from https://www.zaproxy.org/download/"
log_warn "Or install: sudo apt-get install zaproxy"

# 11. ffuf (requires Go)
if command -v go &> /dev/null; then
  log_info "Installing ffuf (Go-based fuzzer)..."
  go install github.com/ffuf/ffuf@latest > /dev/null 2>&1
else
  log_warn "Go not installed. Skipping ffuf. Install Go from https://golang.org/dl/"
fi

# 12. Node.js tools (if npm available)
if command -v npm &> /dev/null; then
  log_info "Installing Node.js security tools..."
  
  # jwt-cli
  npm install -g jwt-cli > /dev/null 2>&1 || log_warn "Failed to install jwt-cli"
  
  # newman (Postman CLI)
  npm install -g newman > /dev/null 2>&1 || log_warn "Failed to install newman"
fi

# 13. Python tools
if command -v python3 &> /dev/null; then
  log_info "Installing Python security libraries..."
  pip3 install requests pyjwt paramiko > /dev/null 2>&1 || log_warn "Failed to install Python libraries"
fi

# 14. Burp Suite (manual - too large to auto-install)
log_info "Burp Suite Community Edition"
log_warn "Download from: https://portswigger.net/burp/communitydownload"

# 15. Create wordlists directory
log_info "Creating wordlists directory..."
mkdir -p ~/security-wordlists
cd ~/security-wordlists

# Download common wordlists if not already present
if [ ! -f "common.txt" ]; then
  log_info "Downloading common wordlist..."
  wget -q https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/common.txt || log_warn "Failed to download wordlist"
fi

if [ ! -f "usernames.txt" ]; then
  log_info "Downloading usernames wordlist..."
  wget -q https://raw.githubusercontent.com/danielmiessler/SecLists/master/Usernames/CommonUsernames/common-usernames.txt -O usernames.txt || log_warn "Failed to download usernames"
fi

if [ ! -f "passwords.txt" ]; then
  log_info "Downloading passwords wordlist..."
  wget -q https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10-million-password-list-top-1000.txt -O passwords.txt || log_warn "Failed to download passwords"
fi

echo ""
echo "========================================"
log_info "Installation complete!"
echo "========================================"
echo ""

echo "Installed tools:"
echo "  • curl - HTTP requests"
echo "  • nmap - Port scanning"
echo "  • nikto - Web server scanning"
echo "  • sqlmap - SQL injection testing"
echo "  • jq - JSON processing"
echo "  • hydra - Brute force attacks"
echo "  • netcat - Network testing"
echo "  • apache bench (ab) - Load testing"
echo ""

if command -v go &> /dev/null; then
  echo "  • ffuf - Fuzzing (installed via Go)"
fi

if command -v npm &> /dev/null; then
  echo "  • jwt-cli - JWT manipulation"
  echo "  • newman - Postman CLI"
fi

echo ""
echo "Manual installations needed:"
echo "  • Burp Suite: https://portswigger.net/burp/communitydownload"
echo "  • OWASP ZAP: https://www.zaproxy.org/download/"
echo ""

echo "Wordlists downloaded to: ~/security-wordlists/"
echo ""

echo "Next steps:"
echo "  1. Read HACKER_TESTING_TOOLKIT.md for detailed attack scenarios"
echo "  2. Start your backend: npm start"
echo "  3. Run security tests: npm test -- security.test.ts"
echo "  4. Try manual attacks from the toolkit"
echo ""
