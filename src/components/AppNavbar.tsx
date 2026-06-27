import { Bell, ChevronDown, LogOut, User as UserIcon, Droplet } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { BranchSelector } from "@/components/water/BranchSelector";
import { UserAvatar } from "@/components/water/UserAvatar";
import { RoleBadge } from "@/components/water/RoleBadge";
import { useBranches } from "@/lib/branches";

export function AppNavbar() {
  const { user, signOut, assignments } = useAuth();
  const { data: branches = [] } = useBranches();
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name ?? "ব্যবহারকারী";
  const branchById = Object.fromEntries(branches.map((b) => [b.id, b]));

  const handleSignOut = async () => {
    await signOut();
    toast.success("সফলভাবে লগআউট হয়েছে");
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#BAE6FD]/60 water-glass px-3 sm:px-4">
      <SidebarTrigger />
      <div className="hidden items-center gap-3 sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0369A1] text-white shadow-md shadow-[#0EA5E9]/30">
          <Droplet className="h-5 w-5" fill="white" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-[#0C4A6E]">এসকে কর্পোরেশন ইআরপি</span>
          <span className="text-[11px] text-[#0369A1]">ওয়াটার পিউরিফায়ার সিস্টেম</span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <BranchSelector />
        <Button variant="ghost" size="icon" aria-label="বিজ্ঞপ্তি" className="text-[#0369A1]">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <UserAvatar name={name} size="sm" />
              <ChevronDown className="h-4 w-4 text-[#0369A1]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 water-glass">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium text-[#0C4A6E]">{name}</span>
                <span className="text-xs text-[#0369A1]">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            {assignments.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="space-y-1 px-2 py-1">
                  {assignments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#0369A1]">{branchById[a.branch_id]?.name_bn ?? "—"}</span>
                      <RoleBadge role={a.roles} />
                    </div>
                  ))}
                </div>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <UserIcon className="mr-2 h-4 w-4" />প্রোফাইল
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />লগআউট
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
