import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { WaterCard } from "@/components/water/WaterCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAccounts, useJournals, useJournalEntries,
  useCreateJournalEntry, usePostEntry, useCancelEntry,
} from "@/lib/accounting";
import { useBranches } from "@/lib/branches";
import { useCurrentBranch } from "@/lib/branch-context";
import { toBnDigits, formatBnCurrency } from "@/lib/bn";

export const Route = createFileRoute("/_authenticated/accounting/journals")({
  component: JournalEntriesPage,
});

const STATUS_BN: Record<string, string> = {
  draft: "খসড়া", posted: "পোস্টকৃত", cancelled: "বাতিল",
};

function JournalEntriesPage() {
  const [statusF, setStatusF] = useState("all");
  const { currentBranchId } = useCurrentBranch();
  const { data: entries = [], isLoading } = useJournalEntries({
    branchId: currentBranchId, status: statusF,
  });
  const post = usePostEntry();
  const cancel = useCancelEntry();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#0C4A6E]">জার্নাল এন্ট্রি</h2>
        <Button asChild className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
          <Link to="/accounting/entries/new"><Plus className="h-4 w-4" /> নতুন এন্ট্রি</Link>
        </Button>

      </div>

      <WaterCard className="p-4">
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল অবস্থা</SelectItem>
            <SelectItem value="draft">খসড়া</SelectItem>
            <SelectItem value="posted">পোস্টকৃত</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
      </WaterCard>

      <WaterCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#F0F9FF] text-left text-xs font-medium uppercase text-[#0369A1]">
                <th className="px-4 py-3">নম্বর</th>
                <th className="px-4 py-3">তারিখ</th>
                <th className="px-4 py-3">জার্নাল</th>
                <th className="px-4 py-3">শাখা</th>
                <th className="px-4 py-3">বিবরণ</th>
                <th className="px-4 py-3 text-right">ডেবিট</th>
                <th className="px-4 py-3 text-right">ক্রেডিট</th>
                <th className="px-4 py-3">অবস্থা</th>
                <th className="px-4 py-3 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2FE]">
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={9} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
              ))}
              {!isLoading && entries.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-[#0369A1]">কোনো এন্ট্রি নেই</td></tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-[#F0F9FF]/60">
                  <td className="px-4 py-2 font-mono text-[#0C4A6E]">{e.entry_number}</td>
                  <td className="px-4 py-2 text-[#0369A1]">{toBnDigits(e.entry_date)}</td>
                  <td className="px-4 py-2 text-[#0369A1]">{e.journals?.name_bn ?? "—"}</td>
                  <td className="px-4 py-2 text-[#0369A1]">{e.branches?.name_bn ?? "—"}</td>
                  <td className="px-4 py-2 text-[#0C4A6E]">{e.narration_bn ?? "—"}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatBnCurrency(Number(e.total_debit))}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatBnCurrency(Number(e.total_credit))}</td>
                  <td className="px-4 py-2">
                    <Badge className={
                      e.status === "posted" ? "bg-[#CCFBF1] text-[#0F766E]"
                      : e.status === "draft" ? "bg-[#FEF3C7] text-[#B45309]"
                      : "bg-[#FEE2E2] text-[#B91C1C]"
                    }>{STATUS_BN[e.status]}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {e.status === "draft" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try { await post.mutateAsync(e.id); toast.success("পোস্ট হয়েছে"); }
                          catch (err) { toast.error((err as Error).message); }
                        }}>
                          <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try { await cancel.mutateAsync({ id: e.id, reason: "ব্যবহারকারী বাতিল করেছেন" }); toast.success("বাতিল হয়েছে"); }
                          catch (err) { toast.error((err as Error).message); }
                        }}>
                          <XCircle className="h-4 w-4 text-[#B91C1C]" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WaterCard>

      <NewEntryDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

type LineDraft = {
  account_id: string;
  debit: string;
  credit: string;
  description_bn: string;
};

function emptyLine(): LineDraft { return { account_id: "", debit: "", credit: "", description_bn: "" }; }

function NewEntryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { data: accounts = [] } = useAccounts();
  const { data: journals = [] } = useJournals();
  const { data: branches = [] } = useBranches();
  const { currentBranchId } = useCurrentBranch();
  const create = useCreateJournalEntry();

  const [journalId, setJournalId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState(currentBranchId ?? "");
  const [narration, setNarration] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(), emptyLine()]);

  const leafAccounts = accounts.filter((a) => !a.is_group && a.is_active);
  const totalDr = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCr = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalDr - totalCr) < 0.001 && totalDr > 0;

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
      setLines([emptyLine(), emptyLine()]);
      setNarration(""); setReference("");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl water-glass">
        <DialogHeader><DialogTitle>নতুন জার্নাল এন্ট্রি</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
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
            <div className="col-span-2">
              <Label>বিবরণ</Label>
              <Textarea value={narration} onChange={(e) => setNarration(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>রেফারেন্স</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border border-[#BAE6FD] overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F0F9FF] text-xs text-[#0369A1]">
                <tr>
                  <th className="px-2 py-2 text-left">হিসাব</th>
                  <th className="px-2 py-2 text-left">বর্ণনা</th>
                  <th className="px-2 py-2 text-right">ডেবিট</th>
                  <th className="px-2 py-2 text-right">ক্রেডিট</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-t border-[#E0F2FE]">
                    <td className="p-1">
                      <Select value={l.account_id} onValueChange={(v) => {
                        const next = [...lines]; next[i].account_id = v; setLines(next);
                      }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="হিসাব..." /></SelectTrigger>
                        <SelectContent>
                          {leafAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.code} — {a.name_bn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1">
                      <Input value={l.description_bn} onChange={(e) => {
                        const next = [...lines]; next[i].description_bn = e.target.value; setLines(next);
                      }} />
                    </td>
                    <td className="p-1">
                      <Input type="number" step="0.01" className="text-right" value={l.debit} onChange={(e) => {
                        const next = [...lines]; next[i].debit = e.target.value;
                        if (Number(e.target.value) > 0) next[i].credit = "";
                        setLines(next);
                      }} />
                    </td>
                    <td className="p-1">
                      <Input type="number" step="0.01" className="text-right" value={l.credit} onChange={(e) => {
                        const next = [...lines]; next[i].credit = e.target.value;
                        if (Number(e.target.value) > 0) next[i].debit = "";
                        setLines(next);
                      }} />
                    </td>
                    <td className="p-1">
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (lines.length <= 2) return;
                        setLines(lines.filter((_, idx) => idx !== i));
                      }}>
                        <Trash2 className="h-4 w-4 text-[#B91C1C]" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#BAE6FD] bg-[#F0F9FF] font-semibold text-[#0C4A6E]">
                  <td colSpan={2} className="px-2 py-2 text-right">মোট</td>
                  <td className="px-2 py-2 text-right font-mono">{formatBnCurrency(totalDr)}</td>
                  <td className="px-2 py-2 text-right font-mono">{formatBnCurrency(totalCr)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setLines([...lines, emptyLine()])}>
              <Plus className="h-4 w-4" /> লাইন যোগ
            </Button>
            <div className="text-sm">
              {balanced
                ? <span className="text-[#0F766E]">✓ সমতাযুক্ত</span>
                : <span className="text-[#B45309]">পার্থক্য: {formatBnCurrency(Math.abs(totalDr - totalCr))}</span>}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
            <Button variant="outline" onClick={() => submit(false)}>খসড়া সংরক্ষণ</Button>
            <Button disabled={!balanced} onClick={() => submit(true)}
              className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
              সংরক্ষণ ও পোস্ট
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
