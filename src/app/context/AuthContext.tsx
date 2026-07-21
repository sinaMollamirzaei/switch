import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { usersService } from '../../lib/services';

interface AuthContextType {
  isAuthenticated: boolean;
  isPreviewMode: boolean;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  showSplash: boolean;
  /** Only available in dev mode (`import.meta.env.DEV`). Skips OAuth redirect. */
  previewLogin?: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  // Dev-only bypass: lets the preview work without an OAuth redirect.
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // 1. Restore existing session on mount.
    //    After an OAuth redirect the session lives in the URL hash — Supabase
    //    picks it up automatically and getSession() returns it.
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error) console.error('[Auth] getSession error:', error.message);
      setSession(s);
      setLoading(false);
      // Sync profile on page-reload if a session is already present.
      // onAuthStateChange fires INITIAL_SESSION (not SIGNED_IN) on reload,
      // so we handle the profile sync here explicitly.
      if (s?.user) {
        usersService.syncProfile(s.user);
      }
    });

    // 2. Subscribe to real-time auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('[Auth] event:', event);
      setSession(s);
      // SIGNED_IN fires on the first OAuth callback after the Google redirect.
        console.log('now what??' , s);
        if (event === 'SIGNED_IN' && s?.user) {
          console.log('now what2??' , s.user);
        usersService.syncProfile(s.user);
      }
    });

    // 3. Hide splash after 2.5 s.
    const timer = setTimeout(() => setShowSplash(false), 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const login = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://switchapp-production.up.railway.app' },
    });
    if (error) console.error('[Auth] signInWithOAuth error:', error.message);
  };

  const logout = async (): Promise<void> => {
    setPreviewMode(false);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[Auth] signOut error:', error.message);
  };

  const previewLogin = import.meta.env.DEV
    ? () => setPreviewMode(true)
    : undefined;

  const isAuthenticated = previewMode || (!!session && !loading);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isPreviewMode: previewMode,
        user: session?.user ?? null,
        login,
        logout,
        showSplash,
        previewLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
