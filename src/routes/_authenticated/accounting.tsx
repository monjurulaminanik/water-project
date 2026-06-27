import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Calculator, BookOpen, FileText, CalendarDays, FolderTree, TrendingUp, Layers } from "lucide-react";
import { DropletBadge } from "@/components/water/DropletIcon";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/accounting")({
  component: AccountingLayout,
});

const tabs = [
  { to: "/accounting", label: "ওভারভিউ", icon: Calculator, exact: true },
  { to: "/accounting/accounts", label: "হিসাব ছক", icon: FolderTree },
  { to: "/accounting/journals", label: "জার্নাল এন্ট্রি", icon: FileText },
  { to: "/accounting/analytic", label: "অ্যানালিটিক", icon: Layers },
  { to: "/accounting/branch-pnl", label: "শাখা P&L", icon: TrendingUp },
  { to: "/accounting/chart", label: "পুরাতন ছক", icon: BookOpen },
  { to: "/accounting/periods", label: "অর্থবছর", icon: CalendarDays },
];

function AccountingLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DropletBadge className="droplet-float" />
        <div>
          <h1 className="text-3xl font-semibold text-[#0C4A6E]">হিসাব নিকাশ</h1>
          <p className="text-sm text-[#0369A1]">ডাবল-এন্ট্রি অ্যাকাউন্টিং, শাখাভিত্তিক লাভ-ক্ষতি</p>
        </div>
      </div>
      <div className="water-card flex flex-wrap gap-1 p-2">
        {tabs.map((t) => {
          const active = t.exact
            ? pathname === t.to
            : pathname.startsWith(t.to) && pathname !== "/accounting";
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white shadow"
                  : "text-[#0369A1] hover:bg-[#E0F2FE]",
              )}
            >
              <t.icon className="h-4 w-4" />{t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
