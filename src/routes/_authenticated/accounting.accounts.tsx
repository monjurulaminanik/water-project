import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { WaterCard } from "@/components/water/WaterCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAccounts, useAccountTypes, useSaveAccount,
  ACCOUNT_CATEGORY_BN, type Account, type AccountCategory,
} from "@/lib/accounting";
import { useAccountBalances } from "@/lib/pnl";
import { useCurrentBranch } from "@/lib/branch-context";
import { formatBDT } from "@/lib/bn";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/accounting/accounts")({
  component: AccountsTreePage,
});

const CATEGORY_COLORS: Record<AccountCategory, string> = {
  asset: "border-l-[#0EA5E9]",
  liability: "border-l-[#F59E0B]",
  equity: "border-l-[#8B5CF6]",
  income: "border-l-[#10B981]",
  expense: "border-l-[#EF4444]",
};

function AccountsTreePage() {
  const { currentBranchId } = useCurrentBranch();
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: balances = {} } = useAccountBalances(currentBranchId);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | AccountCategory>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [edit, setEdit] = useState<Partial<Account> | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (filter !== "all" && a.account_types?.category !== filter) return false;
      if (!s) return true;
      return a.code.toLowerCase().includes(s) || a.name_bn.toLowerCase().includes(s);
    });
  }, [accounts, search, filter]);

  // build tree
  const tree = useMemo(() => {
    const byParent = new Map<string | null, Account[]>();
    filtered.forEach((a) => {
      const p = a.parent_id;
      const arr = byParent.get(p) ?? [];
      arr.push(a);
      byParent.set(p, arr);
    });
    return byParent;
  }, [filtered]);

  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const renderNode = (node: Account, depth: number) => {
    const children = tree.get(node.id) ?? [];
    const isOpen = expanded[node.id] ?? depth < 1;
    const cat = node.account_types?.category as AccountCategory | undefined;
    const bal = balances[node.id] ?? 0;
    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 border-l-4 rounded-r-lg px-3 py-2 hover:bg-[#F0F9FF]",
            cat ? CATEGORY_COLORS[cat] : "border-l-transparent",
          )}
          style={{ marginLeft: depth * 16 }}
        >
          <button
            onClick={() => node.is_group && toggle(node.id)}
            className="flex h-5 w-5 items-center justify-center text-[#0369A1]"
          >
            {node.is_group ? (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : null}
          </button>
          <span className="rounded bg-[#E0F2FE] px-2 py-0.5 font-mono text-xs text-[#0C4A6E]">{node.code}</span>
          <span className={cn("flex-1 text-sm", node.is_group ? "font-semibold text-[#0C4A6E]" : "text-[#0369A1]")}>
            {node.name_bn}
          </span>
          {!node.is_group && (
            <span className="font-mono text-xs text-[#0C4A6E]">{formatBDT(bal)}</span>
          )}
          <Button size="icon" variant="ghost" onClick={() => setEdit(node)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        {node.is_group && isOpen && children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  const roots = tree.get(null) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#0C4A6E]">হিসাব ছক (Tree View)</h2>
        <Button onClick={() => setEdit({})} className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
          <Plus className="h-4 w-4" /> নতুন হিসাব
        </Button>
      </div>

      <WaterCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0369A1]" />
            <Input
              placeholder="কোড বা নাম দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label="সকল" />
            {(Object.keys(ACCOUNT_CATEGORY_BN) as AccountCategory[]).map((c) => (
              <FilterPill key={c} active={filter === c} onClick={() => setFilter(c)} label={ACCOUNT_CATEGORY_BN[c]} />
            ))}
          </div>
        </div>
      </WaterCard>

      <WaterCard className="p-3">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-[#0369A1]">লোড হচ্ছে...</div>
        ) : roots.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#0369A1]">কোন হিসাব পাওয়া যায়নি</div>
        ) : (
          <div className="space-y-1">{roots.map((r) => renderNode(r, 0))}</div>
        )}
      </WaterCard>

      <AccountDialog
        open={!!edit}
        account={edit}
        onClose={() => setEdit(null)}
      />
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition",
        active ? "bg-[#0EA5E9] text-white" : "bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD]",
      )}
    >
      {label}
    </button>
  );
}

function AccountDialog({ open, account, onClose }: {
  open: boolean; account: Partial<Account> | null; onClose: () => void;
}) {
  const { data: types = [] } = useAccountTypes();
  const { data: accounts = [] } = useAccounts();
  const save = useSaveAccount();
  const [form, setForm] = useState<Partial<Account>>({});

  // sync when dialog opens
  useMemo(() => { if (open) setForm(account ?? {}); }, [open, account]);

  const groups = accounts.filter((a) => a.is_group);

  const submit = async () => {
    if (!form.code || !form.name_bn || !form.account_type_id) {
      toast.error("কোড, নাম এবং প্রকার প্রয়োজন"); return;
    }
    try {
      await save.mutateAsync({
        ...form,
        is_group: !!form.is_group,
        is_active: form.is_active ?? true,
        currency_code: form.currency_code || "BDT",
        opening_debit: Number(form.opening_debit || 0),
        opening_credit: Number(form.opening_credit || 0),
        allow_branch_dimension: form.allow_branch_dimension ?? true,
        parent_id: form.parent_id || null,
        level: 0,
      });
      toast.success("সংরক্ষিত হয়েছে");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl water-glass">
        <DialogHeader>
          <DialogTitle>{form.id ? "হিসাব সম্পাদনা" : "নতুন হিসাব"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>কোড *</Label>
            <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div>
            <Label>নাম (বাংলা) *</Label>
            <Input value={form.name_bn ?? ""} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
          </div>
          <div>
            <Label>প্রকার *</Label>
            <Select value={form.account_type_id ?? ""} onValueChange={(v) => setForm({ ...form, account_type_id: v })}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {ACCOUNT_CATEGORY_BN[t.category]} — {t.name_bn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>পিতা হিসাব</Label>
            <Select
              value={form.parent_id ?? "__none"}
              onValueChange={(v) => setForm({ ...form, parent_id: v === "__none" ? null : v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— কোনটি নয় —</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.code} — {g.name_bn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>প্রারম্ভিক ডেবিট</Label>
            <Input type="number" value={form.opening_debit ?? 0} onChange={(e) => setForm({ ...form, opening_debit: Number(e.target.value) })} />
          </div>
          <div>
            <Label>প্রারম্ভিক ক্রেডিট</Label>
            <Input type="number" value={form.opening_credit ?? 0} onChange={(e) => setForm({ ...form, opening_credit: Number(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <Label>বিবরণ</Label>
            <Textarea
              rows={2}
              value={form.description_bn ?? ""}
              onChange={(e) => setForm({ ...form, description_bn: e.target.value })}
            />
          </div>
          <label className="flex items-center justify-between rounded-lg bg-[#F0F9FF] px-3 py-2">
            <span className="text-sm text-[#0369A1]">গ্রুপ হিসাব</span>
            <Switch checked={!!form.is_group} onCheckedChange={(v) => setForm({ ...form, is_group: v })} />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-[#F0F9FF] px-3 py-2">
            <span className="text-sm text-[#0369A1]">শাখা মাত্রা</span>
            <Switch checked={form.allow_branch_dimension ?? true} onCheckedChange={(v) => setForm({ ...form, allow_branch_dimension: v })} />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-[#F0F9FF] px-3 py-2">
            <span className="text-sm text-[#0369A1]">সক্রিয়</span>
            <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-[#F0F9FF] px-3 py-2">
            <span className="text-sm text-[#0369A1]">পুনঃমিলযোগ্য</span>
            <Switch checked={!!form.is_reconcilable} onCheckedChange={(v) => setForm({ ...form, is_reconcilable: v })} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>বাতিল</Button>
          <Button onClick={submit} className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
            সংরক্ষণ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
