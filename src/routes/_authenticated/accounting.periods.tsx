import { createFileRoute } from "@tanstack/react-router";
import { WaterCard } from "@/components/water/WaterCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFiscalYears } from "@/lib/accounting";
import { toBnDigits } from "@/lib/bn";

export const Route = createFileRoute("/_authenticated/accounting/periods")({
  component: PeriodsPage,
});

const STATUS_BN: Record<string, string> = {
  draft: "খসড়া", open: "চলমান", closed: "বন্ধ", locked: "লকড",
};

function PeriodsPage() {
  const { data: years = [], isLoading } = useFiscalYears();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#0C4A6E]">অর্থবছর ও সময়কাল</h2>
      <WaterCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#F0F9FF] text-left text-xs font-medium uppercase text-[#0369A1]">
                <th className="px-4 py-3">নাম</th>
                <th className="px-4 py-3">শুরু</th>
                <th className="px-4 py-3">শেষ</th>
                <th className="px-4 py-3">অবস্থা</th>
                <th className="px-4 py-3">বর্তমান</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2FE]">
              {isLoading && (
                <tr><td colSpan={5} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
              )}
              {!isLoading && years.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-[#0369A1]">কোনো অর্থবছর নেই</td></tr>
              )}
              {years.map((y) => (
                <tr key={y.id} className="hover:bg-[#F0F9FF]/60">
                  <td className="px-4 py-2 font-semibold text-[#0C4A6E]">{y.name_bn}</td>
                  <td className="px-4 py-2 text-[#0369A1]">{toBnDigits(y.start_date)}</td>
                  <td className="px-4 py-2 text-[#0369A1]">{toBnDigits(y.end_date)}</td>
                  <td className="px-4 py-2">
                    <Badge className={y.status === "open" ? "bg-[#CCFBF1] text-[#0F766E]" : ""}>
                      {STATUS_BN[y.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    {y.is_current && <Badge className="bg-[#E0F2FE] text-[#0369A1]">✓</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WaterCard>
    </div>
  );
}
