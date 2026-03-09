// This file sets environment variables to bypass Firebase authentication in tests
process.env.FIREBASE_AUTH_BYPASS = "true";
process.env.NODE_ENV = "development";
