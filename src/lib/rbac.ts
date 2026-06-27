import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = {
  id: string;
  code: string;
  name_bn: string;
  description_bn: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
};

export type Permission = {
  id: string;
  module: string;
  action: "view" | "create" | "edit" | "delete" | "approve" | "export";
  code: string;
  name_bn: string | null;
};

export type UserBranchRow = {
  id: string;
  user_id: string;
  branch_id: string;
  role_id: string;
  is_primary: boolean;
  assigned_at: string;
};

export const MODULES_BN: Record<string, string> = {
  dashboard: "ড্যাশবোর্ড", branches: "শাখা", users: "ব্যবহারকারী",
  accounting: "হিসাব", inventory: "ইনভেন্টরি", purchase: "ক্রয়",
  sales: "বিক্রয়", crm: "গ্রাহক", manufacturing: "উৎপাদন",
  projects: "প্রকল্প", service: "সার্ভিস", amc: "এএমসি",
  hr: "মানবসম্পদ", payroll: "বেতন", reports: "প্রতিবেদন",
  settings: "সেটিংস",
};

export const ACTIONS_BN: Record<Permission["action"], string> = {
  view: "দেখা", create: "তৈরি", edit: "সম্পাদনা",
  delete: "মুছে ফেলা", approve: "অনুমোদন", export: "এক্সপোর্ট",
};

export const MODULE_ORDER = Object.keys(MODULES_BN);
export const ACTION_ORDER: Permission["action"][] = ["view", "create", "edit", "delete", "approve", "export"];

export const ROLE_COLOR_CLASS: Record<string, string> = {
  red: "bg-rose-100 text-rose-700 border-rose-200",
  blue: "bg-sky-100 text-sky-700 border-sky-200",
  green: "bg-emerald-100 text-emerald-700 border-emerald-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
};

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async (): Promise<Role[]> => {
      const { data, error } = await supabase.from("roles").select("*").order("code");
      if (error) throw error;
      return (data ?? []) as Role[];
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async (): Promise<Permission[]> => {
      const { data, error } = await supabase.from("permissions").select("*");
      if (error) throw error;
      return (data ?? []) as Permission[];
    },
  });
}

export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: ["role_permissions", roleId],
    enabled: !!roleId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", roleId!);
      if (error) throw error;
      return (data ?? []).map((r: { permission_id: string }) => r.permission_id);
    },
  });
}

export function useSaveRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      const { error: delErr } = await supabase.from("role_permissions").delete().eq("role_id", roleId);
      if (delErr) throw delErr;
      if (permissionIds.length) {
        const rows = permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid }));
        const { error } = await supabase.from("role_permissions").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["role_permissions", v.roleId] });
      qc.invalidateQueries({ queryKey: ["my-rbac"] });
    },
  });
}

export type UserBranchAssignment = {
  branch_id: string;
  role_id: string;
  is_primary: boolean;
};

export function useUserBranches(userId: string | null) {
  return useQuery({
    queryKey: ["user_branches", userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserBranchRow[]> => {
      const { data, error } = await supabase
        .from("user_branches")
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []) as UserBranchRow[];
    },
  });
}

export function useSaveUserBranches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      assignments,
    }: {
      userId: string;
      assignments: UserBranchAssignment[];
    }) => {
      await supabase.from("user_branches").delete().eq("user_id", userId);
      if (assignments.length) {
        const rows = assignments.map((a) => ({ user_id: userId, ...a }));
        const { error } = await supabase.from("user_branches").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["user_branches", v.userId] });
      qc.invalidateQueries({ queryKey: ["users-list"] });
    },
  });
}

// Profile + assignments for user list
export type UserListItem = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  employee_code: string | null;
  designation_bn: string | null;
  is_active: boolean;
  email?: string | null;
  assignments: { branch_id: string; role_id: string; is_primary: boolean }[];
};

export function useUsersList() {
  return useQuery({
    queryKey: ["users-list"],
    queryFn: async (): Promise<UserListItem[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url, employee_code, designation_bn, is_active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const profileRows = (profiles ?? []) as unknown as Array<Omit<UserListItem, "assignments">>;
      const ids = profileRows.map((p) => p.id);
      let assignments: { user_id: string; branch_id: string; role_id: string; is_primary: boolean }[] = [];
      if (ids.length) {
        const { data: ub } = await supabase
          .from("user_branches")
          .select("user_id, branch_id, role_id, is_primary")
          .in("user_id", ids);
        assignments = (ub ?? []) as typeof assignments;
      }
      return profileRows.map((p) => ({
        ...p,
        assignments: assignments
          .filter((a) => a.user_id === p.id)
          .map(({ branch_id, role_id, is_primary }) => ({ branch_id, role_id, is_primary })),
      }));
    },
  });
}

type RbacRoleJoin = { id: string; code: string; name_bn: string; color: string | null };
type RbacAssignmentRow = {
  branch_id: string;
  role_id: string;
  is_primary: boolean;
  roles: RbacRoleJoin | RbacRoleJoin[] | null;
};

export function useMyRbac(userId: string | null) {
  return useQuery({
    queryKey: ["my-rbac", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: ub } = await supabase
        .from("user_branches")
        .select("branch_id, role_id, is_primary, roles(id, code, name_bn, color)")
        .eq("user_id", userId!);
      const raw = (ub ?? []) as unknown as RbacAssignmentRow[];
      const assignments = raw.map((r) => ({
        branch_id: r.branch_id,
        role_id: r.role_id,
        is_primary: r.is_primary,
        roles: Array.isArray(r.roles) ? r.roles[0] ?? null : r.roles,
      }));
      const roleIds = [...new Set(assignments.map((a) => a.role_id))];
      let permCodes: string[] = [];
      if (roleIds.length) {
        const { data: rps } = await supabase
          .from("role_permissions")
          .select("permissions(code)")
          .in("role_id", roleIds);
        const rpsRows = (rps ?? []) as unknown as Array<{ permissions: { code: string } | { code: string }[] | null }>;
        permCodes = [
          ...new Set(
            rpsRows
              .map((r) => (Array.isArray(r.permissions) ? r.permissions[0]?.code : r.permissions?.code))
              .filter(Boolean) as string[],
          ),
        ];
      }
      const isSuperAdmin = assignments.some((a) => a.roles?.code === "SUPER_ADMIN");
      const primary = assignments.find((a) => a.is_primary)?.branch_id ?? null;
      return { assignments, permissions: permCodes, isSuperAdmin, primaryBranchId: primary };
    },
  });
}
