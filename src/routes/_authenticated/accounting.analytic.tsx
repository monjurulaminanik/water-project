import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WaterCard } from "@/components/water/WaterCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useAnalyticPlans, useAnalyticAccounts, useSaveAnalyticAccount, useDeleteAnalyticAccount,
  type AnalyticAccount, type AnalyticPlanCode,
} from "@/lib/analytic";

export const Route = createFileRoute("/_authenticated/accounting/analytic")({
  component: AnalyticPage,
});

const PLAN_LABEL: Record<AnalyticPlanCode, string> = {
  BRANCH: "শাখা",
  COST_CENTER: "কস্ট সেন্টার",
  PROJECT: "প্রকল্প",
  PRODUCT_CATEGORY: "পণ্য শ্রেণি",
};

function AnalyticPage() {
  const [tab, setTab] = useState<AnalyticPlanCode>("COST_CENTER");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#0C4A6E]">অ্যানালিটিক অ্যাকাউন্টিং</h2>
      <Tabs value={tab} onValueChange={(v) => setTab(v as AnalyticPlanCode)}>
        <TabsList>
          {(Object.keys(PLAN_LABEL) as AnalyticPlanCode[]).map((k) => (
            <TabsTrigger key={k} value={k}>{PLAN_LABEL[k]}</TabsTrigger>
          ))}
        </TabsList>
        {(Object.keys(PLAN_LABEL) as AnalyticPlanCode[]).map((k) => (
          <TabsContent key={k} value={k}>
            <PlanTable planCode={k} readOnly={k === "BRANCH"} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PlanTable({ planCode, readOnly }: { planCode: AnalyticPlanCode; readOnly: boolean }) {
  const { data: plans = [] } = useAnalyticPlans();
  const { data: rows = [], isLoading } = useAnalyticAccounts(planCode);
  const del = useDeleteAnalyticAccount();
  const plan = useMemo(() => plans.find((p) => p.code === planCode), [plans, planCode]);
  const [edit, setEdit] = useState<Partial<AnalyticAccount> | null>(null);

  return (
    <WaterCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-[#0369A1]">
          {PLAN_LABEL[planCode]} {readOnly && <span className="ml-2 text-xs">(শুধু পড়ার জন্য — শাখা যোগ করুন শাখা ব্যবস্থাপনায়)</span>}
        </p>
        {!readOnly && plan && (
          <Button size="sm" onClick={() => setEdit({ plan_id: plan.id })}
            className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
            <Plus className="h-4 w-4" /> নতুন
          </Button>
        )}
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-[#F0F9FF] text-xs text-[#0369A1]">
          <tr>
            <th className="px-3 py-2 text-left">কোড</th>
            <th className="px-3 py-2 text-left">নাম</th>
            <th className="px-3 py-2 text-left">অবস্থা</th>
            {!readOnly && <th />}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E0F2FE]">
          {isLoading && <tr><td colSpan={4} className="p-3 text-center">লোড হচ্ছে...</td></tr>}
          {!isLoading && rows.length === 0 && (
            <tr><td colSpan={4} className="p-6 text-center text-[#0369A1]">কোন এন্ট্রি নেই</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-[#F0F9FF]/60">
              <td className="px-3 py-2 font-mono text-[#0C4A6E]">{r.code}</td>
              <td className="px-3 py-2 text-[#0369A1]">{r.name_bn}</td>
              <td className="px-3 py-2 text-xs">{r.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</td>
              {!readOnly && (
                <td className="px-3 py-2 text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEdit(r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={async () => {
                    if (!confirm("মুছে ফেলবেন?")) return;
                    try { await del.mutateAsync(r.id); toast.success("মুছে ফেলা হয়েছে"); }
                    catch (e) { toast.error((e as Error).message); }
                  }}>
                    <Trash2 className="h-3.5 w-3.5 text-[#B91C1C]" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <AnalyticDialog open={!!edit} initial={edit} onClose={() => setEdit(null)} />
    </WaterCard>
  );
}

function AnalyticDialog({ open, initial, onClose }: {
  open: boolean; initial: Partial<AnalyticAccount> | null; onClose: () => void;
}) {
  const save = useSaveAnalyticAccount();
  const [form, setForm] = useState<Partial<AnalyticAccount>>({});
  useMemo(() => { if (open) setForm(initial ?? {}); }, [open, initial]);

  const submit = async () => {
    if (!form.code || !form.name_bn || !form.plan_id) {
      toast.error("কোড, নাম এবং প্ল্যান প্রয়োজন"); return;
    }
    try {
      await save.mutateAsync({
        ...form,
        plan_id: form.plan_id!,
        is_active: form.is_active ?? true,
      });
      toast.success("সংরক্ষিত");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="water-glass">
        <DialogHeader><DialogTitle>{form.id ? "সম্পাদনা" : "নতুন এন্ট্রি"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>কোড *</Label>
            <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div>
            <Label>নাম *</Label>
            <Input value={form.name_bn ?? ""} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} />
          </div>
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
