#!/bin/bash

#####################################################################
# HACKER-STYLE SECURITY TESTING TOOLKIT
# Tests: Authentication, Authorization, Input Validation, 
#        Rate Limiting, Information Disclosure, CORS, etc.
#####################################################################

set -e

TARGET="${1:-http://localhost:3000}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BACKEND SECURITY HACKER TESTING${NC}"
echo -e "${BLUE}Target: $TARGET${NC}"
echo -e "${BLUE}========================================${NC}"

# Counter for tests
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
  local description=$1
  local method=$2
  local endpoint=$3
  local headers=$4
  local data=$5
  local expected_status=$6
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  echo -e "\n${YELLOW}[Test $TESTS_RUN] $description${NC}"
  
  local cmd="curl -s -w '%{http_code}' -X $method '$TARGET$endpoint'"
  
  if [ -n "$headers" ]; then
    cmd="$cmd -H '$headers'"
  fi
  
  if [ -n "$data" ]; then
    cmd="$cmd -d '$data' -H 'Content-Type: application/json'"
  fi
  
  local response=$(eval "$cmd")
  local status_code="${response: -3}"
  local body="${response%???}"
  
  echo "Status Code: $status_code (Expected: $expected_status)"
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

#####################################################################
# 1. AUTHENTICATION TESTS
#####################################################################
echo -e "\n${BLUE}========== 1. AUTHENTICATION TESTS ==========${NC}"

# Test 1.1: No token
test_endpoint "Missing Authorization header" "GET" "/api/users/profile" "" "" "401"

# Test 1.2: Malformed Bearer token
test_endpoint "Malformed Bearer token" "GET" "/api/users/profile" "Authorization: Bearer invalid.token.here" "" "401"

# Test 1.3: Empty Bearer token
test_endpoint "Empty Bearer token" "GET" "/api/users/profile" "Authorization: Bearer " "" "401"

# Test 1.4: Wrong auth scheme
test_endpoint "Wrong auth scheme (Basic)" "GET" "/api/users/profile" "Authorization: Basic dXNlcjpwYXNz" "" "401"

# Test 1.5: Token in wrong format
test_endpoint "Token in query param (should fail)" "GET" "/api/users/profile?token=abc123" "" "" "401"

#####################################################################
# 2. INPUT VALIDATION TESTS (INJECTION ATTACKS)
#####################################################################
echo -e "\n${BLUE}========== 2. INPUT VALIDATION TESTS ==========${NC}"

# Test 2.1: NoSQL Injection
test_endpoint "NoSQL Injection - hotelId" "GET" "/api/hotels?hotelId={\"\$ne\":null}" "" "" "400"

# Test 2.2: SQL-like injection
test_endpoint "SQL-like injection" "GET" "/api/hotels?name=1' OR '1'='1" "" "" "200"

# Test 2.3: Script injection in booking
test_endpoint "XSS payload in request" "POST" "/api/bookings" \
  "Authorization: Bearer test" \
  '{"hotelName": "<script>alert(\"xss\")</script>"}' \
  "400"

# Test 2.4: Large payload (DoS attempt)
LARGE_PAYLOAD=$(python3 -c "print('A' * 1000000)")
test_endpoint "Large payload attack" "POST" "/api/bookings" \
  "Authorization: Bearer test" \
  "{\"data\": \"$LARGE_PAYLOAD\"}" \
  "413"

# Test 2.5: Prototype pollution
test_endpoint "Prototype pollution attempt" "POST" "/api/users" "" \
  '{"__proto__": {"isAdmin": true}}' \
  "400"

#####################################################################
# 3. AUTHORIZATION TESTS
#####################################################################
echo -e "\n${BLUE}========== 3. AUTHORIZATION TESTS ==========${NC}"

# Test 3.1: Access other user's data (IDOR - Insecure Direct Object Reference)
test_endpoint "IDOR - Access other user data" "GET" "/api/users/999999/bookings" \
  "Authorization: Bearer test" "" "403"

# Test 3.2: Access admin endpoint without permission
test_endpoint "Access admin endpoint" "GET" "/api/admin/users" \
  "Authorization: Bearer test" "" "403"

# Test 3.3: Privilege escalation attempt
test_endpoint "Privilege escalation in update" "PUT" "/api/users/profile" \
  "Authorization: Bearer test" \
  '{"role": "admin"}' \
  "403"

#####################################################################
# 4. RATE LIMITING TESTS
#####################################################################
echo -e "\n${BLUE}========== 4. RATE LIMITING TESTS ==========${NC}"

# Test 4.1: Rapid requests
echo -e "${YELLOW}[Test] Rapid-fire requests (Rate Limiting)${NC}"
for i in {1..50}; do
  curl -s "$TARGET/api/users/profile" \
    -H "Authorization: Bearer test" \
    -w "Status: %{http_code}\n" \
    -o /dev/null 2>/dev/null
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "Sent $i requests..."
  fi
done
echo -e "${GREEN}Check if you got 429 (Too Many Requests) responses${NC}"

#####################################################################
# 5. HEADER & CORS TESTS
#####################################################################
echo -e "\n${BLUE}========== 5. HEADER & CORS TESTS ==========${NC}"

# Test 5.1: Check security headers
echo -e "${YELLOW}[Test] Security Headers${NC}"
HEADERS=$(curl -s -I "$TARGET/" | grep -i "strict-transport-security\|x-content-type-options\|x-frame-options\|content-security-policy")
if [ -z "$HEADERS" ]; then
  echo -e "${RED}✗ MISSING: Security headers not found!${NC}"
else
  echo -e "${GREEN}✓ Security headers present:${NC}"
  echo "$HEADERS"
fi

# Test 5.2: CORS misconfiguration
echo -e "${YELLOW}[Test] CORS with malicious origin${NC}"
CORS_RESPONSE=$(curl -s -I -H "Origin: http://evil.com" "$TARGET/api/users/profile" | grep -i "access-control-allow-origin" || echo "NOT_FOUND")
echo "CORS Response: $CORS_RESPONSE"
if [ "$CORS_RESPONSE" = "NOT_FOUND" ]; then
  echo -e "${GREEN}✓ CORS properly restricted${NC}"
else
  echo -e "${RED}✗ POTENTIAL CORS ISSUE${NC}"
fi

#####################################################################
# 6. ERROR MESSAGE LEAKAGE TESTS
#####################################################################
echo -e "\n${BLUE}========== 6. ERROR MESSAGE LEAKAGE TESTS ==========${NC}"

# Test 6.1: Stack trace exposure
echo -e "${YELLOW}[Test] Stack trace in error responses${NC}"
RESPONSE=$(curl -s "$TARGET/api/invalid-endpoint" 2>&1)
if echo "$RESPONSE" | grep -qi "stack\|at function\|line [0-9]"; then
  echo -e "${RED}✗ Stack traces exposed!${NC}"
else
  echo -e "${GREEN}✓ No stack traces exposed${NC}"
fi

# Test 6.2: Database error exposure
echo -e "${YELLOW}[Test] Database error exposure${NC}"
RESPONSE=$(curl -s -X POST "$TARGET/api/bookings" \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"invalid_db_field": "test"}' 2>&1)
if echo "$RESPONSE" | grep -qi "mongodb\|firestore\|database\|schema"; then
  echo -e "${RED}✗ Database details exposed!${NC}"
else
  echo -e "${GREEN}✓ Database details hidden${NC}"
fi

#####################################################################
# 7. HTTP METHOD TESTS
#####################################################################
echo -e "\n${BLUE}========== 7. HTTP METHOD TESTS ==========${NC}"

# Test 7.1: Unsupported methods
test_endpoint "TRACE method (info disclosure)" "TRACE" "/api/users/profile" "" "" "405"

# Test 7.2: Method override
test_endpoint "X-HTTP-Method-Override bypass" "POST" "/api/users/profile" \
  "X-HTTP-Method-Override: DELETE" \
  '{}' \
  "403"

#####################################################################
# 8. FIREBASE/JWT TOKEN TESTS
#####################################################################
echo -e "\n${BLUE}========== 8. JWT/TOKEN TESTS ==========${NC}"

# Test 8.1: Expired token
EXPIRED_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImZha2Uta2lkIn0.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20va2VtZXQtYzgwNzYiLCJhdWQiOiJrZW1ldC1jODA3NiIsImF1dGhfdGltZSI6MTUwMDAwMDAwMCwiZXhwIjoxNTAwMDAwMDAwfQ.fakesignature"
test_endpoint "Expired JWT token" "GET" "/api/users/profile" \
  "Authorization: Bearer $EXPIRED_TOKEN" "" "401"

# Test 8.2: Token with tampered payload
TAMPERED_TOKEN="eyJhbGciOiJub25lIn0.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20va2VtZXQtYzgwNzYiLCJ1aWQiOiJoYWNrZXIifQ."
test_endpoint "Token with 'none' algorithm" "GET" "/api/users/profile" \
  "Authorization: Bearer $TAMPERED_TOKEN" "" "401"

#####################################################################
# 9. BUSINESS LOGIC TESTS
#####################################################################
echo -e "\n${BLUE}========== 9. BUSINESS LOGIC TESTS ==========${NC}"

# Test 9.1: Negative price
test_endpoint "Negative booking amount" "POST" "/api/bookings" \
  "Authorization: Bearer test" \
  '{"amount": -100}' \
  "400"

# Test 9.2: Zero amount
test_endpoint "Zero booking amount" "POST" "/api/bookings" \
  "Authorization: Bearer test" \
  '{"amount": 0}' \
  "400"

# Test 9.3: Double booking same dates
echo -e "${YELLOW}[Test] Race condition - double booking${NC}"
echo "Would need valid token and coordination - manual testing recommended"

#####################################################################
# 10. SENSITIVE DATA LEAKAGE
#####################################################################
echo -e "\n${BLUE}========== 10. SENSITIVE DATA LEAKAGE ==========${NC}"

# Test 10.1: Check response headers for info disclosure
echo -e "${YELLOW}[Test] Information disclosure in headers${NC}"
curl -s -I "$TARGET/" | grep -i "server\|x-powered-by\|x-aspnet\|x-runtime"

# Test 10.2: Check for credentials in logs
echo -e "${YELLOW}[Test] Checking for exposed credentials${NC}"
if [ -f "logs/app.log" ]; then
  if grep -qi "password\|token\|secret\|api.key" logs/app.log; then
    echo -e "${RED}✗ Sensitive data found in logs!${NC}"
  fi
fi

#####################################################################
# SUMMARY
#####################################################################
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Total Tests Run: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ All tests passed!${NC}"
else
  echo -e "\n${RED}✗ $TESTS_FAILED test(s) failed - Review security issues${NC}"
fi

echo -e "\n${YELLOW}NEXT STEPS:${NC}"
echo "1. Fix any failed tests"
echo "2. Use OWASP ZAP for automated scanning"
echo "3. Run: npm run security:scan"
echo "4. Check sensitive data in code/logs"
echo "5. Perform penetration testing with tools like Burp Suite"
