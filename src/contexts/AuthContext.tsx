import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminRole(session?.user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminRole(session?.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (user: User | null | undefined) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      console.log('Checking admin role for user:', user.id, user.email);
      
      // Check if user has admin role in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('Profile query result:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - profile doesn't exist yet
          console.log('No profile found for user, creating one...');
          // Try to create a profile with default 'user' role
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, role: 'user' });
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
          setIsAdmin(false);
          return;
        } else {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
          return;
        }
      }

      console.log('User role from database:', data?.role);
      
      if (data?.role === 'admin' || user.user_metadata?.role === 'admin') {
        console.log('User is admin!');
        setIsAdmin(true);
      } else {
        console.log('User is not admin. Role:', data?.role);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const refreshAdminStatus = async () => {
    await checkAdminRole(user);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signIn, signUp, signOut, isAdmin, refreshAdminStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
