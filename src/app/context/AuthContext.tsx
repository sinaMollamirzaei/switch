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
        let mounted = true;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] event:', event);
                console.log('[Auth] session:', session);
                console.log('[Auth] user:', session?.user);

                if (!mounted) return;

                setSession(session);

                if (event === 'SIGNED_IN' && session?.user) {
                    await usersService.syncProfile(session.user);
                }

                if (event === 'INITIAL_SESSION') {
                    setLoading(false);
                }
            }
        );

        const timer = setTimeout(() => {
            if (mounted) {
                setShowSplash(false);
            }
        }, 2500);

        return () => {
            mounted = false;
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
