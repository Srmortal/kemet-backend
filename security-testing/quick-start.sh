#!/bin/bash

#############################################################################
# SECURITY TESTING QUICK START GUIDE
# Run this to test your backend for vulnerabilities
#############################################################################

set -e

TARGET="${1:-http://localhost:3000}"

echo "==============================================="
echo "🔒 BACKEND SECURITY TESTING QUICK START"
echo "==============================================="
echo ""
echo "Target: $TARGET"
echo ""
echo "Make sure your backend is running first!"
echo ""

# Test if backend is reachable
echo "Testing backend connectivity..."
if ! curl -s "$TARGET" > /dev/null 2>&1; then
    echo "❌ Backend not reachable at $TARGET"
    echo "Start your backend with: npm run dev"
    exit 1
fi
echo "✓ Backend is reachable"
echo ""

# ============= PHASE 1: AUTOMATED TESTING =============
echo "==============================================="
echo "PHASE 1: Automated Scanning (npm audit)"
echo "==============================================="
echo ""

if command -v npm &> /dev/null; then
    echo "Running npm audit..."
    npm audit --audit-level=high || true
    echo ""
fi

# ============= PHASE 2: RUN JEST SECURITY TESTS =============
echo "==============================================="
echo "PHASE 2: Unit Security Tests (Jest)"
echo "==============================================="
echo ""

if [ -f "package.json" ]; then
    echo "Running security test suite..."
    npm test -- security.test.ts || true
    echo ""
fi

# ============= PHASE 3: HACKER TOOLKIT =============
echo "==============================================="
echo "PHASE 3: Advanced Security Tests"
echo "==============================================="
echo ""

echo "Choose your testing approach:"
echo ""
echo "1) Run Bash hacker toolkit (faster, detailed)"
echo "2) Run Node.js security scanner (no dependencies)"
echo "3) Run Postman collection manually (interactive)"
echo "4) Use OWASP ZAP (professional, slowest)"
echo ""

read -p "Select option (1-4): " choice

case $choice in
    1)
        echo "Running hacker toolkit..."
        if [ -f "security-testing/hacker-toolkit.sh" ]; then
            chmod +x security-testing/hacker-toolkit.sh
            ./security-testing/hacker-toolkit.sh "$TARGET"
        else
            echo "⚠ hacker-toolkit.sh not found"
        fi
        ;;
    2)
        echo "Running Node.js security scanner..."
        if [ -f "security-testing/security-scanner.js" ]; then
            node security-testing/security-scanner.js "$TARGET"
        else
            echo "⚠ security-scanner.js not found"
        fi
        ;;
    3)
        echo "Importing Postman collection..."
        if [ -f "security-testing/Postman-Security-Tests.json" ]; then
            echo "1. Open Postman"
            echo "2. Click Import"
            echo "3. Select: security-testing/Postman-Security-Tests.json"
            echo "4. Set 'baseUrl' variable to: $TARGET"
            echo "5. Run the collection"
        else
            echo "⚠ Postman collection not found"
        fi
        ;;
    4)
        echo "Starting OWASP ZAP..."
        if command -v zaproxy &> /dev/null; then
            zaproxy
        else
            echo "OWASP ZAP not installed. Install with:"
            echo "  Ubuntu: sudo apt-get install zaproxy"
            echo "  macOS: brew install zaproxy"
            echo "  Docker: docker run -t owasp/zap2docker-stable"
        fi
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "==============================================="
echo "✓ TESTING COMPLETE"
echo "==============================================="
echo ""
echo "Next steps:"
echo "1. Review all test results"
echo "2. Fix any security issues found"
echo "3. Re-run tests to verify fixes"
echo "4. Consider professional security audit"
echo ""
