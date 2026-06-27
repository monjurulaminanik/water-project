import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2, Store, Package, Wrench, Search, Plus, Pencil, Eye,
  PowerOff, Power, Droplet,
} from "lucide-react";
import { toast } from "sonner";
import { WaterCard } from "@/components/water/WaterCard";
import { WaterStatCard } from "@/components/water/WaterStatCard";
import { BranchTypeBadge } from "@/components/water/BranchTypeBadge";
import { BranchForm } from "@/components/water/BranchForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { useBranches, useToggleBranch, branchTypeLabel, type Branch } from "@/lib/branches";
import { toBnDigits, formatBnDate } from "@/lib/bn";
import { DropletBadge } from "@/components/water/DropletIcon";

export const Route = createFileRoute("/_authenticated/branches")({
  component: BranchesPage,
});

function BranchesPage() {
  const { data: branches = [], isLoading } = useBranches();
  const toggle = useToggleBranch();

  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState<string>("all");
  const [statusF, setStatusF] = useState<string>("all");
  const [editing, setEditing] = useState<Branch | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Branch | null>(null);
  const [confirmOff, setConfirmOff] = useState<Branch | null>(null);

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      if (typeF !== "all" && b.branch_type !== typeF) return false;
      if (statusF === "active" && !b.is_active) return false;
      if (statusF === "inactive" && b.is_active) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!b.code.toLowerCase().includes(s) && !b.name_bn.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [branches, search, typeF, statusF]);

  const stats = useMemo(() => ({
    total: branches.length,
    showrooms: branches.filter((b) => b.branch_type === "showroom" && b.is_active).length,
    warehouses: branches.filter((b) => b.branch_type === "warehouse").length,
    service: branches.filter((b) => b.branch_type === "service_center").length,
  }), [branches]);

  const doToggle = async (b: Branch) => {
    await toggle.mutateAsync({ id: b.id, is_active: !b.is_active });
    toast.success("শাখার অবস্থা পরিবর্তিত হয়েছে", { icon: "💧" });
    setConfirmOff(null);
  };

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <DropletBadge className="droplet-float" />
          <div>
            <h1 className="text-3xl font-semibold text-[#0C4A6E]">শাখা ব্যবস্থাপনা</h1>
            <p className="text-sm text-[#0369A1]">সকল শাখা, শোরুম ও গুদামের তালিকা</p>
          </div>
        </div>
        <Button
          onClick={() => { setEditing(null); setCreating(true); }}
          className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white hover:opacity-95"
        >
          <Droplet className="h-4 w-4" fill="white" /> নতুন শাখা যোগ করুন
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <WaterStatCard label="মোট শাখা" value={toBnDigits(stats.total)} icon={Building2} tint="primary" />
        <WaterStatCard label="সক্রিয় শোরুম" value={toBnDigits(stats.showrooms)} icon={Store} tint="teal" />
        <WaterStatCard label="গুদাম" value={toBnDigits(stats.warehouses)} icon={Package} tint="amber" />
        <WaterStatCard label="সার্ভিস সেন্টার" value={toBnDigits(stats.service)} icon={Wrench} tint="pink" />
      </div>

      {/* Filters */}
      <WaterCard className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0369A1]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="কোড বা নাম দিয়ে খুঁজুন..."
              className="pl-9"
            />
          </div>
          <Select value={typeF} onValueChange={setTypeF}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল ধরন</SelectItem>
              <SelectItem value="head_office">প্রধান কার্যালয়</SelectItem>
              <SelectItem value="showroom">শোরুম</SelectItem>
              <SelectItem value="warehouse">গুদাম</SelectItem>
              <SelectItem value="service_center">সার্ভিস সেন্টার</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল অবস্থা</SelectItem>
              <SelectItem value="active">সক্রিয়</SelectItem>
              <SelectItem value="inactive">নিষ্ক্রিয়</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </WaterCard>

      {/* Table */}
      <WaterCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#F0F9FF] text-left text-xs font-medium uppercase tracking-wider text-[#0369A1]">
                <th className="px-4 py-3">কোড</th>
                <th className="px-4 py-3">বাংলা নাম</th>
                <th className="px-4 py-3">ধরন</th>
                <th className="px-4 py-3">শহর</th>
                <th className="px-4 py-3">ফোন</th>
                <th className="px-4 py-3">অবস্থা</th>
                <th className="px-4 py-3 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2FE]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-8 w-full water-shimmer" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Droplet className="mx-auto h-10 w-10 text-[#7DD3FC]" />
                    <p className="mt-3 text-sm text-[#0369A1]">
                      কোনো শাখা পাওয়া যায়নি। প্রথম শাখা যোগ করুন।
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F0F9FF]/60">
                    <td className="px-4 py-3 font-mono font-medium text-[#0EA5E9]">{b.code}</td>
                    <td className="px-4 py-3 font-medium text-[#0C4A6E]">{b.name_bn}</td>
                    <td className="px-4 py-3"><BranchTypeBadge type={b.branch_type} /></td>
                    <td className="px-4 py-3 text-[#0369A1]">{b.city ?? "—"}</td>
                    <td className="px-4 py-3 text-[#0369A1]">{b.phone ? toBnDigits(b.phone) : "—"}</td>
                    <td className="px-4 py-3">
                      {b.is_active ? (
                        <Badge className="bg-[#CCFBF1] text-[#0F766E] hover:bg-[#CCFBF1]">সক্রিয়</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-rose-100 text-rose-700">নিষ্ক্রিয়</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setViewing(b)}>
                          <Eye className="h-4 w-4 text-[#0284C7]" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(b); setCreating(true); }}>
                          <Pencil className="h-4 w-4 text-[#0284C7]" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => b.is_active ? setConfirmOff(b) : doToggle(b)}
                        >
                          {b.is_active
                            ? <PowerOff className="h-4 w-4 text-rose-500" />
                            : <Power className="h-4 w-4 text-teal-500" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </WaterCard>

      {/* Add/Edit dialog */}
      <Dialog open={creating} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl water-glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0C4A6E]">
              <Droplet className="h-5 w-5 text-[#0EA5E9]" fill="#0EA5E9" />
              {editing ? "শাখা সম্পাদনা করুন" : "নতুন শাখা যোগ করুন"}
            </DialogTitle>
          </DialogHeader>
          <BranchForm branch={editing} onDone={() => { setCreating(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>

      {/* View drawer */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="water-glass w-full sm:max-w-md">
          {viewing && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-[#0C4A6E]">
                  <DropletBadge />
                  <div className="flex flex-col">
                    <span>{viewing.name_bn}</span>
                    <span className="text-xs font-normal text-[#0369A1]">{viewing.code}</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div><BranchTypeBadge type={viewing.branch_type} /></div>
                <Section title="মূল তথ্য">
                  <Row label="ইংরেজি নাম" value={viewing.name_en} />
                  <Row label="ধরন" value={branchTypeLabel(viewing.branch_type)} />
                  <Row label="অবস্থা" value={viewing.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"} />
                </Section>
                <Section title="যোগাযোগ">
                  <Row label="ঠিকানা" value={viewing.address} />
                  <Row label="শহর" value={viewing.city} />
                  <Row label="বিভাগ" value={viewing.division} />
                  <Row label="ফোন" value={viewing.phone ? toBnDigits(viewing.phone) : null} />
                  <Row label="ইমেইল" value={viewing.email} />
                </Section>
                <Section title="সময়রেখা">
                  <Row label="তৈরি" value={formatBnDate(new Date(viewing.created_at))} />
                  <Row label="হালনাগাদ" value={formatBnDate(new Date(viewing.updated_at))} />
                  <Row label="চালু তারিখ" value={viewing.opening_date ? formatBnDate(new Date(viewing.opening_date)) : null} />
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Toggle confirm */}
      <AlertDialog open={!!confirmOff} onOpenChange={(o) => !o && setConfirmOff(null)}>
        <AlertDialogContent className="water-glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#0C4A6E]">
              <Droplet className="h-5 w-5 text-rose-500" fill="#fb7185" />
              শাখা নিষ্ক্রিয় করবেন?
            </AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত এই শাখা নিষ্ক্রিয় করতে চান? পরে আবার সক্রিয় করতে পারবেন।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmOff && doToggle(confirmOff)}>
              নিষ্ক্রিয় করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#BAE6FD]/60 bg-white/60 p-3">
      <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#0369A1]">{title}</h5>
      <div className="space-y-1.5">{children}</div>
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
