import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AccountCategory = "asset" | "liability" | "equity" | "income" | "expense";

export type AccountType = {
  id: string;
  code: string;
  name_bn: string;
  category: AccountCategory;
  normal_balance: "debit" | "credit";
  report_section: string;
  sort_order: number;
};

export type Account = {
  id: string;
  code: string;
  name_bn: string;
  name_en: string | null;
  account_type_id: string;
  parent_id: string | null;
  is_group: boolean;
  level: number;
  is_reconcilable: boolean;
  allow_branch_dimension: boolean;
  currency_code: string;
  opening_debit: number;
  opening_credit: number;
  is_active: boolean;
  description_bn: string | null;
  account_types?: AccountType;
};

export type Journal = {
  id: string;
  code: string;
  name_bn: string;
  journal_type: "sale" | "purchase" | "cash" | "bank" | "general";
  sequence_prefix: string | null;
  next_sequence: number;
  branch_id: string | null;
  is_active: boolean;
};

export type FiscalYear = {
  id: string;
  name: string;
  name_bn: string;
  start_date: string;
  end_date: string;
  status: "draft" | "open" | "closed" | "locked";
  is_current: boolean;
};

export type JournalEntry = {
  id: string;
  entry_number: string;
  journal_id: string;
  entry_date: string;
  period_id: string | null;
  reference: string | null;
  narration_bn: string | null;
  status: "draft" | "posted" | "cancelled";
  branch_id: string;
  total_debit: number;
  total_credit: number;
  source_module: string;
  created_at: string;
  journals?: Journal;
  branches?: { name_bn: string };
};

export type JournalLine = {
  id?: string;
  entry_id?: string;
  line_number: number;
  account_id: string;
  debit: number;
  credit: number;
  description_bn: string | null;
  branch_id: string | null;
};

export const ACCOUNT_CATEGORY_BN: Record<AccountCategory, string> = {
  asset: "সম্পদ",
  liability: "দায়",
  equity: "মূলধন",
  income: "আয়",
  expense: "ব্যয়",
};

export function useAccountTypes() {
  return useQuery({
    queryKey: ["account_types"],
    queryFn: async (): Promise<AccountType[]> => {
      const { data, error } = await supabase
        .from("account_types").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as AccountType[];
    },
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*, account_types(*)")
        .order("code");
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });
}

export function useSaveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Account> & { id?: string }) => {
      if (input.id) {
        const { id, account_types, ...rest } = input as Account & { account_types?: unknown };
        const { error } = await supabase.from("accounts").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { account_types, ...rest } = input as Account & { account_types?: unknown };
        const { error } = await supabase.from("accounts").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useJournals() {
  return useQuery({
    queryKey: ["journals"],
    queryFn: async (): Promise<Journal[]> => {
      const { data, error } = await supabase
        .from("journals").select("*").eq("is_active", true).order("code");
      if (error) throw error;
      return (data ?? []) as Journal[];
    },
  });
}

export function useFiscalYears() {
  return useQuery({
    queryKey: ["fiscal_years"],
    queryFn: async (): Promise<FiscalYear[]> => {
      const { data, error } = await supabase
        .from("fiscal_years").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FiscalYear[];
    },
  });
}

export function useJournalEntries(filter?: { branchId?: string | null; status?: string }) {
  return useQuery({
    queryKey: ["journal_entries", filter?.branchId, filter?.status],
    queryFn: async (): Promise<JournalEntry[]> => {
      let q = supabase
        .from("journal_entries")
        .select("*, journals(*), branches(name_bn)")
        .order("entry_date", { ascending: false })
        .limit(200);
      if (filter?.branchId) q = q.eq("branch_id", filter.branchId);
      if (filter?.status && filter.status !== "all") q = q.eq("status", filter.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as JournalEntry[];
    },
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      journal_id: string;
      entry_date: string;
      branch_id: string;
      narration_bn: string;
      reference?: string;
      lines: Omit<JournalLine, "entry_id">[];
      post: boolean;
    }) => {
      const totalDr = input.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
      const totalCr = input.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
      if (Math.abs(totalDr - totalCr) > 0.001) {
        throw new Error(`ডেবিট ও ক্রেডিট সমান নয়: ডেবিট ${totalDr}, ক্রেডিট ${totalCr}`);
      }

      // Get journal prefix for entry number
      const { data: j, error: je } = await supabase
        .from("journals").select("code, sequence_prefix, next_sequence").eq("id", input.journal_id).single();
      if (je) throw je;

      const entryNum = `${j.sequence_prefix || j.code}2026/${String(j.next_sequence).padStart(5, "0")}`;

      const { data: entry, error: e1 } = await supabase
        .from("journal_entries")
        .insert({
          entry_number: entryNum,
          journal_id: input.journal_id,
          entry_date: input.entry_date,
          branch_id: input.branch_id,
          narration_bn: input.narration_bn,
          reference: input.reference || null,
          status: "draft",
          total_debit: totalDr,
          total_credit: totalCr,
          source_module: "manual",
        })
        .select()
        .single();
      if (e1) throw e1;

      const lines = input.lines.map((l, i) => ({
        entry_id: entry.id,
        line_number: i + 1,
        account_id: l.account_id,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        description_bn: l.description_bn,
        branch_id: l.branch_id || input.branch_id,
      }));
      const { error: e2 } = await supabase.from("journal_lines").insert(lines);
      if (e2) throw e2;

      await supabase.from("journals")
        .update({ next_sequence: j.next_sequence + 1 }).eq("id", input.journal_id);

      if (input.post) {
        const { error: e3 } = await supabase
          .from("journal_entries")
          .update({ status: "posted", posted_at: new Date().toISOString() })
          .eq("id", entry.id);
        if (e3) throw e3;
      }

      return entry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      qc.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function usePostEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("journal_entries")
        .update({ status: "posted", posted_at: new Date().toISOString() })
        .eq("id", id).eq("status", "draft");
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal_entries"] }),
  });
}

export function useCancelEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("journal_entries")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: reason })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal_entries"] }),
  });
}
