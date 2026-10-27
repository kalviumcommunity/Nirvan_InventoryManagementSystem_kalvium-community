import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { apiFetch } from '../store/mockData';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isFirebaseLive: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFirebaseLive: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  clearError: () => {},
});

const formatFirebaseError = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync session with local backend database if available
  const syncWithBackend = async (email: string, endpoint: string) => {
    const response = await apiFetch(`/auth/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        terminal_id: 'Terminal 07',
      }),
    });
    if (!response.ok) {
      throw new Error('The inventory service could not sync your account.');
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser && fbUser.email) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email.split('@')[0],
            photoURL: fbUser.photoURL,
            isDemo: false,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Demo / fallback mode starts logged out
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      throw new Error('Email is required');
    }
    if (!pass) {
      setError('Please enter your password.');
      throw new Error('Password is required');
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        const fbUser = userCredential.user;
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || cleanEmail,
          displayName: fbUser.displayName || cleanEmail.split('@')[0],
          photoURL: fbUser.photoURL,
          isDemo: false,
        });
        await syncWithBackend(cleanEmail, 'login');
      } catch (err: any) {
        const formatted = formatFirebaseError(err);
        setError(formatted);
        throw new Error(formatted);
      }
    } else {
      // Demo Mode Fallback
      const demoUser: AuthUser = {
        uid: 'demo-' + Date.now(),
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        isDemo: true,
      };
      setUser(demoUser);
      await syncWithBackend(cleanEmail, 'login');
    }
  };

  const signUp = async (email: string, pass: string, displayName?: string) => {
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      throw new Error('Email is required');
    }
    if (!pass || pass.length < 6) {
      setError('Password must be at least 6 characters.');
      throw new Error('Password too short');
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        const fbUser = userCredential.user;
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || cleanEmail,
          displayName: displayName || cleanEmail.split('@')[0],
          photoURL: fbUser.photoURL,
          isDemo: false,
        });
        await syncWithBackend(cleanEmail, 'signup');
      } catch (err: any) {
        const formatted = formatFirebaseError(err);
        setError(formatted);
        throw new Error(formatted);
      }
    } else {
      // Demo Mode Fallback
      const demoUser: AuthUser = {
        uid: 'demo-' + Date.now(),
        email: cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
        isDemo: true,
      };
      setUser(demoUser);
      await syncWithBackend(cleanEmail, 'signup');
    }
  };

  const signOut = async () => {
    setError(null);
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (err: any) {
        console.warn('Firebase signOut error:', err);
      }
    }
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address to reset password.');
      throw new Error('Email required');
    }

    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
      } catch (err: any) {
        const formatted = formatFirebaseError(err);
        setError(formatted);
        throw new Error(formatted);
      }
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseLive: isFirebaseConfigured,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
