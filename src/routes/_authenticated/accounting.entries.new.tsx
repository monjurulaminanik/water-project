import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { WaterCard } from "@/components/water/WaterCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAccounts, useJournals, useCreateJournalEntry,
} from "@/lib/accounting";
import { useAnalyticAccounts } from "@/lib/analytic";
import { useBranches } from "@/lib/branches";
import { useCurrentBranch } from "@/lib/branch-context";
import { formatBDT } from "@/lib/bn";

export const Route = createFileRoute("/_authenticated/accounting/entries/new")({
  component: NewEntryPage,
});

type Line = {
  account_id: string;
  debit: string;
  credit: string;
  description_bn: string;
  cost_center_id: string;
  project_id: string;
};

const emptyLine = (): Line => ({
  account_id: "", debit: "", credit: "", description_bn: "",
  cost_center_id: "", project_id: "",
});

function NewEntryPage() {
  const navigate = useNavigate();
  const { data: accounts = [] } = useAccounts();
  const { data: journals = [] } = useJournals();
  const { data: branches = [] } = useBranches();
  const { data: costCenters = [] } = useAnalyticAccounts("COST_CENTER");
  const { data: projects = [] } = useAnalyticAccounts("PROJECT");
  const { currentBranchId } = useCurrentBranch();
  const create = useCreateJournalEntry();

  const [journalId, setJournalId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState(currentBranchId ?? "");
  const [narration, setNarration] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);

  const leaf = useMemo(() => accounts.filter((a) => !a.is_group && a.is_active), [accounts]);
  const totalDr = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCr = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const diff = totalDr - totalCr;
  const balanced = Math.abs(diff) < 0.001 && totalDr > 0;

  const update = (i: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  };

  const submit = async (post: boolean) => {
    if (!journalId || !branchId) { toast.error("জার্নাল ও শাখা নির্বাচন করুন"); return; }
    const valid = lines.filter((l) => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (valid.length < 2) { toast.error("কমপক্ষে ২টি লাইন প্রয়োজন"); return; }
    try {
      await create.mutateAsync({
        journal_id: journalId,
        entry_date: date,
        branch_id: branchId,
        narration_bn: narration,
        reference,
        lines: valid.map((l, i) => ({
          line_number: i + 1,
          account_id: l.account_id,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          description_bn: l.description_bn || null,
          branch_id: branchId,
        })),
        post,
      });
      toast.success(post ? "এন্ট্রি পোস্ট হয়েছে" : "খসড়া সংরক্ষিত");
      navigate({ to: "/accounting/journals" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate({ to: "/accounting/journals" })}>
          <ArrowLeft className="h-4 w-4" /> ফিরে যান
        </Button>
        <h2 className="text-xl font-semibold text-[#0C4A6E]">নতুন জার্নাল এন্ট্রি</h2>
        <div className="w-24" />
      </div>

      <WaterCard className="p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>জার্নাল *</Label>
            <Select value={journalId} onValueChange={setJournalId}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>
                {journals.map((j) => <SelectItem key={j.id} value={j.id}>{j.name_bn}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>তারিখ *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>শাখা *</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_bn}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>বিবরণ</Label>
            <Textarea rows={2} value={narration} onChange={(e) => setNarration(e.target.value)} />
          </div>
          <div>
            <Label>রেফারেন্স</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
        </div>
      </WaterCard>

      <WaterCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F0F9FF] text-xs text-[#0369A1]">
              <tr>
                <th className="px-2 py-2 text-left w-[26%]">হিসাব</th>
                <th className="px-2 py-2 text-left">বর্ণনা</th>
                <th className="px-2 py-2 text-left w-[12%]">কস্ট সেন্টার</th>
                <th className="px-2 py-2 text-left w-[12%]">প্রকল্প</th>
                <th className="px-2 py-2 text-right w-[12%] text-[#0369A1]">ডেবিট</th>
                <th className="px-2 py-2 text-right w-[12%] text-[#0F766E]">ক্রেডিট</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-[#E0F2FE]">
                  <td className="p-1">
                    <Select value={l.account_id} onValueChange={(v) => update(i, { account_id: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="হিসাব..." /></SelectTrigger>
                      <SelectContent>
                        {leaf.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="font-mono text-xs mr-1">{a.code}</span>{a.name_bn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Input value={l.description_bn} onChange={(e) => update(i, { description_bn: e.target.value })} />
                  </td>
                  <td className="p-1">
                    <Select value={l.cost_center_id || "__none"} onValueChange={(v) => update(i, { cost_center_id: v === "__none" ? "" : v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">—</SelectItem>
                        {costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_bn}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Select value={l.project_id || "__none"} onValueChange={(v) => update(i, { project_id: v === "__none" ? "" : v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">—</SelectItem>
                        {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name_bn}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-1">
                    <Input
                      type="number" step="0.01" className="text-right font-mono text-[#0369A1]"
                      value={l.debit}
                      onChange={(e) => update(i, { debit: e.target.value, credit: Number(e.target.value) > 0 ? "" : l.credit })}
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      type="number" step="0.01" className="text-right font-mono text-[#0F766E]"
                      value={l.credit}
                      onChange={(e) => update(i, { credit: e.target.value, debit: Number(e.target.value) > 0 ? "" : l.debit })}
                    />
                  </td>
                  <td className="p-1">
                    <Button size="icon" variant="ghost" disabled={lines.length <= 2}
                      onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-[#B91C1C]" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#BAE6FD] bg-[#F0F9FF] font-semibold text-[#0C4A6E]">
                <td colSpan={4} className="px-2 py-3 text-right">মোট</td>
                <td className="px-2 py-3 text-right font-mono text-[#0369A1]">{formatBDT(totalDr)}</td>
                <td className="px-2 py-3 text-right font-mono text-[#0F766E]">{formatBDT(totalCr)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </WaterCard>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setLines([...lines, emptyLine()])}>
          <Plus className="h-4 w-4" /> লাইন যোগ
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">
            {balanced
              ? <span className="text-[#0F766E]">✅ সমতাযুক্ত</span>
              : <span className="text-[#B45309]">❌ পার্থক্য: {formatBDT(Math.abs(diff))}</span>}
          </div>
          <Button variant="outline" onClick={() => submit(false)}>খসড়া সংরক্ষণ</Button>
          <Button disabled={!balanced} onClick={() => submit(true)}
            className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
            সংরক্ষণ ও পোস্ট
          </Button>
        </div>
      </div>
    </div>
  );
}
