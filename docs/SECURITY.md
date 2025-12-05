# Firebase Security Best Practices

## Overview
This document outlines security best practices for managing Firebase credentials and protecting your backend application.

## ⚠️ Critical Security Measures

### 1. Service Account Protection

#### Never Commit Service Account Keys
- Service account JSON files contain sensitive credentials
- Already added to `.gitignore`: `*-firebase-adminsdk-*.json`
- If accidentally committed, rotate the key immediately

#### Check Git History
```bash
# Check if service account was committed
git log --all --full-history -- "*firebase-adminsdk*.json"

# If found, consider these options:
# 1. Rotate the key in Firebase Console
# 2. Use git-filter-repo or BFG Repo-Cleaner to remove from history
# 3. For public repos: treat as compromised and rotate immediately
```

#### Remove from Git History (if committed)
```bash
# Using git-filter-repo (recommended)
git filter-repo --path '*-firebase-adminsdk-*.json' --invert-paths

# Using BFG Repo-Cleaner
bfg --delete-files '*-firebase-adminsdk-*.json'
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 2. Environment-Based Configuration

#### Development
```bash
# Use local service account file
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
```

#### Production (Recommended Approaches)

**Option A: Environment Variables**
```bash
# Set individual credentials as environment variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Option B: Secret Manager**
```bash
# Use cloud provider's secret manager
# GCP Secret Manager
gcloud secrets create firebase-credentials --data-file=service-account.json

# AWS Secrets Manager
aws secretsmanager create-secret --name firebase-credentials \
  --secret-string file://service-account.json

# Azure Key Vault
az keyvault secret set --vault-name mykeyvault \
  --name firebase-credentials --file service-account.json
```

**Option C: Workload Identity (GCP)**
```bash
# Best option for GCP deployments
# Use bound service accounts - no keys needed
# Configure in GKE or Cloud Run
```

### 3. Key Rotation

#### When to Rotate
- Immediately if key is compromised
- Every 90 days as best practice
- When team member with access leaves
- After security incident

#### Rotation Process
1. Generate new key in Firebase Console
2. Update production environment
3. Verify new key works
4. Delete old key from Firebase Console
5. Update all environments

#### Automated Rotation Script
See `scripts/rotate-firebase-key.sh`

### 4. Access Control

#### Principle of Least Privilege
```typescript
// Example: Check user role before admin operations
import { firebaseAuth } from '../middleware/firebaseAuth';

const requireAdmin = async (req, res, next) => {
  const firebaseUser = req.firebaseUser;
  
  // Check custom claims
  const user = await firebaseAdmin.auth().getUser(firebaseUser.uid);
  if (user.customClaims?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Use in routes
router.delete('/users/:uid', firebaseAuth, requireAdmin, controller.deleteUser);
```

#### Service Account Permissions
- Limit service account roles in GCP IAM
- Use separate service accounts for different environments
- Enable audit logging

### 5. Production Checklist

- [ ] Service account NOT in version control
- [ ] Service account NOT in Docker images
- [ ] Using environment variables or secret manager
- [ ] Keys rotated within last 90 days
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Security headers enabled (helmet)
- [ ] Input validation on all endpoints
- [ ] Custom claims for authorization
- [ ] Regular security updates
- [ ] Monitoring and alerting configured

### 6. Monitoring and Alerts

#### Firebase Console
- Monitor authentication activity
- Set up alerts for unusual patterns
- Review audit logs regularly

#### Application Monitoring
```typescript
// Log authentication events
import { logger } from '../utils/logger';

export const firebaseAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    const decoded = await verifyIdToken(token);
    
    // Log successful auth
    logger.info('Firebase auth success', {
      uid: decoded.uid,
      email: decoded.email,
      ip: req.ip,
    });
    
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    // Log auth failures
    logger.warn('Firebase auth failed', {
      ip: req.ip,
      error: error.message,
    });
    next(new ApiError(401, 'Unauthorized'));
  }
};
```

### 7. Development vs Production

#### Development
```typescript
// .env.development
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account-dev.json
```

#### Production
```typescript
// Use environment variables or secret manager
NODE_ENV=production
FIREBASE_PROJECT_ID=${SECRET_PROJECT_ID}
FIREBASE_CLIENT_EMAIL=${SECRET_CLIENT_EMAIL}
FIREBASE_PRIVATE_KEY=${SECRET_PRIVATE_KEY}
```

### 8. Incident Response

#### If Key is Compromised
1. **Immediate Actions**
   - Revoke the compromised key in Firebase Console
   - Generate and deploy new key
   - Review audit logs for unauthorized access
   - Change any other potentially exposed credentials

2. **Investigation**
   - Check Firebase authentication logs
   - Review application logs
   - Identify scope of access
   - Document timeline

3. **Communication**
   - Notify team
   - If user data accessed, follow data breach procedures
   - Update security documentation

4. **Prevention**
   - Review how key was exposed
   - Update processes to prevent recurrence
   - Enhance monitoring

## Additional Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Admin SDK Security](https://firebase.google.com/docs/admin/setup)
- [GCP Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

## Compliance Considerations

### GDPR / Data Privacy
- Implement data deletion endpoints
- Log data access for audit
- Provide data export capabilities
- Document data retention policies

### SOC 2 / Security Certifications
- Regular key rotation (documented)
- Audit logging enabled
- Access control implemented
- Incident response procedures
- Security training for team
