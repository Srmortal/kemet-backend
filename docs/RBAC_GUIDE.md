# Role-Based Access Control (RBAC) Guide

## Architecture Overview

Your backend provides **all endpoints** (user + admin), but controls access through middleware:

```
┌─────────────────────────────────────────────────────┐
│                    Backend API                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Public Endpoints                                   │
│  • POST /api/firebase/login                         │
│  • GET  /health                                     │
│                                                     │
│  User Endpoints (firebaseAuth)                      │
│  • GET  /api/users/profile                          │
│  • GET  /api/firebase/test                          │
│                                                     │
│  Admin Endpoints (firebaseAuth + adminAuth)         │
│  • POST /api/firebase-admin/users/create            │
│  • GET  /api/firebase-admin/users                   │
│  • DELETE /api/firebase-admin/users/:uid            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Client-Side Division

### User App
```typescript
// user-app/src/api/client.ts
const API_BASE = 'https://api.example.com';

export const userAPI = {
  getProfile: () => fetch(`${API_BASE}/api/users/profile`, {
    headers: { Authorization: `Bearer ${idToken}` }
  }),
  // Only user endpoints exposed
};
```

### Admin Dashboard
```typescript
// admin-dashboard/src/api/client.ts
const API_BASE = 'https://api.example.com';

export const adminAPI = {
  createUser: (data) => fetch(`${API_BASE}/api/firebase-admin/users/create`, {
    headers: { Authorization: `Bearer ${adminIdToken}` }
  }),
  listUsers: () => fetch(`${API_BASE}/api/firebase-admin/users`, {
    headers: { Authorization: `Bearer ${adminIdToken}` }
  }),
  // Admin endpoints exposed
};
```

## How It Works

### 1. Backend Protection (Primary Security)

**Middleware Stack:**
```typescript
// User routes
router.get('/profile', firebaseAuth, userController.getProfile);

// Admin routes
router.use(firebaseAuth, adminAuth); // All admin routes protected
router.post('/users/create', adminController.createUser);
```

**Authorization Flow:**
1. `firebaseAuth`: Verifies Firebase ID token → attaches `req.firebaseUser`
2. `adminAuth`: Checks if `firebaseUser.admin === true` or `role === 'admin'`
3. If not admin → 403 Forbidden

### 2. Setting Admin Claims

```bash
# Grant admin role to a user
curl -X POST http://localhost:3000/api/firebase-admin/users/{uid}/claims \
  -H 'Authorization: Bearer {ADMIN_ID_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{"claims": {"admin": true, "role": "admin"}}'
```

Or programmatically:
```typescript
import { FirebaseAdminService } from './services/firebase-admin.service';

const adminService = new FirebaseAdminService();
await adminService.setCustomClaims('user-uid-123', { 
  admin: true, 
  role: 'admin' 
});
```

### 3. Client-Side Division (Secondary/UX)

**Purpose:**
- Hide admin UI from regular users
- Prevent accidental calls to admin endpoints
- Cleaner code organization

**Not for security:** Malicious users can still call admin endpoints directly, but middleware will reject them.

## Common Patterns

### Pattern 1: Separate Apps
```
user-app/          → Only imports user endpoints
admin-dashboard/   → Only imports admin endpoints
```

### Pattern 2: Single App with Routes
```typescript
// App.tsx
<Routes>
  <Route path="/user/*" element={<UserApp />} />
  <Route path="/admin/*" element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  } />
</Routes>
```

### Pattern 3: Feature Flags
```typescript
// Check user role and show/hide features
const user = useAuth();
{user.isAdmin && <AdminPanel />}
```

## Security Best Practices

### ✅ DO:
- **Always protect endpoints with middleware** (primary security)
- Store admin claims in Firebase custom claims (server-side)
- Validate authorization on **every** request
- Use HTTPS in production
- Rate-limit admin endpoints
- Log all admin actions for audit

### ❌ DON'T:
- Rely only on client-side role checks
- Store roles in client-side localStorage
- Expose all endpoints in client SDK without checks
- Trust `X-User-Role` headers from clients

## Testing RBAC

### 1. Test as Regular User
```bash
# Get regular user token
curl -X POST http://localhost:3000/api/firebase/login \
  -d '{"email":"user@example.com","password":"pass123"}'

# Try admin endpoint → Should get 403
curl -X POST http://localhost:3000/api/firebase-admin/users/create \
  -H "Authorization: Bearer {USER_TOKEN}" \
  -d '{"email":"new@example.com"}'
# Expected: 403 Forbidden
```

### 2. Test as Admin
```bash
# Set admin claims first (using another admin or direct script)
curl -X POST http://localhost:3000/api/firebase-admin/users/{uid}/claims \
  -H "Authorization: Bearer {SUPER_ADMIN_TOKEN}" \
  -d '{"claims":{"admin":true}}'

# Login as that user
curl -X POST http://localhost:3000/api/firebase/login \
  -d '{"email":"admin@example.com","password":"adminpass"}'

# Try admin endpoint → Should succeed
curl -X POST http://localhost:3000/api/firebase-admin/users/create \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{"email":"new@example.com","password":"pass123"}'
# Expected: 201 Created
```

## Migration Notes

**Current State:**
- `/api/firebase-admin/*` routes exist but have no auth middleware
- Anyone can call admin endpoints (security risk!)

**After applying adminAuth:**
- All admin routes require valid Firebase ID token + admin claim
- Regular users get 403 when trying admin operations
- Client apps can safely call any endpoint (backend enforces rules)

## Example: Granting First Admin

Since admin routes are now protected, you need to grant the first admin manually:

```typescript
// scripts/create-first-admin.ts
import { FirebaseAdminService } from '../src/services/firebase-admin.service';

async function createFirstAdmin() {
  const adminService = new FirebaseAdminService();
  
  // Create admin user
  const user = await adminService.createUser({
    email: 'admin@yourdomain.com',
    password: 'secure-password',
    displayName: 'Super Admin',
  });
  
  // Grant admin claims
  await adminService.setCustomClaims(user.uid, {
    admin: true,
    role: 'admin',
    permissions: ['users:read', 'users:write', 'users:delete']
  });
  
  console.log('First admin created:', user.uid);
}

createFirstAdmin().catch(console.error);
```

Run with:
```bash
npx ts-node scripts/create-first-admin.ts
```

## Next Steps

1. **Set dev bypass for testing:**
   ```bash
   # .env
   FIREBASE_AUTH_BYPASS=true  # Only in development!
   ```

2. **Create first admin user** using the script above

3. **Test RBAC** with different user roles

4. **Update client apps** to handle 403 responses gracefully

5. **Add more granular permissions** if needed (e.g., `users:read` vs `users:write`)
