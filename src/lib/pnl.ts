import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PnLRow = {
  category: "income" | "expense" | "cost_of_revenue";
  account_id: string;
  account_code: string;
  account_name_bn: string;
  amount: number;
};

export function useBranchPnL(params: {
  branchId: string | null;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}) {
  const { branchId, startDate, endDate, enabled = true } = params;
  return useQuery({
    queryKey: ["branch_pnl", branchId, startDate, endDate],
    enabled: !!branchId && enabled,
    queryFn: async (): Promise<PnLRow[]> => {
      const { data, error } = await supabase.rpc("get_branch_pnl", {
        p_branch_id: branchId,
        p_start: startDate,
        p_end: endDate,
      });
      if (error) throw error;
      return (data ?? []) as PnLRow[];
    },
  });
}

export type AccountBalance = {
  account_id: string;
  account_code: string;
  account_name_bn: string;
  category: string;
  debit_total: number;
  credit_total: number;
  balance: number;
};

export function useAccountBalances(branchId: string | null) {
  return useQuery({
    queryKey: ["account_balances", branchId],
    queryFn: async (): Promise<Record<string, number>> => {
      let q = supabase
        .from("journal_lines")
        .select("account_id, debit, credit, journal_entries!inner(status, branch_id)")
        .eq("journal_entries.status", "posted");
      if (branchId) q = q.eq("journal_entries.branch_id", branchId);
      const { data, error } = await q;
      if (error) throw error;
      const map: Record<string, { debit: number; credit: number }> = {};
      (data ?? []).forEach((l: { account_id: string; debit: number | string; credit: number | string }) => {
        const cur = map[l.account_id] ?? { debit: 0, credit: 0 };
        cur.debit += Number(l.debit || 0);
        cur.credit += Number(l.credit || 0);
        map[l.account_id] = cur;
      });
      const result: Record<string, number> = {};
      Object.entries(map).forEach(([k, v]) => { result[k] = v.debit - v.credit; });
      return result;
    },
  });
}
