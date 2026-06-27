import type { LucideIcon } from "lucide-react";
import { WaterCard } from "./WaterCard";
import { cn } from "@/lib/utils";

const tints: Record<string, string> = {
  primary: "bg-[#E0F2FE] text-[#0369A1]",
  teal: "bg-[#CCFBF1] text-[#0F766E]",
  amber: "bg-[#FEF3C7] text-[#B45309]",
  pink: "bg-[#FCE7F3] text-[#BE185D]",
  cyan: "bg-[#CFFAFE] text-[#0E7490]",
};

export function WaterStatCard({
  label,
  value,
  icon: Icon,
  tint = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tint?: keyof typeof tints;
}) {
  return (
    <WaterCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[#0369A1]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-[#0C4A6E]">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tints[tint])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-[#0EA5E9]/10 blur-2xl" />
    </WaterCard>
  );
}
