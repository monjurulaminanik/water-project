import { ChevronDown, Globe2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranches, BRANCH_TYPES, type BranchType } from "@/lib/branches";
import { useCurrentBranch } from "@/lib/branch-context";
import { BRANCH_TYPE_ICON } from "./BranchTypeBadge";

export function BranchSelector() {
  const { data: branches = [], isLoading } = useBranches();
  const { currentBranchId, setCurrentBranchId } = useCurrentBranch();
  const current = branches.find((b) => b.id === currentBranchId);

  const onSelect = (id: string | null, name: string) => {
    setCurrentBranchId(id);
    toast.success(`শাখা পরিবর্তন হয়েছে: ${name}`, { icon: "💧" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="water-glass h-9 gap-2 rounded-full border-[#BAE6FD] px-3 text-[#0369A1] hover:bg-[#E0F2FE]"
        >
          {current ? (
            <>
              {(() => {
                const Icon = BRANCH_TYPE_ICON[current.branch_type];
                return <Icon className="h-4 w-4" />;
              })()}
              <span className="max-w-[140px] truncate text-sm">{current.name_bn}</span>
            </>
          ) : (
            <>
              <Globe2 className="h-4 w-4" />
              <span className="text-sm">{isLoading ? "লোড হচ্ছে..." : "সব শাখা"}</span>
            </>
          )}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 water-glass">
        <DropdownMenuItem onClick={() => onSelect(null, "সব শাখা")}>
          <Globe2 className="mr-2 h-4 w-4 text-[#0EA5E9]" />
          <span>সব শাখা</span>
          {!currentBranchId && <Check className="ml-auto h-4 w-4 text-[#0EA5E9]" />}
        </DropdownMenuItem>
        {BRANCH_TYPES.map((t) => {
          const items = branches.filter((b) => b.branch_type === t.value && b.is_active);
          if (!items.length) return null;
          const Icon = BRANCH_TYPE_ICON[t.value as BranchType];
          return (
            <div key={t.value}>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-[#0369A1]">{t.label}</DropdownMenuLabel>
              {items.map((b) => (
                <DropdownMenuItem key={b.id} onClick={() => onSelect(b.id, b.name_bn)}>
                  <Icon className="mr-2 h-4 w-4 text-[#0284C7]" />
                  <span className="truncate">{b.name_bn}</span>
                  <span className="ml-2 text-xs text-[#0369A1]/70">{b.code}</span>
                  {currentBranchId === b.id && (
                    <Check className="ml-auto h-4 w-4 text-[#0EA5E9]" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
