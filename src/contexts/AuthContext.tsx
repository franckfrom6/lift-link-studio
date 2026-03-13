import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "coach" | "student" | null;

interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  is_admin: boolean;
  onboarding_completed: boolean;
  unit_preference?: "metric" | "imperial";
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchInProgress = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    if (profileFetchInProgress.current) return;
    profileFetchInProgress.current = true;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setProfile(data as Profile);
        setRole(data.role as UserRole);
      } else {
        setProfile(null);
        setRole(null);
      }
    } finally {
      profileFetchInProgress.current = false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            await fetchProfile(session.user.id);
          } catch (e) {
            console.error("Error fetching profile:", e);
          }
        } else {
          setProfile(null);
          setRole(null);
        }
        if (isMounted) setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          await fetchProfile(session.user.id);
        } catch (e) {
          console.error("Error fetching profile:", e);
        }
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error };

    if (data.user) {
      try {
        // Check if profile already exists (trigger may have created it)
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const { error: profileError } = await supabase.from("profiles").insert({
            user_id: data.user.id,
            full_name: "",
            onboarding_completed: false,
          });
          if (profileError) {
            console.error("Error creating profile:", profileError);
            return { error: profileError };
          }
        }
      } catch (e: any) {
        console.error("Error during profile creation:", e);
        return { error: e };
      }
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
