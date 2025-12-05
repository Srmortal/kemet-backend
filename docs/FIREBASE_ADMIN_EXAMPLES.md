# Firebase Admin SDK - Quick Reference

This backend uses Firebase Admin SDK for server-to-server operations with full administrative privileges.

## Architecture

```
Your Server (Node.js + Admin SDK) ←──→ Firebase Services
                │
                ├── Firebase Auth (user management)
                ├── Firestore (database)
                ├── Cloud Storage (files)
                ├── Cloud Messaging (push notifications)
                └── Other Firebase services
```

**Key Point:** Admin SDK runs on your trusted server with elevated permissions. No client SDK needed.

## Common Use Cases

### 1. User Management

#### Create a New User
```bash
# Using Firebase Admin SDK directly (server-side)
curl -X POST http://localhost:3000/api/firebase-admin/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "displayName": "John Doe",
    "emailVerified": false
  }'
```

#### Get User by UID
```bash
curl http://localhost:3000/api/firebase-admin/users/USER_UID_HERE
```

#### Get User by Email
```bash
curl http://localhost:3000/api/firebase-admin/users/by-email/user@example.com
```

#### Update User
```bash
curl -X PATCH http://localhost:3000/api/firebase-admin/users/USER_UID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Jane Doe",
    "emailVerified": true
  }'
```

#### Delete User
```bash
curl -X DELETE http://localhost:3000/api/firebase-admin/users/USER_UID_HERE
```

#### List All Users (Paginated)
```bash
# First page
curl http://localhost:3000/api/firebase-admin/users?limit=100

# Next page (use pageToken from previous response)
curl http://localhost:3000/api/firebase-admin/users?limit=100&pageToken=NEXT_PAGE_TOKEN
```

### 2. Role-Based Access Control (RBAC)

#### Set Custom Claims (for roles/permissions)
```bash
curl -X POST http://localhost:3000/api/firebase-admin/users/USER_UID_HERE/claims \
  -H "Content-Type: application/json" \
  -d '{
    "claims": {
      "role": "admin",
      "level": 5,
      "department": "engineering"
    }
  }'
```

**Use Case:** Check claims on client:
```javascript
// Client-side (after user signs in)
const idTokenResult = await user.getIdTokenResult();
if (idTokenResult.claims.role === 'admin') {
  // User is admin
}
```

### 3. Custom Tokens

#### Generate Custom Token
```bash
curl -X POST http://localhost:3000/api/firebase-admin/custom-token \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "claims": {
      "premiumAccount": true
    }
  }'
```

**Use Case:** Server generates token, client uses it to sign in:
```javascript
// Client-side
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithCustomToken(auth, customToken);
```

### 4. Firestore Operations

#### Get Document
```bash
curl http://localhost:3000/api/firebase-admin/firestore/users/user123
```

#### Set/Update Document
```bash
curl -X PUT http://localhost:3000/api/firebase-admin/firestore/users/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com"
  }'
```

#### Query Collection with Filters
```bash
curl -X POST http://localhost:3000/api/firebase-admin/firestore/users/query \
  -H "Content-Type: application/json" \
  -d '{
    "filters": [
      {"field": "age", "operator": ">=", "value": 18},
      {"field": "active", "operator": "==", "value": true}
    ]
  }'
```

**Available operators:** `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`, `in`, `array-contains-any`, `not-in`

#### Delete Document
```bash
curl -X DELETE http://localhost:3000/api/firebase-admin/firestore/users/user123
```

### 5. Email Actions

#### Generate Email Verification Link
```bash
curl -X POST http://localhost:3000/api/firebase-admin/email-verification-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "actionCodeSettings": {
      "url": "https://yourapp.com/verify-email",
      "handleCodeInApp": true
    }
  }'
```

#### Generate Password Reset Link
```bash
curl -X POST http://localhost:3000/api/firebase-admin/password-reset-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "actionCodeSettings": {
      "url": "https://yourapp.com/reset-password"
    }
  }'
```

**Use Case:** Send these links via your own email service (SendGrid, Mailgun, etc.)

### 6. Session Management

#### Revoke All Refresh Tokens (Force Logout)
```bash
curl -X POST http://localhost:3000/api/firebase-admin/users/USER_UID_HERE/revoke-tokens
```

**Use Case:** Security incident, suspicious activity, password change, etc.

## Integration Patterns

### Pattern 1: Internal Admin Dashboard
```typescript
// Your admin dashboard calls these endpoints directly
// Protected by your own auth (API keys, session, etc.)

async function promoteToAdmin(userId: string) {
  await fetch(`/api/firebase-admin/users/${userId}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claims: { role: 'admin' }
    })
  });
}
```

### Pattern 2: Scheduled Jobs
```typescript
// Cron job to clean up inactive users
import { FirebaseAdminService } from './services/firebase-admin.service';

async function cleanupInactiveUsers() {
  const service = new FirebaseAdminService();
  const result = await service.listUsers(1000);
  
  for (const user of result.users) {
    // Check last sign-in, delete if > 1 year
  }
}
```

### Pattern 3: Webhook Handler
```typescript
// Handle external webhooks and sync to Firebase
app.post('/webhooks/user-registered', async (req, res) => {
  const { email, name } = req.body;
  
  // Create Firebase user from external system
  const user = await firebaseAdmin.auth().createUser({
    email,
    displayName: name,
    emailVerified: false
  });
  
  res.json({ uid: user.uid });
});
```

### Pattern 4: Batch Operations
```typescript
// Bulk update users
async function setBatchClaims(userIds: string[], claims: object) {
  const service = new FirebaseAdminService();
  
  for (const uid of userIds) {
    await service.setCustomClaims(uid, claims);
  }
}
```

## Security Recommendations

1. **Protect Admin Endpoints**
   - Add API key authentication
   - Use IP whitelisting
   - Deploy in private network
   - Rate limit requests

2. **Service Account Security**
   - Never commit service account JSON
   - Use environment variables in production
   - Rotate keys regularly (see `scripts/rotate-firebase-key.sh`)
   - Use least-privilege service accounts

3. **Audit Logging**
   - Log all admin operations
   - Monitor for suspicious activity
   - Alert on bulk operations

4. **Validation**
   - Validate all inputs
   - Sanitize user data
   - Check operation limits

## Error Handling

Common errors and solutions:

### "User not found"
```json
{
  "statusCode": 404,
  "message": "User not found: ..."
}
```
**Solution:** Verify UID is correct

### "Invalid ID token"
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
**Solution:** Token expired or invalid, obtain new one

### "Permission denied"
```json
{
  "statusCode": 500,
  "message": "Failed to ... permission denied"
}
```
**Solution:** Check service account has necessary Firebase project permissions

### "Email already exists"
```json
{
  "statusCode": 409,
  "message": "User with email already exists"
}
```
**Solution:** Use update instead of create, or check first

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Admin Auth API Reference](https://firebase.google.com/docs/reference/admin/node/firebase-admin.auth)
- [Firestore Admin API](https://firebase.google.com/docs/firestore/server/retrieve-data)
- [Custom Claims & RBAC](https://firebase.google.com/docs/auth/admin/custom-claims)
