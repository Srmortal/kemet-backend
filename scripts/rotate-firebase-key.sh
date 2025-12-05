#!/bin/bash

# Firebase Service Account Key Rotation Script
# This script helps you rotate Firebase service account keys safely

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Firebase Service Account Key Rotation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

# Load current configuration
source .env

CURRENT_KEY_PATH="${FIREBASE_SERVICE_ACCOUNT_PATH}"

if [ -z "$CURRENT_KEY_PATH" ]; then
  echo -e "${RED}Error: FIREBASE_SERVICE_ACCOUNT_PATH not set in .env${NC}"
  exit 1
fi

if [ ! -f "$CURRENT_KEY_PATH" ]; then
  echo -e "${RED}Error: Service account file not found at ${CURRENT_KEY_PATH}${NC}"
  exit 1
fi

# Extract project ID from current key
PROJECT_ID=$(jq -r '.project_id' "$CURRENT_KEY_PATH")
CLIENT_EMAIL=$(jq -r '.client_email' "$CURRENT_KEY_PATH")

echo -e "${YELLOW}Current Configuration:${NC}"
echo "Project ID: $PROJECT_ID"
echo "Service Account: $CLIENT_EMAIL"
echo "Key File: $CURRENT_KEY_PATH"
echo ""

echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "1. This script will help you replace the current service account key"
echo "2. You need to generate a new key in Firebase Console first"
echo "3. The old key should be deleted from Firebase Console after verification"
echo "4. Make sure to update all environments (dev, staging, production)"
echo ""

read -p "Have you generated a new service account key? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "\n${BLUE}Steps to generate a new key:${NC}"
  echo "1. Go to: https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk"
  echo "2. Click 'Generate New Private Key'"
  echo "3. Save the JSON file securely"
  echo "4. Run this script again"
  exit 0
fi

# Backup current key
BACKUP_DIR="./backups/keys"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/service-account-backup-${TIMESTAMP}.json"

echo -e "\n${YELLOW}Creating backup...${NC}"
cp "$CURRENT_KEY_PATH" "$BACKUP_PATH"
echo -e "${GREEN}✓ Backup created: ${BACKUP_PATH}${NC}"

# Prompt for new key file
echo -e "\n${YELLOW}Enter path to new service account JSON file:${NC}"
read NEW_KEY_PATH

if [ ! -f "$NEW_KEY_PATH" ]; then
  echo -e "${RED}Error: File not found: ${NEW_KEY_PATH}${NC}"
  exit 1
fi

# Validate new key format
if ! jq empty "$NEW_KEY_PATH" 2>/dev/null; then
  echo -e "${RED}Error: Invalid JSON file${NC}"
  exit 1
fi

NEW_PROJECT_ID=$(jq -r '.project_id' "$NEW_KEY_PATH")
NEW_CLIENT_EMAIL=$(jq -r '.client_email' "$NEW_KEY_PATH")

if [ "$NEW_PROJECT_ID" != "$PROJECT_ID" ]; then
  echo -e "${RED}Error: Project ID mismatch!${NC}"
  echo "Expected: $PROJECT_ID"
  echo "Got: $NEW_PROJECT_ID"
  exit 1
fi

echo -e "\n${YELLOW}New Key Information:${NC}"
echo "Project ID: $NEW_PROJECT_ID"
echo "Service Account: $NEW_CLIENT_EMAIL"
echo "Key File: $NEW_KEY_PATH"
echo ""

# Determine new key location
if [[ "$CURRENT_KEY_PATH" == ./* ]]; then
  # Keep in same location
  NEW_LOCATION="$CURRENT_KEY_PATH"
else
  # Prompt for location
  echo -e "${YELLOW}Where should the new key be stored?${NC}"
  echo "1. Replace current file (${CURRENT_KEY_PATH})"
  echo "2. Save to new location"
  read -p "Choice (1/2): " LOCATION_CHOICE
  
  if [ "$LOCATION_CHOICE" == "2" ]; then
    read -p "Enter new path: " NEW_LOCATION
  else
    NEW_LOCATION="$CURRENT_KEY_PATH"
  fi
fi

# Copy new key to location
echo -e "\n${YELLOW}Installing new key...${NC}"
cp "$NEW_KEY_PATH" "$NEW_LOCATION"
chmod 600 "$NEW_LOCATION"  # Restrict permissions
echo -e "${GREEN}✓ New key installed: ${NEW_LOCATION}${NC}"

# Update .env if location changed
if [ "$NEW_LOCATION" != "$CURRENT_KEY_PATH" ]; then
  echo -e "\n${YELLOW}Updating .env file...${NC}"
  
  # Create .env backup
  cp .env ".env.backup.${TIMESTAMP}"
  
  # Update FIREBASE_SERVICE_ACCOUNT_PATH
  if grep -q "FIREBASE_SERVICE_ACCOUNT_PATH=" .env; then
    sed -i "s|FIREBASE_SERVICE_ACCOUNT_PATH=.*|FIREBASE_SERVICE_ACCOUNT_PATH=${NEW_LOCATION}|" .env
  else
    echo "FIREBASE_SERVICE_ACCOUNT_PATH=${NEW_LOCATION}" >> .env
  fi
  
  echo -e "${GREEN}✓ .env updated${NC}"
fi

# Test new key
echo -e "\n${YELLOW}Testing new key...${NC}"

# Create test script
cat > /tmp/test-firebase-key.js << 'EOF'
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = process.argv[2];
const serviceAccount = require(path.resolve(serviceAccountPath));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  // Try to list one user to verify
  admin.auth().listUsers(1)
    .then(() => {
      console.log('SUCCESS');
      process.exit(0);
    })
    .catch((error) => {
      console.error('FAILED:', error.message);
      process.exit(1);
    });
} catch (error) {
  console.error('FAILED:', error.message);
  process.exit(1);
}
EOF

# Run test
if node /tmp/test-firebase-key.js "$NEW_LOCATION" 2>&1 | grep -q "SUCCESS"; then
  echo -e "${GREEN}✓ New key verified successfully${NC}"
  
  # Extract private key ID from old and new keys
  OLD_KEY_ID=$(jq -r '.private_key_id' "$CURRENT_KEY_PATH")
  NEW_KEY_ID=$(jq -r '.private_key_id' "$NEW_LOCATION")
  
  echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}   Key Rotation Successful!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  echo -e "${YELLOW}Next Steps:${NC}"
  echo ""
  echo "1. ${GREEN}✓${NC} New key installed and verified"
  echo ""
  echo "2. Update other environments:"
  echo "   - Development"
  echo "   - Staging"
  echo "   - Production"
  echo ""
  echo "3. Delete old key from Firebase Console:"
  echo "   URL: https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk"
  echo "   Old Key ID: ${OLD_KEY_ID}"
  echo ""
  echo "4. Update secret managers / CI/CD if used:"
  echo "   - GCP Secret Manager"
  echo "   - AWS Secrets Manager"
  echo "   - Azure Key Vault"
  echo "   - GitHub Secrets"
  echo ""
  echo "5. Securely delete backup after verification:"
  echo "   rm ${BACKUP_PATH}"
  echo ""
  echo "6. Document rotation in security log"
  echo ""
  
  # Create rotation log
  LOG_FILE="./docs/key-rotation-log.txt"
  echo "$(date): Key rotated from ${OLD_KEY_ID} to ${NEW_KEY_ID}" >> "$LOG_FILE"
  echo -e "${GREEN}✓ Rotation logged to ${LOG_FILE}${NC}\n"
  
else
  echo -e "${RED}✗ Key verification failed${NC}"
  echo -e "${YELLOW}Rolling back...${NC}"
  
  # Restore from backup
  cp "$BACKUP_PATH" "$NEW_LOCATION"
  
  echo -e "${YELLOW}Rollback complete. Please check:${NC}"
  echo "1. Key file format is correct JSON"
  echo "2. Key is from the correct Firebase project"
  echo "3. Service account has necessary permissions"
  echo "4. Network connectivity to Firebase"
  exit 1
fi

# Clean up
rm -f /tmp/test-firebase-key.js

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
