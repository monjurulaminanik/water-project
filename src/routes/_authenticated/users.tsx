import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserCheck, Building2, Wrench, Search, Plus, Eye, Pencil, PowerOff, Power, Droplet, Shield } from "lucide-react";
import { toast } from "sonner";
import { WaterCard } from "@/components/water/WaterCard";
import { WaterStatCard } from "@/components/water/WaterStatCard";
import { UserAvatar } from "@/components/water/UserAvatar";
import { RoleBadge } from "@/components/water/RoleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useUsersList, useRoles, type UserListItem } from "@/lib/rbac";
import { useBranches } from "@/lib/branches";
import { useAuth, RequirePermission } from "@/lib/auth";
import { DropletBadge } from "@/components/water/DropletIcon";
import { UserForm } from "@/components/water/UserForm";
import { toBnDigits } from "@/lib/bn";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { data: users = [], isLoading } = useUsersList();
  const { data: roles = [] } = useRoles();
  const { data: branches = [] } = useBranches();
  const qc = useQueryClient();
  const { hasPermission } = useAuth();

  const [search, setSearch] = useState("");
  const [branchF, setBranchF] = useState("all");
  const [roleF, setRoleF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<UserListItem | null>(null);
  const [toggling, setToggling] = useState<UserListItem | null>(null);

  const roleById = useMemo(() => Object.fromEntries(roles.map((r) => [r.id, r])), [roles]);
  const branchById = useMemo(() => Object.fromEntries(branches.map((b) => [b.id, b])), [branches]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusF === "active" && !u.is_active) return false;
      if (statusF === "inactive" && u.is_active) return false;
      if (branchF !== "all" && !u.assignments.some((a) => a.branch_id === branchF)) return false;
      if (roleF !== "all" && !u.assignments.some((a) => a.role_id === roleF)) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !(u.full_name ?? "").toLowerCase().includes(s) &&
          !(u.employee_code ?? "").toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [users, search, branchF, roleF, statusF]);

  const stats = useMemo(() => {
    const bmRoleId = roles.find((r) => r.code === "BRANCH_MANAGER")?.id;
    const techRoleId = roles.find((r) => r.code === "TECHNICIAN")?.id;
    return {
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      managers: users.filter((u) => u.assignments.some((a) => a.role_id === bmRoleId)).length,
      technicians: users.filter((u) => u.assignments.some((a) => a.role_id === techRoleId)).length,
    };
  }, [users, roles]);

  const doToggle = async (u: UserListItem) => {
    const { error } = await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id);
    if (error) return toast.error("ব্যর্থ: " + error.message);
    toast.success("ব্যবহারকারীর অবস্থা পরিবর্তিত হয়েছে", { icon: "💧" });
    setToggling(null);
    qc.invalidateQueries({ queryKey: ["users-list"] });
  };

  return (
    <div className="relative space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <DropletBadge className="droplet-float" />
          <div>
            <h1 className="text-3xl font-semibold text-[#0C4A6E]">ব্যবহারকারী ব্যবস্থাপনা</h1>
            <p className="text-sm text-[#0369A1]">সকল কর্মী ও ব্যবহারকারীর তালিকা</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-[#BAE6FD] text-[#0369A1]">
            <Link to="/users/roles"><Shield className="h-4 w-4" /> ভূমিকা ও অনুমতি</Link>
          </Button>
          <RequirePermission code="users.create">
            <Button onClick={() => { setEditing(null); setCreating(true); }} className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
              <Plus className="h-4 w-4" /> নতুন ব্যবহারকারী যোগ করুন
            </Button>
          </RequirePermission>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <WaterStatCard label="মোট ব্যবহারকারী" value={toBnDigits(stats.total)} icon={Users} tint="primary" />
        <WaterStatCard label="সক্রিয়" value={toBnDigits(stats.active)} icon={UserCheck} tint="teal" />
        <WaterStatCard label="শাখা ব্যবস্থাপক" value={toBnDigits(stats.managers)} icon={Building2} tint="cyan" />
        <WaterStatCard label="টেকনিশিয়ান" value={toBnDigits(stats.technicians)} icon={Wrench} tint="amber" />
      </div>

      <WaterCard className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0369A1]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম, ইমেইল বা কর্মী কোড দিয়ে খুঁজুন..." className="pl-9" />
          </div>
          <Select value={branchF} onValueChange={setBranchF}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল শাখা</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_bn}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={roleF} onValueChange={setRoleF}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল ভূমিকা</SelectItem>
              {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name_bn}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল</SelectItem>
              <SelectItem value="active">সক্রিয়</SelectItem>
              <SelectItem value="inactive">নিষ্ক্রিয়</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </WaterCard>

      <WaterCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#F0F9FF] text-left text-xs font-medium uppercase tracking-wider text-[#0369A1]">
                <th className="px-4 py-3">ছবি</th>
                <th className="px-4 py-3">কর্মী কোড</th>
                <th className="px-4 py-3">পূর্ণ নাম</th>
                <th className="px-4 py-3">পদবী</th>
                <th className="px-4 py-3">শাখা ও ভূমিকা</th>
                <th className="px-4 py-3">ফোন</th>
                <th className="px-4 py-3">অবস্থা</th>
                <th className="px-4 py-3 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2FE]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <Droplet className="mx-auto h-10 w-10 text-[#7DD3FC]" />
                  <p className="mt-3 text-sm text-[#0369A1]">কোনো ব্যবহারকারী পাওয়া যায়নি।</p>
                </td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F0F9FF]/60">
                    <td className="px-4 py-3"><UserAvatar name={u.full_name} url={u.avatar_url} size="sm" /></td>
                    <td className="px-4 py-3 font-mono text-xs text-[#0EA5E9]">{u.employee_code ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-[#0C4A6E]">{u.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#0369A1]">{u.designation_bn ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.assignments.length === 0 && <span className="text-xs text-rose-500">অসংযুক্ত</span>}
                        {u.assignments.map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[#E0F2FE] px-2 py-0.5 text-xs text-[#0369A1]">
                            {branchById[a.branch_id]?.name_bn ?? "?"}
                            <RoleBadge role={roleById[a.role_id]} />
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#0369A1]">{u.phone ? toBnDigits(u.phone) : "—"}</td>
                    <td className="px-4 py-3">
                      {u.is_active
                        ? <Badge className="bg-[#CCFBF1] text-[#0F766E]">সক্রিয়</Badge>
                        : <Badge className="bg-rose-100 text-rose-700">নিষ্ক্রিয়</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setViewing(u)}><Eye className="h-4 w-4 text-[#0284C7]" /></Button>
                        {hasPermission("users.edit") && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => { setEditing(u); setCreating(true); }}><Pencil className="h-4 w-4 text-[#0284C7]" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => u.is_active ? setToggling(u) : doToggle(u)}>
                              {u.is_active ? <PowerOff className="h-4 w-4 text-rose-500" /> : <Power className="h-4 w-4 text-teal-500" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </WaterCard>

      <Dialog open={creating} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl water-glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0C4A6E]">
              <Droplet className="h-5 w-5 text-[#0EA5E9]" fill="#0EA5E9" />
              {editing ? "ব্যবহারকারী সম্পাদনা" : "নতুন ব্যবহারকারী যোগ করুন"}
            </DialogTitle>
          </DialogHeader>
          <UserForm user={editing} onDone={() => { setCreating(false); setEditing(null); qc.invalidateQueries({ queryKey: ["users-list"] }); }} />
        </DialogContent>
      </Dialog>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="water-glass w-full sm:max-w-md">
          {viewing && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-[#0C4A6E]">
                  <UserAvatar name={viewing.full_name} url={viewing.avatar_url} size="lg" />
                  <div className="flex flex-col">
                    <span>{viewing.full_name}</span>
                    <span className="text-xs font-normal text-[#0369A1]">{viewing.employee_code}</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl border border-[#BAE6FD]/60 bg-white/60 p-3">
                  <h5 className="mb-2 text-xs font-semibold uppercase text-[#0369A1]">ব্যক্তিগত</h5>
                  <Row label="পদবী" value={viewing.designation_bn} />
                  <Row label="ফোন" value={viewing.phone ? toBnDigits(viewing.phone) : null} />
                  <Row label="অবস্থা" value={viewing.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"} />
                </div>
                <div className="rounded-xl border border-[#BAE6FD]/60 bg-white/60 p-3">
                  <h5 className="mb-2 text-xs font-semibold uppercase text-[#0369A1]">শাখা ও ভূমিকা</h5>
                  <div className="space-y-1.5">
                    {viewing.assignments.length === 0 && <p className="text-xs text-rose-500">কোনো শাখা বরাদ্দ নেই</p>}
                    {viewing.assignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-[#F0F9FF] px-2 py-1.5 text-xs">
                        <span className="text-[#0C4A6E]">{branchById[a.branch_id]?.name_bn ?? "?"} {a.is_primary && <Badge className="ml-1 bg-[#0EA5E9] text-white">প্রধান</Badge>}</span>
                        <RoleBadge role={roleById[a.role_id]} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!toggling} onOpenChange={(o) => !o && setToggling(null)}>
        <AlertDialogContent className="water-glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0C4A6E]">ব্যবহারকারী নিষ্ক্রিয় করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত {toggling?.full_name}-কে নিষ্ক্রিয় করতে চান? নিষ্ক্রিয় ব্যবহারকারী লগইন করতে পারবেন না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={() => toggling && doToggle(toggling)}>নিষ্ক্রিয় করুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-[#0369A1]">{label}</span>
      <span className="text-right font-medium text-[#0C4A6E]">{value || "—"}</span>
    </div>
  );
}
