import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AnalyticPlanCode = "BRANCH" | "COST_CENTER" | "PROJECT" | "PRODUCT_CATEGORY";

export type AnalyticPlan = {
  id: string;
  code: AnalyticPlanCode;
  name_bn: string;
  is_system: boolean;
};

export type AnalyticAccount = {
  id: string;
  plan_id: string;
  code: string;
  name_bn: string;
  parent_id: string | null;
  linked_branch_id: string | null;
  is_active: boolean;
  analytic_plans?: AnalyticPlan;
};

export function useAnalyticPlans() {
  return useQuery({
    queryKey: ["analytic_plans"],
    queryFn: async (): Promise<AnalyticPlan[]> => {
      const { data, error } = await supabase
        .from("analytic_plans").select("*").order("code");
      if (error) throw error;
      return (data ?? []) as AnalyticPlan[];
    },
  });
}

export function useAnalyticAccounts(planCode?: AnalyticPlanCode) {
  return useQuery({
    queryKey: ["analytic_accounts", planCode ?? "all"],
    queryFn: async (): Promise<AnalyticAccount[]> => {
      let q = supabase
        .from("analytic_accounts")
        .select("*, analytic_plans!inner(*)")
        .order("code");
      if (planCode) q = q.eq("analytic_plans.code", planCode);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AnalyticAccount[];
    },
  });
}

export function useSaveAnalyticAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AnalyticAccount> & { id?: string; plan_id: string }) => {
      const { analytic_plans: _ap, id, ...rest } = input as AnalyticAccount & { analytic_plans?: unknown };
      if (id) {
        const { error } = await supabase.from("analytic_accounts").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("analytic_accounts").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytic_accounts"] }),
  });
}

export function useDeleteAnalyticAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("analytic_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analytic_accounts"] }),
  });
}
