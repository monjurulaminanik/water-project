import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileDown, FileSpreadsheet, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { WaterCard } from "@/components/water/WaterCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/lib/branches";
import { useCurrentBranch } from "@/lib/branch-context";
import { useBranchPnL, type PnLRow } from "@/lib/pnl";
import { formatBDT } from "@/lib/bn";

export const Route = createFileRoute("/_authenticated/accounting/branch-pnl")({
  component: BranchPnLPage,
});

function firstOfMonth() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
}
function today() { return new Date().toISOString().slice(0, 10); }

function BranchPnLPage() {
  const { data: branches = [] } = useBranches();
  const { currentBranchId } = useCurrentBranch();
  const [branchId, setBranchId] = useState<string>(currentBranchId ?? "");
  const [start, setStart] = useState(firstOfMonth());
  const [end, setEnd] = useState(today());

  const { data: rows = [], isLoading, refetch } = useBranchPnL({
    branchId: branchId || null, startDate: start, endDate: end,
  });

  const summary = useMemo(() => {
    let income = 0, expense = 0, cor = 0;
    const income_rows: PnLRow[] = [];
    const cor_rows: PnLRow[] = [];
    const expense_rows: PnLRow[] = [];
    rows.forEach((r) => {
      if (r.category === "income") { income += Number(r.amount); income_rows.push(r); }
      else if (r.category === "cost_of_revenue") { cor += Number(r.amount); cor_rows.push(r); }
      else if (r.category === "expense") { expense += Number(r.amount); expense_rows.push(r); }
    });
    const grossProfit = income - cor;
    const netProfit = grossProfit - expense;
    return { income, expense, cor, grossProfit, netProfit, income_rows, cor_rows, expense_rows };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#0C4A6E]">শাখাভিত্তিক লাভ-ক্ষতি প্রতিবেদন</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("PDF এক্সপোর্ট শীঘ্রই")}>
            <FileDown className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Excel এক্সপোর্ট শীঘ্রই")}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      <WaterCard className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>শাখা *</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_bn}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>শুরু তারিখ</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>শেষ তারিখ</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={() => refetch()} className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
              প্রতিবেদন তৈরি করুন
            </Button>
          </div>
        </div>
      </WaterCard>

      {!branchId ? (
        <WaterCard className="p-8 text-center text-sm text-[#0369A1]">
          প্রতিবেদন দেখতে শাখা নির্বাচন করুন
        </WaterCard>
      ) : isLoading ? (
        <WaterCard className="p-8 text-center text-sm text-[#0369A1]">লোড হচ্ছে...</WaterCard>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KPI label="মোট আয়" value={summary.income} tint="teal" icon={TrendingUp} />
            <KPI label="বিক্রয় ব্যয়" value={summary.cor} tint="amber" icon={TrendingDown} />
            <KPI label="পরিচালন ব্যয়" value={summary.expense} tint="amber" icon={TrendingDown} />
            <KPI
              label={summary.netProfit >= 0 ? "নিট লাভ" : "নিট ক্ষতি"}
              value={summary.netProfit}
              tint={summary.netProfit >= 0 ? "teal" : "red"}
              icon={summary.netProfit >= 0 ? TrendingUp : TrendingDown}
            />
          </div>

          <WaterCard className="p-5">
            <h3 className="mb-3 text-lg font-semibold text-[#0F766E]">আয়</h3>
            <Section rows={summary.income_rows} total={summary.income} />
          </WaterCard>

          {summary.cor_rows.length > 0 && (
            <WaterCard className="p-5">
              <h3 className="mb-3 text-lg font-semibold text-[#B45309]">বিক্রয় ব্যয়</h3>
              <Section rows={summary.cor_rows} total={summary.cor} />
              <div className="mt-4 flex items-center justify-between rounded-lg bg-[#F0F9FF] px-3 py-2 font-semibold text-[#0C4A6E]">
                <span>গ্রস লাভ</span>
                <span className="font-mono">{formatBDT(summary.grossProfit)}</span>
              </div>
            </WaterCard>
          )}

          <WaterCard className="p-5">
            <h3 className="mb-3 text-lg font-semibold text-[#B45309]">পরিচালন ব্যয়</h3>
            <Section rows={summary.expense_rows} total={summary.expense} />
          </WaterCard>

          <WaterCard className={`p-5 ${summary.netProfit >= 0 ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]"}`}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                {summary.netProfit >= 0 ? "নিট লাভ" : "নিট ক্ষতি"}
              </span>
              <span className={`text-2xl font-bold font-mono ${summary.netProfit >= 0 ? "text-[#0F766E]" : "text-[#B91C1C]"}`}>
                {formatBDT(summary.netProfit)}
              </span>
            </div>
          </WaterCard>
        </>
      )}
    </div>
  );
}

function Section({ rows, total }: { rows: PnLRow[]; total: number }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#0369A1]">কোন ডেটা নেই</p>;
  }
  return (
    <table className="min-w-full text-sm">
      <tbody className="divide-y divide-[#E0F2FE]">
        {rows.map((r) => (
          <tr key={r.account_id}>
            <td className="py-2 font-mono text-xs text-[#0C4A6E]">{r.account_code}</td>
            <td className="py-2 text-[#0369A1]">{r.account_name_bn}</td>
            <td className="py-2 text-right font-mono text-[#0C4A6E]">{formatBDT(Math.abs(Number(r.amount)))}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-[#BAE6FD] font-semibold">
          <td colSpan={2} className="py-2 text-right text-[#0C4A6E]">মোট</td>
          <td className="py-2 text-right font-mono text-[#0C4A6E]">{formatBDT(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function KPI({ label, value, tint, icon: Icon }: {
  label: string; value: number; tint: "teal" | "amber" | "red";
  icon: typeof TrendingUp;
}) {
  const colors = {
    teal: "bg-[#CCFBF1] text-[#0F766E]",
    amber: "bg-[#FEF3C7] text-[#B45309]",
    red: "bg-[#FEE2E2] text-[#B91C1C]",
  };
  return (
    <WaterCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#0369A1]">{label}</p>
          <p className="mt-1 text-xl font-bold font-mono text-[#0C4A6E]">{formatBDT(value)}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[tint]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </WaterCard>
  );
}
