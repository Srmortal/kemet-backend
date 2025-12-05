# Firebase Admin API Quick Reference

## Overview
This guide provides quick examples for using the Firebase Admin API endpoints.

## Prerequisites
- Server running: `npm run dev`
- Firebase ID token obtained: `./scripts/get-firebase-token.sh`
- Export token: `export ID_TOKEN="your-firebase-id-token"`

## User Management

### List Users
```bash
curl "http://localhost:3000/api/firebase-admin/users?limit=10" \
  -H "Authorization: Bearer $ID_TOKEN"
```

### Get User by UID
```bash
curl "http://localhost:3000/api/firebase-admin/users/USER_UID" \
  -H "Authorization: Bearer $ID_TOKEN"
```

### Get User by Email
```bash
curl "http://localhost:3000/api/firebase-admin/users/by-email/user@example.com" \
  -H "Authorization: Bearer $ID_TOKEN"
```

### Update User
```bash
curl -X PATCH "http://localhost:3000/api/firebase-admin/users/USER_UID" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "New Name",
    "photoURL": "https://example.com/photo.jpg",
    "disabled": false
  }'
```

### Delete User
```bash
curl -X DELETE "http://localhost:3000/api/firebase-admin/users/USER_UID" \
  -H "Authorization: Bearer $ID_TOKEN"
```

## Custom Tokens & Claims

### Create Custom Token
Useful for server-side authentication scenarios.

```bash
curl -X POST "http://localhost:3000/api/firebase-admin/custom-token" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "USER_UID",
    "claims": {
      "role": "premium",
      "level": 5
    }
  }'
```

Client can then use this custom token:
```javascript
// Client-side
firebase.auth().signInWithCustomToken(customToken)
  .then((userCredential) => {
    return userCredential.user.getIdToken();
  })
  .then((idToken) => {
    // Use this idToken for API calls
  });
```

### Set Custom Claims (RBAC)
Set custom claims for role-based access control.

```bash
curl -X POST "http://localhost:3000/api/firebase-admin/users/USER_UID/claims" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "claims": {
      "role": "admin",
      "permissions": ["read", "write", "delete"]
    }
  }'
```

Verify claims in middleware:
```typescript
const decoded = await firebaseAdmin.auth().verifyIdToken(token);
if (decoded.role !== 'admin') {
  throw new Error('Admin access required');
}
```

### Revoke Refresh Tokens
Force logout a user by revoking all their refresh tokens.

```bash
curl -X POST "http://localhost:3000/api/firebase-admin/users/USER_UID/revoke-tokens" \
  -H "Authorization: Bearer $ID_TOKEN"
```

## Email Actions

### Generate Email Verification Link
```bash
curl -X POST "http://localhost:3000/api/firebase-admin/email-verification-link" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "actionCodeSettings": {
      "url": "https://yourapp.com/verify",
      "handleCodeInApp": true
    }
  }'
```

### Generate Password Reset Link
```bash
curl -X POST "http://localhost:3000/api/firebase-admin/password-reset-link" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "actionCodeSettings": {
      "url": "https://yourapp.com/reset-password"
    }
  }'
```

## Firestore Operations

### Get Document
```bash
curl "http://localhost:3000/api/firebase-admin/firestore/users/user123" \
  -H "Authorization: Bearer $ID_TOKEN"
```

### Set/Update Document
```bash
curl -X PUT "http://localhost:3000/api/firebase-admin/firestore/users/user123" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "updatedAt": "2025-11-25T12:00:00Z"
  }'
```

### Query Collection
```bash
# Find all users over 18
curl -X POST "http://localhost:3000/api/firebase-admin/firestore/users/query" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": [
      {
        "field": "age",
        "operator": ">=",
        "value": 18
      }
    ]
  }'
```

Available operators:
- `<` - Less than
- `<=` - Less than or equal
- `==` - Equal
- `>` - Greater than
- `>=` - Greater than or equal
- `!=` - Not equal
- `array-contains` - Array contains value
- `in` - In array
- `not-in` - Not in array

Multiple filters example:
```bash
curl -X POST "http://localhost:3000/api/firebase-admin/firestore/users/query" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": [
      {
        "field": "status",
        "operator": "==",
        "value": "active"
      },
      {
        "field": "level",
        "operator": ">=",
        "value": 5
      }
    ]
  }'
```

### Delete Document
```bash
curl -X DELETE "http://localhost:3000/api/firebase-admin/firestore/users/user123" \
  -H "Authorization: Bearer $ID_TOKEN"
```

## Common Use Cases

### 1. Server-Side User Creation
```bash
# Create user in Firebase Auth (requires separate endpoint or direct SDK usage)
# Then set custom claims
curl -X POST "http://localhost:3000/api/firebase-admin/users/NEW_USER_UID/claims" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "claims": {
      "role": "user",
      "trial": true,
      "trialEndsAt": "2025-12-25"
    }
  }'
```

### 2. Admin Dashboard - User Management
```bash
# Get all users
curl "http://localhost:3000/api/firebase-admin/users?limit=100" \
  -H "Authorization: Bearer $ID_TOKEN"

# Disable user
curl -X PATCH "http://localhost:3000/api/firebase-admin/users/USER_UID" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"disabled": true}'

# Re-enable user
curl -X PATCH "http://localhost:3000/api/firebase-admin/users/USER_UID" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"disabled": false}'
```

### 3. Security - Force Logout All Sessions
```bash
# Revoke all refresh tokens
curl -X POST "http://localhost:3000/api/firebase-admin/users/USER_UID/revoke-tokens" \
  -H "Authorization: Bearer $ID_TOKEN"
```

### 4. Email Actions Without Client SDK
```bash
# Generate verification link and send via your email service
curl -X POST "http://localhost:3000/api/firebase-admin/email-verification-link" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }' | jq -r '.data.link'
```

### 5. Role-Based Access Control (RBAC)
```bash
# 1. Set user role
curl -X POST "http://localhost:3000/api/firebase-admin/users/USER_UID/claims" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "claims": {
      "role": "moderator",
      "permissions": ["delete_posts", "ban_users"]
    }
  }'

# 2. User gets new ID token with claims
# 3. Verify in middleware:
# const decoded = await admin.auth().verifyIdToken(token);
# if (decoded.role !== 'admin' && decoded.role !== 'moderator') {
#   throw new Error('Insufficient permissions');
# }
```

### 6. Analytics - User Activity Tracking
```bash
# Store user activity in Firestore
curl -X PUT "http://localhost:3000/api/firebase-admin/firestore/activity/activity123" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "action": "login",
    "timestamp": "2025-11-25T12:00:00Z",
    "ip": "192.168.1.1"
  }'

# Query recent activity
curl -X POST "http://localhost:3000/api/firebase-admin/firestore/activity/query" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": [
      {
        "field": "userId",
        "operator": "==",
        "value": "user123"
      }
    ]
  }'
```

## Testing Responses

All successful responses follow this format:
```json
{
  "success": true,
  "message": "Optional message",
  "data": {
    // Response data
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

## Production Considerations

1. **Authorization**: Add role checking middleware
   ```typescript
   const requireAdmin = async (req, res, next) => {
     const user = await firebaseAdmin.auth().getUser(req.firebaseUser.uid);
     if (user.customClaims?.role !== 'admin') {
       return res.status(403).json({ error: 'Admin access required' });
     }
     next();
   };
   ```

2. **Rate Limiting**: Already configured, but consider stricter limits for admin endpoints

3. **Audit Logging**: Log all admin operations
   ```typescript
   logger.info('Admin operation', {
     action: 'delete_user',
     targetUid: uid,
     adminUid: req.firebaseUser.uid,
     timestamp: new Date().toISOString()
   });
   ```

4. **Validation**: Add request validation schemas for all endpoints

5. **Monitoring**: Set up alerts for suspicious admin activity

## Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Query Documentation](https://firebase.google.com/docs/firestore/query-data/queries)
- [Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Security Best Practices](./SECURITY.md)
