#!/bin/bash
# run-security-attacks.sh
# Automated security attack scenarios
# Usage: ./run-security-attacks.sh <target-url> <optional-token>

set -e

TARGET="${1:-http://localhost:3000}"
TOKEN="${2:-}"
REPORT="security_attack_report_$(date +%s).txt"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  AUTOMATED SECURITY ATTACK SUITE"
echo "=========================================="
echo -e "${NC}"
echo "Target: $TARGET"
echo "Report: $REPORT"
echo ""

# Headers for auth
HEADERS=""
if [ -n "$TOKEN" ]; then
  HEADERS="-H 'Authorization: Bearer $TOKEN'"
fi

log() {
  echo -e "${GREEN}[✓]${NC} $1" | tee -a $REPORT
}

test_passed() {
  echo -e "${GREEN}[PASS]${NC} $1" | tee -a $REPORT
}

test_failed() {
  echo -e "${RED}[FAIL]${NC} $1" | tee -a $REPORT
}

test_info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a $REPORT
}

# ============= TEST 1: AUTHENTICATION BYPASS =============
echo ""
echo -e "${YELLOW}[TEST 1] Authentication Bypass${NC}" | tee -a $REPORT
echo "==============================" | tee -a $REPORT

test_auth_no_header() {
  test_info "Testing request without Authorization header..."
  RESPONSE=$(curl -s -w "\n%{http_code}" "$TARGET/api/users/profile")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if [ "$STATUS" = "401" ]; then
    test_passed "Missing auth header correctly rejected (401)"
  else
    test_failed "Missing auth header returned $STATUS instead of 401"
  fi
}

test_auth_invalid_token() {
  test_info "Testing with invalid token..."
  RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer invalid123" "$TARGET/api/users/profile")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  
  if [ "$STATUS" = "401" ]; then
    test_passed "Invalid token correctly rejected (401)"
  else
    test_failed "Invalid token returned $STATUS instead of 401"
  fi
}

test_auth_none_algorithm() {
  test_info "Testing JWT with 'none' algorithm..."
  NONE_TOKEN="eyJhbGciOiJub25lIn0.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20iLCJ1aWQiOiJhZG1pbiJ9."
  RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $NONE_TOKEN" "$TARGET/api/users/profile")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  
  if [ "$STATUS" = "401" ]; then
    test_passed "JWT 'none' algorithm correctly rejected (401)"
  else
    test_failed "JWT 'none' algorithm returned $STATUS instead of 401"
  fi
}

test_auth_no_header
test_auth_invalid_token
test_auth_none_algorithm

# ============= TEST 2: INJECTION ATTACKS =============
echo ""
echo -e "${YELLOW}[TEST 2] Injection Attacks${NC}" | tee -a $REPORT
echo "=============================" | tee -a $REPORT

test_nosql_injection() {
  test_info "Testing NoSQL injection in query..."
  RESPONSE=$(curl -s -w "\n%{http_code}" "$TARGET/api/hotels?id={\$ne:null}")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if echo "$BODY" | grep -q '\$ne'; then
    test_failed "NoSQL operator passed through - possible injection vulnerability"
  else
    test_passed "NoSQL operators properly sanitized"
  fi
}

test_xss_injection() {
  test_info "Testing XSS payload in request..."
  RESPONSE=$(curl -s -X POST "$TARGET/api/bookings" \
    -H "Content-Type: application/json" \
    $HEADERS \
    -d '{"hotelName":"<img src=x onerror=alert(1)>"}' \
    -w "\n%{http_code}")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if echo "$BODY" | grep -q "onerror"; then
    test_failed "XSS payload echoed back - potential stored XSS vulnerability"
  else
    test_passed "XSS payload properly sanitized"
  fi
}

test_command_injection() {
  test_info "Testing command injection..."
  RESPONSE=$(curl -s -X POST "$TARGET/api/bookings" \
    -H "Content-Type: application/json" \
    $HEADERS \
    -d '{"hotelId":"; ls -la;"}' \
    -w "\n%{http_code}")
  STATUS=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if echo "$BODY" | grep -qE "total|drwx"; then
    test_failed "Command injection successful - command output in response"
  else
    test_passed "Command injection blocked"
  fi
}

test_nosql_injection
test_xss_injection
test_command_injection

# ============= TEST 3: IDOR ATTACKS =============
echo ""
echo -e "${YELLOW}[TEST 3] IDOR (Insecure Direct Object Reference)${NC}" | tee -a $REPORT
echo "=====================================================" | tee -a $REPORT

if [ -n "$TOKEN" ]; then
  test_info "Testing access to other users' resources..."
  
  FOUND_IDS=0
  for i in {1..10}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" \
      -H "Authorization: Bearer $TOKEN" \
      "$TARGET/api/bookings/$i")
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$STATUS" = "200" ]; then
      FOUND_IDS=$((FOUND_IDS + 1))
      test_info "  Found accessible booking ID: $i"
    fi
  done
  
  if [ "$FOUND_IDS" -gt 0 ]; then
    test_failed "Potential IDOR - Accessed $FOUND_IDS resources with sequential IDs"
  else
    test_passed "No IDOR - Sequential ID enumeration failed"
  fi
else
  test_info "Skipping IDOR test - no token provided"
fi

# ============= TEST 4: INFORMATION DISCLOSURE =============
echo ""
echo -e "${YELLOW}[TEST 4] Information Disclosure${NC}" | tee -a $REPORT
echo "==================================" | tee -a $REPORT

test_error_messages() {
  test_info "Testing error message disclosure..."
  RESPONSE=$(curl -s "$TARGET/api/invalid-endpoint")
  
  if echo "$RESPONSE" | grep -qiE "stack|trace|file|line [0-9]+"; then
    test_failed "Stack traces exposed in error messages"
  else
    test_passed "Stack traces properly hidden"
  fi
}

test_server_header() {
  test_info "Checking for Server header leakage..."
  RESPONSE=$(curl -s -i "$TARGET/health" 2>/dev/null | grep -i "^Server:")
  
  if [ -z "$RESPONSE" ]; then
    test_passed "Server header not exposed"
  else
    test_failed "Server header exposed: $RESPONSE"
  fi
}

test_version_disclosure() {
  test_info "Testing for version disclosure..."
  RESPONSE=$(curl -s "$TARGET/health")
  
  if echo "$RESPONSE" | grep -qiE "version|[0-9]+\.[0-9]+\.[0-9]+"; then
    test_failed "Version information exposed in response"
  else
    test_passed "Version information hidden"
  fi
}

test_error_messages
test_server_header
test_version_disclosure

# ============= TEST 5: SECURITY HEADERS =============
echo ""
echo -e "${YELLOW}[TEST 5] Security Headers${NC}" | tee -a $REPORT
echo "=============================" | tee -a $REPORT

test_headers() {
  RESPONSE=$(curl -s -i "$TARGET/health" 2>/dev/null)
  
  # Check for required headers
  HEADERS_TO_CHECK=(
    "X-Content-Type-Options"
    "X-Frame-Options"
    "Content-Security-Policy"
  )
  
  for header in "${HEADERS_TO_CHECK[@]}"; do
    if echo "$RESPONSE" | grep -qi "^$header:"; then
      test_passed "Header present: $header"
    else
      test_failed "Missing security header: $header"
    fi
  done
}

test_headers

# ============= TEST 6: RATE LIMITING =============
echo ""
echo -e "${YELLOW}[TEST 6] Rate Limiting${NC}" | tee -a $REPORT
echo "=======================" | tee -a $REPORT

test_rate_limit() {
  test_info "Testing rate limiting (sending 50 rapid requests)..."
  
  BLOCKED=0
  SUCCESSFUL=0
  
  for i in {1..50}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" "$TARGET/api/users/profile" 2>/dev/null)
    STATUS=$(echo "$RESPONSE" | tail -n 1)
    
    if [ "$STATUS" = "429" ]; then
      BLOCKED=$((BLOCKED + 1))
    elif [ "$STATUS" = "401" ] || [ "$STATUS" = "200" ]; then
      SUCCESSFUL=$((SUCCESSFUL + 1))
    fi
  done
  
  if [ "$BLOCKED" -gt 0 ]; then
    test_passed "Rate limiting working - Blocked $BLOCKED requests"
  else
    test_failed "Rate limiting may not be working - No 429 responses"
  fi
}

test_rate_limit

# ============= TEST 7: CORS =============
echo ""
echo -e "${YELLOW}[TEST 7] CORS Configuration${NC}" | tee -a $REPORT
echo "=============================" | tee -a $REPORT

test_cors() {
  test_info "Testing CORS configuration..."
  RESPONSE=$(curl -s -i -H "Origin: http://evil.com" "$TARGET/api/bookings" 2>/dev/null)
  
  if echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin: \*"; then
    test_failed "CORS allows wildcard origin - potential vulnerability"
  elif echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin"; then
    test_passed "CORS configured with specific origin"
  else
    test_passed "CORS properly restricted"
  fi
}

test_cors

# ============= SUMMARY =============
echo ""
echo -e "${BLUE}=========================================="
echo "  ATTACK SUMMARY"
echo "==========================================${NC}"
echo ""
echo "Full report saved to: $REPORT"
echo ""
echo "Next steps:"
echo "  1. Review this report: cat $REPORT"
echo "  2. For failed tests, review HACKER_TESTING_TOOLKIT.md"
echo "  3. Fix vulnerabilities found"
echo "  4. Re-run tests to verify fixes"
echo ""

# Count results
PASSES=$(grep -c "^\[PASS\]" $REPORT 2>/dev/null || echo 0)
FAILS=$(grep -c "^\[FAIL\]" $REPORT 2>/dev/null || echo 0)

echo -e "${GREEN}Passed: $PASSES${NC}"
echo -e "${RED}Failed: $FAILS${NC}"
echo ""

if [ "$FAILS" -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Review the report above.${NC}"
  exit 1
fi
