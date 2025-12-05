# Kemet Backend

A modern Node.js backend API built with TypeScript and Express.

## Features

- 🚀 TypeScript for type safety
- ⚡ Express.js for fast API development
- 🔐 JWT authentication
- 🛡️ Security middleware (Helmet, CORS, Rate limiting)
- ✅ Request validation with Joi
- 📝 Logging system
- 🧪 Jest for testing
- 🔧 ESLint for code quality
- 📦 Organized project structure
- 🔥 Firebase Admin integration (optional for ID token verification)

## Project Structure

```
kemet-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types/interfaces
│   ├── utils/            # Utility functions
│   ├── validators/       # Request validation schemas
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (create from .env.example)
├── .env.example         # Example environment variables
├── .gitignore           # Git ignore rules
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project dependencies
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration

### Development

Run the development server with hot-reload:
```bash
npm run dev
```

### Building

Compile TypeScript to JavaScript:
```bash
npm run build
```

### Production

Run the production server:
```bash
npm start
```

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Linting

Check code quality:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/firebase` - Login or create user from Firebase ID token

### Users (Protected with Firebase Auth)
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Firebase Admin Operations (Server-to-Server)
**Note:** These endpoints use Admin SDK with full privileges

#### User Management
- `POST /api/firebase-admin/custom-token` - Create custom token for a user
- `GET /api/firebase-admin/users` - List all users (paginated)
- `GET /api/firebase-admin/users/:uid` - Get user by UID
- `GET /api/firebase-admin/users/by-email/:email` - Get user by email
- `PATCH /api/firebase-admin/users/:uid` - Update user properties
- `DELETE /api/firebase-admin/users/:uid` - Delete user
- `POST /api/firebase-admin/users/:uid/claims` - Set custom user claims (for RBAC)
- `POST /api/firebase-admin/users/:uid/revoke-tokens` - Revoke all refresh tokens

#### Email Actions
- `POST /api/firebase-admin/email-verification-link` - Generate email verification link
- `POST /api/firebase-admin/password-reset-link` - Generate password reset link

#### Firestore Operations
- `GET /api/firebase-admin/firestore/:collection/:docId` - Get document
- `PUT /api/firebase-admin/firestore/:collection/:docId` - Set/update document
- `POST /api/firebase-admin/firestore/:collection/query` - Query collection with filters
- `DELETE /api/firebase-admin/firestore/:collection/:docId` - Delete document

### Health Check
- `GET /health` - Check API health status

## Firebase Admin SDK Operations

This backend uses **Firebase Admin SDK** for server-to-server operations. No client SDK integration required.

### What Can You Do?

**Authentication & User Management:**
- Create users programmatically
- Get/update/delete users
- Set custom claims for role-based access
- Generate custom tokens
- Revoke user sessions
- Manage user accounts

**Firestore Database:**
- Read/write documents
- Query collections
- Manage data server-side

**Other Firebase Services:**
- Cloud Storage access
- Cloud Messaging (push notifications)
- Remote Config

### Example: Create a User

```bash
curl -X POST http://localhost:3000/api/firebase-admin/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "displayName": "John Doe"
  }'
```

### Example: Set Admin Role

```bash
curl -X POST http://localhost:3000/api/firebase-admin/users/USER_UID/claims \
  -H "Content-Type: application/json" \
  -d '{"claims":{"role":"admin","level":5}}'
```

### Example: Query Firestore

```bash
curl -X POST http://localhost:3000/api/firebase-admin/firestore/users/query \
  -H "Content-Type: application/json" \
  -d '{"filters":[{"field":"age","operator":">=","value":18}]}'
```

### Using Firebase ID Token

Protected endpoints require the Firebase ID token in the Authorization header:

```bash
# Firebase login (creates or retrieves app user)
curl -X POST http://localhost:3000/api/auth/firebase \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"

# Get user profile
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"

# Test endpoint
curl http://localhost:3000/api/test/firebase \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

Response example:

```json
{
  "success": true,
  "message": "Firebase login successful",
  "data": {
    "user": {
      "id": "abc123",
      "email": "user@example.com",
      "name": "User Name",
      "firebaseUid": "<FIREBASE_UID>",
      "createdAt": "2025-11-25T12:00:00.000Z"
    }
  }
}
```

### Admin API Examples

Create a custom token:
```bash
curl -X POST http://localhost:3000/api/firebase-admin/custom-token \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"uid":"user123","claims":{"role":"premium"}}'
```

Set custom claims (for role-based access control):
```bash
curl -X POST http://localhost:3000/api/firebase-admin/users/USER_UID/claims \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"claims":{"role":"admin","level":5}}'
```

Query Firestore:
```bash
curl -X POST http://localhost:3000/api/firebase-admin/firestore/users/query \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"filters":[{"field":"age","operator":">=","value":18}]}'
```

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `JWT_SECRET` - Secret key for JWT tokens (only used for legacy endpoints)
- `CORS_ORIGIN` - Allowed CORS origins

**Firebase Admin SDK Configuration:**
- `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to service account JSON (recommended)
- OR individual credentials:
  - `FIREBASE_PROJECT_ID` - Firebase project ID
  - `FIREBASE_CLIENT_EMAIL` - Service account client email
  - `FIREBASE_PRIVATE_KEY` - Private key (escape newlines as \n)

### Firebase Admin SDK Setup

**What is Firebase Admin SDK?**
- Server-side SDK for privileged Firebase operations
- Full administrative access to Firebase services
- Create/manage users programmatically
- Access Firestore, Storage, Cloud Messaging, etc.
- Uses service account credentials (secure, server-only)

**Setup Steps:**

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one

2. **Generate Service Account Key**
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely (e.g., `firebase-service-account.json`)
   - **Never commit this file to version control**

3. **Configure Backend**
   
   Option A: Use JSON file path (recommended for development)
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```
   
   Option B: Use individual environment variables (recommended for production)
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

4. **Start Using Admin APIs**
   - All admin endpoints are at `/api/firebase-admin/*`
   - See [API Endpoints](#api-endpoints) section below
   - Examples in [Firebase Admin Operations](#firebase-admin-sdk-operations) section

### Admin SDK Architecture

```
Your Backend Server (Node.js + Firebase Admin SDK)
──────────────────────────────────────────────────

1. Initialize Admin SDK with Service Account
   ↓
2. Admin SDK has full privileges:
   - Create/manage users
   - Access Firestore database
   - Send notifications
   - Generate custom tokens
   - Manage all Firebase services
   ↓
3. Your API endpoints use Admin SDK directly
   ↓
4. Return results to API consumers
```

**Key Points:**
- Admin SDK runs on your trusted server
- Uses service account (not user credentials)
- Has elevated permissions
- No client SDK needed
- Direct server-to-Firebase communication

```typescript
import { Router } from 'express';
import { firebaseAuth } from './middleware/firebaseAuth';

const router = Router();

// Protected route
router.get('/secure', firebaseAuth, (req, res) => {
  const firebaseUser = req.firebaseUser; // { uid, email, name, ... }
  res.json({ message: `Hello ${firebaseUser.email}` });
});

export default router;
```

### Security Best Practices

**⚠️ Important:** See [`docs/SECURITY.md`](./docs/SECURITY.md) for comprehensive security guidelines.

Key security measures:
- Never commit service account JSON files
- Rotate keys every 90 days
- Use environment variables in production
- Implement role-based access control
- Enable audit logging
- Monitor authentication events

**Helper Scripts:**
- `./scripts/get-firebase-token.sh` - Obtain ID tokens for testing
- `./scripts/rotate-firebase-key.sh` - Safely rotate service account keys

## Security Features

- Helmet for security headers
- CORS configuration
- Rate limiting
- JWT authentication
- Input validation
- Password hashing with bcrypt

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

ISC
