declare global {
  namespace Express {
    interface Request {
      user: {
        id: string; // local user id or firebase uid
        email?: string;
        name?: string;
        role?: 'user' | 'admin';
        admin?: boolean;
        // Any other fields from firebaseUser or local user
        [key: string]: unknown;
      };
      /**
       * @deprecated Use req.user instead. This will be removed in future versions.
       */
      // firebaseUser?: never;
    }
  }
}

export {};
