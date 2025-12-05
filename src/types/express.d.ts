declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      firebaseUser?: {
        uid: string;
        email?: string;
        name?: string;
        [key: string]: unknown;
      };
    }
  }
}

export {};
