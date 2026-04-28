import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';import { registerForPushNotificationsAsync } from '@/src/notifications/registerForPushNotif';

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
    console.log('[Auth] getSession() called (initial load)');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[Auth] getSession() result:', session ? `session for ${session.user?.email}` : 'null', error ? `error: ${error.message}` : '');
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminRole(session?.user);
      setLoading(false);
    });

    // Listen for auth changes: runs when user signs in/out, session restored on app reopen
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange:', event, session ? `session for ${session.user?.email}` : 'session null');
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminRole(session?.user);
      setLoading(false);

      if (session) {
        const currentUser = session.user;
        console.log('[push-store] session active for user:', currentUser?.id, currentUser?.email);

        registerForPushNotificationsAsync().then(async (token: string | undefined) => {
          console.log('[push-store] device returned token:', token);

          if (currentUser && token) {
            const { data, error } = await supabase
              .from('profiles')
              .select('expo_push_token')
              .eq('id', currentUser.id)
              .single();

            if (error) {
              console.error('[push-store] error reading existing token:', error);
              return;
            }

            console.log('[push-store] existing token in DB:', data?.expo_push_token);

            if (data?.expo_push_token == null) {
              console.log('[push-store] no token stored; inserting this device\'s token');
              const { error: insertError } = await supabase
                .from('profiles')
                .update({ expo_push_token: token })
                .eq('id', currentUser.id);

              if (insertError) {
                console.error('[push-store] insert error:', insertError);
              } else {
                console.log('[push-store] insert OK');
              }
            } else if (data.expo_push_token === token) {
              console.log('[push-store] same device token already stored; no change');
            } else {
              //IMPORTANT: this means another device previously registered, and we're overwriting.
              //Same Supabase user across two devices => only the last-signed-in device receives pushes.
              console.warn('[push-store] OVERWRITING token from another device for user:', currentUser.id, {
                old: data.expo_push_token,
                new: token,
              });
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ expo_push_token: token })
                .eq('id', currentUser.id);

              if (updateError) {
                console.error('[push-store] update error:', updateError);
              } else {
                console.log('[push-store] update OK (previous device will no longer get pushes)');
              }
            }
          } else {
            console.warn('[push-store] no user or no token; nothing stored.', {
              hasUser: !!currentUser,
              hasToken: !!token,
            });
          }
        });
      }
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
    console.log('[Auth] signIn called for', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('[Auth] signIn result:', error ? `error: ${error.message}` : `session: ${data?.session ? 'ok' : 'null'}`);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log('[Auth] signUp called for', email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    console.log('[Auth] signUp result:', error ? `error: ${error.message}` : 'ok');
    return { error };
  };

  const signOut = async () => {
    console.log('[Auth] signOut called');
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
