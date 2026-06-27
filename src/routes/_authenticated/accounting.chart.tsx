import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WaterCard } from "@/components/water/WaterCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts, useAccountTypes, useSaveAccount, ACCOUNT_CATEGORY_BN, type Account } from "@/lib/accounting";

export const Route = createFileRoute("/_authenticated/accounting/chart")({
  component: ChartOfAccountsPage,
});

const schema = z.object({
  code: z.string().min(1, "কোড প্রয়োজন"),
  name_bn: z.string().min(1, "নাম প্রয়োজন"),
  name_en: z.string().optional(),
  account_type_id: z.string().min(1, "ধরন নির্বাচন করুন"),
  parent_id: z.string().optional(),
  is_group: z.boolean(),
  is_active: z.boolean(),
  description_bn: z.string().optional(),
});
type FormVals = z.infer<typeof schema>;

function ChartOfAccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: types = [] } = useAccountTypes();
  const save = useSaveAccount();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const s = search.toLowerCase();
    return accounts.filter((a) => a.code.toLowerCase().includes(s) || a.name_bn.toLowerCase().includes(s));
  }, [accounts, search]);

  const groups = useMemo(() => accounts.filter((a) => a.is_group), [accounts]);

  const onNew = () => { setEditing(null); setOpen(true); };
  const onEdit = (a: Account) => { setEditing(a); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#0C4A6E]">হিসাব ছক (Chart of Accounts)</h2>
        <Button onClick={onNew} className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
          <Plus className="h-4 w-4" /> নতুন হিসাব
        </Button>
      </div>

      <WaterCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0369A1]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="কোড বা নাম..." className="pl-9" />
        </div>
      </WaterCard>

      <WaterCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#F0F9FF] text-left text-xs font-medium uppercase text-[#0369A1]">
                <th className="px-4 py-3">কোড</th>
                <th className="px-4 py-3">নাম</th>
                <th className="px-4 py-3">শ্রেণি</th>
                <th className="px-4 py-3">ধরন</th>
                <th className="px-4 py-3">অবস্থা</th>
                <th className="px-4 py-3 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2FE]">
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-[#0369A1]">কোনো হিসাব নেই</td></tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-[#F0F9FF]/60">
                  <td className="px-4 py-2 font-mono text-[#0C4A6E]">{a.code}</td>
                  <td className="px-4 py-2">
                    <div style={{ paddingLeft: `${(a.level - 1) * 16}px` }}>
                      <span className={a.is_group ? "font-semibold text-[#0C4A6E]" : "text-[#0C4A6E]"}>
                        {a.name_bn}
                      </span>
                      {a.is_group && <Badge variant="outline" className="ml-2">গ্রুপ</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-[#0369A1]">
                    {a.account_types?.category ? ACCOUNT_CATEGORY_BN[a.account_types.category] : "—"}
                  </td>
                  <td className="px-4 py-2 text-[#0369A1]">{a.account_types?.name_bn ?? "—"}</td>
                  <td className="px-4 py-2">
                    {a.is_active
                      ? <Badge className="bg-[#CCFBF1] text-[#0F766E]">সক্রিয়</Badge>
                      : <Badge variant="outline">নিষ্ক্রিয়</Badge>}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WaterCard>

      <AccountDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        types={types}
        groups={groups}
        onSubmit={async (vals) => {
          try {
            await save.mutateAsync({
              ...vals,
              parent_id: vals.parent_id || null,
              level: vals.parent_id ? 2 : 1,
              id: editing?.id,
            } as Partial<Account>);
            toast.success("সফলভাবে সংরক্ষিত");
            setOpen(false);
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </div>
  );
}

function AccountDialog({
  open, onOpenChange, editing, types, groups, onSubmit,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  editing: Account | null;
  types: { id: string; name_bn: string; category: string }[];
  groups: Account[];
  onSubmit: (v: FormVals) => Promise<void>;
}) {
  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    values: editing ? {
      code: editing.code,
      name_bn: editing.name_bn,
      name_en: editing.name_en ?? "",
      account_type_id: editing.account_type_id,
      parent_id: editing.parent_id ?? "",
      is_group: editing.is_group,
      is_active: editing.is_active,
      description_bn: editing.description_bn ?? "",
    } : {
      code: "", name_bn: "", name_en: "", account_type_id: "",
      parent_id: "", is_group: false, is_active: true, description_bn: "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl water-glass">
        <DialogHeader>
          <DialogTitle>{editing ? "হিসাব সম্পাদনা" : "নতুন হিসাব"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>কোড *</Label>
              <Input {...form.register("code")} />
            </div>
            <div>
              <Label>বাংলা নাম *</Label>
              <Input {...form.register("name_bn")} />
            </div>
            <div>
              <Label>ইংরেজি নাম</Label>
              <Input {...form.register("name_en")} />
            </div>
            <div>
              <Label>হিসাবের ধরন *</Label>
              <Select value={form.watch("account_type_id")} onValueChange={(v) => form.setValue("account_type_id", v)}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name_bn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>মূল গ্রুপ (parent)</Label>
              <Select value={form.watch("parent_id") || "none"} onValueChange={(v) => form.setValue("parent_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— শীর্ষ স্তর —</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.code} — {g.name_bn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.watch("is_group")} onCheckedChange={(v) => form.setValue("is_group", v)} />
              <Label>গ্রুপ হিসাব</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
              <Label>সক্রিয়</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
            <Button type="submit" className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
              সংরক্ষণ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
