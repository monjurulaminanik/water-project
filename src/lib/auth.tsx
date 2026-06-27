import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useMyRbac } from "@/lib/rbac";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  permissions: string[];
  isSuperAdmin: boolean;
  primaryBranchId: string | null;
  assignments: Array<{
    branch_id: string;
    role_id: string;
    is_primary: boolean;
    roles: { id: string; code: string; name_bn: string; color: string | null } | null;
  }>;
  hasPermission: (code: string) => boolean;
};

const AuthCtx = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  permissions: [],
  isSuperAdmin: false,
  primaryBranchId: null,
  assignments: [],
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;
  const { data: rbac } = useMyRbac(userId);
  const permissions = rbac?.permissions ?? [];
  const isSuperAdmin = rbac?.isSuperAdmin ?? false;
  const hasPermission = (code: string) => isSuperAdmin || permissions.includes(code);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
        permissions,
        isSuperAdmin,
        primaryBranchId: rbac?.primaryBranchId ?? null,
        assignments: rbac?.assignments ?? [],
        hasPermission,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export const usePermission = (code: string) => useAuth().hasPermission(code);

export function RequirePermission({
  code,
  fallback = null,
  children,
}: {
  code: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const ok = usePermission(code);
  return <>{ok ? children : fallback}</>;
}
