import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BranchType = "head_office" | "showroom" | "warehouse" | "service_center";

export type Branch = {
  id: string;
  code: string;
  name_bn: string;
  name_en: string | null;
  branch_type: BranchType;
  address: string | null;
  city: string | null;
  division: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  opening_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export const BRANCH_TYPES: { value: BranchType; label: string }[] = [
  { value: "head_office", label: "প্রধান কার্যালয়" },
  { value: "showroom", label: "শোরুম" },
  { value: "warehouse", label: "গুদাম" },
  { value: "service_center", label: "সার্ভিস সেন্টার" },
];

export const DIVISIONS = [
  "ঢাকা", "চট্টগ্রাম", "খুলনা", "রাজশাহী",
  "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ",
];

export function branchTypeLabel(t: BranchType) {
  return BRANCH_TYPES.find((x) => x.value === t)?.label ?? t;
}

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async (): Promise<Branch[]> => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Branch[];
    },
  });
}

export function useSaveBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Branch> & { id?: string }) => {
      if (input.id) {
        const { id, created_at, updated_at, created_by, ...rest } = input;
        const { data, error } = await supabase
          .from("branches")
          .update({ ...rest, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("branches")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useToggleBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("branches")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}
