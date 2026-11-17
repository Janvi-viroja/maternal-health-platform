import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { parseJsonResponse } from '../lib/http';
import type { UserProfile } from '../types';

const LOCAL_TOKEN_STORAGE_KEY = 'momcare_session_token';

function readStoredToken(): string | null {
  try {
    return (
      localStorage.getItem(LOCAL_TOKEN_STORAGE_KEY) ||
      sessionStorage.getItem(LOCAL_TOKEN_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(LOCAL_TOKEN_STORAGE_KEY, token);
      sessionStorage.setItem(LOCAL_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(LOCAL_TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(LOCAL_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota / privacy mode restrictions
  }
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (payload: {
    fullName: string;
    email: string;
    password: string;
    age?: number | null;
    pregnancyWeek?: number | null;
    lmpDate?: string | null;
    expectedDeliveryDate?: string | null;
    bloodGroup?: string | null;
    medicalHistory?: string | null;
    dietPreference?: string;
  }) => Promise<boolean>;
  signInAsDemo: (role: 'patient' | 'admin') => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUserProfileState: (user: UserProfile) => void;
  apiFetch: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [localToken, setLocalToken] = useState<string | null>(() => readStoredToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const firebaseUserRef = useRef<FirebaseUser | null>(firebaseUser);
  const localTokenRef = useRef<string | null>(localToken);
  firebaseUserRef.current = firebaseUser;
  localTokenRef.current = localToken;

  const getActiveToken = useCallback(async (): Promise<string | null> => {
    if (firebaseUserRef.current) {
      return await firebaseUserRef.current.getIdToken();
    }
    return localTokenRef.current;
  }, []);

  const apiFetch = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const token = await getActiveToken();
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const res = await fetch(url, { ...options, headers });
      return await parseJsonResponse<T>(res);
    },
    [getActiveToken]
  );

  const syncUserFromServer = useCallback(async (token: string | null) => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setUser(null);
        if (token.startsWith('mc.')) {
          writeStoredToken(null);
          setLocalToken(null);
        }
      } else {
        const data = await parseJsonResponse<{ user: UserProfile }>(res);
        setUser(data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      firebaseUserRef.current = fbUser;
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          await syncUserFromServer(idToken);
        } catch {
          setLoading(false);
        }
      } else if (localTokenRef.current) {
        await syncUserFromServer(localTokenRef.current);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncUserFromServer]);

  const signInWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      writeStoredToken(null);
      setLocalToken(null);
      localTokenRef.current = null;
      await syncUserFromServer(idToken);
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      let msg =
        err instanceof Error ? err.message : 'Google Sign-In could not be completed.';
      if (code === 'auth/popup-blocked') {
        msg = 'Pop-up was blocked by your browser. Please allow pop-ups or sign in with email.';
      } else if (code === 'auth/unauthorized-domain') {
        msg =
          'This domain is not yet authorized in Firebase Authentication settings. Please add it in Firebase Console -> Authorized Domains or sign in with email.';
      } else if (code === 'auth/popup-closed-by-user') {
        msg = 'Google Sign-In window was closed before completing.';
      }
      setAuthError(msg);
      setLoading(false);
      return false;
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonResponse<{ token: string; user: UserProfile }>(res);
      if (auth.currentUser) {
        await signOut(auth);
      }
      writeStoredToken(data.token);
      setLocalToken(data.token);
      localTokenRef.current = data.token;
      setUser(data.user);
      setLoading(false);
      return true;
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
      setLoading(false);
      return false;
    }
  };

  const registerWithEmail = async (payload: {
    fullName: string;
    email: string;
    password: string;
    age?: number | null;
    pregnancyWeek?: number | null;
    lmpDate?: string | null;
    expectedDeliveryDate?: string | null;
    bloodGroup?: string | null;
    medicalHistory?: string | null;
    dietPreference?: string;
  }): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse<{ token: string; user: UserProfile }>(res);
      if (auth.currentUser) {
        await signOut(auth);
      }
      writeStoredToken(data.token);
      setLocalToken(data.token);
      localTokenRef.current = data.token;
      setUser(data.user);
      setLoading(false);
      return true;
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed.');
      setLoading(false);
      return false;
    }
  };

  const signInAsDemo = async (role: 'patient' | 'admin'): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await parseJsonResponse<{ token: string; user: UserProfile }>(res);
      if (auth.currentUser) {
        await signOut(auth);
      }
      writeStoredToken(data.token);
      setLocalToken(data.token);
      localTokenRef.current = data.token;
      setUser(data.user);
      setLoading(false);
      return true;
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Unable to launch demo profile.');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      writeStoredToken(null);
      setLocalToken(null);
      localTokenRef.current = null;
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    const token = await getActiveToken();
    await syncUserFromServer(token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        signInAsDemo,
        logout,
        refreshProfile,
        setUserProfileState: setUser,
        apiFetch,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
