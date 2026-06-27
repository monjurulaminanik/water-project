import { Building2, Store, Package, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { branchTypeLabel, type BranchType } from "@/lib/branches";

const styles: Record<BranchType, { cls: string; Icon: typeof Building2 }> = {
  head_office: {
    cls: "bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white",
    Icon: Building2,
  },
  showroom: {
    cls: "bg-[#CCFBF1] text-[#0F766E] border border-[#5EEAD4]",
    Icon: Store,
  },
  warehouse: {
    cls: "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]",
    Icon: Package,
  },
  service_center: {
    cls: "bg-[#FCE7F3] text-[#BE185D] border border-[#F9A8D4]",
    Icon: Wrench,
  },
};

export function BranchTypeBadge({ type }: { type: BranchType }) {
  const s = styles[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.cls,
      )}
    >
      <s.Icon className="h-3 w-3" />
      {branchTypeLabel(type)}
    </span>
  );
}

export const BRANCH_TYPE_ICON: Record<BranchType, typeof Building2> = {
  head_office: Building2,
  showroom: Store,
  warehouse: Package,
  service_center: Wrench,
};
