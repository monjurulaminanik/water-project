import { useState, useEffect, type FormEvent } from "react";
import { Droplet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BRANCH_TYPES, DIVISIONS, useBranches, useSaveBranch, type Branch, type BranchType,
} from "@/lib/branches";
import { useAuth } from "@/lib/auth";

type Props = {
  branch?: Branch | null;
  onDone: () => void;
};

export function BranchForm({ branch, onDone }: Props) {
  const { user } = useAuth();
  const { data: branches = [] } = useBranches();
  const save = useSaveBranch();

  const [form, setForm] = useState({
    code: "",
    name_bn: "",
    name_en: "",
    branch_type: "showroom" as BranchType,
    address: "",
    city: "",
    division: "",
    phone: "",
    email: "",
    opening_date: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (branch) {
      setForm({
        code: branch.code,
        name_bn: branch.name_bn,
        name_en: branch.name_en ?? "",
        branch_type: branch.branch_type,
        address: branch.address ?? "",
        city: branch.city ?? "",
        division: branch.division ?? "",
        phone: branch.phone ?? "",
        email: branch.email ?? "",
        opening_date: branch.opening_date ?? "",
        is_active: branch.is_active,
      });
    }
  }, [branch]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "কোড প্রয়োজন";
    else if (
      branches.some(
        (b) => b.code.toLowerCase() === form.code.trim().toLowerCase() && b.id !== branch?.id,
      )
    )
      e.code = "এই কোড আগে থেকেই আছে";
    if (!form.name_bn.trim()) e.name_bn = "বাংলা নাম প্রয়োজন";
    if (!form.branch_type) e.branch_type = "ধরন নির্বাচন করুন";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await save.mutateAsync({
        id: branch?.id,
        code: form.code.trim(),
        name_bn: form.name_bn.trim(),
        name_en: form.name_en.trim() || null,
        branch_type: form.branch_type,
        address: form.address || null,
        city: form.city || null,
        division: form.division || null,
        phone: form.phone || null,
        email: form.email || null,
        opening_date: form.opening_date || null,
        is_active: form.is_active,
        ...(branch ? {} : { created_by: user?.id ?? null }),
      });
      toast.success("শাখা সফলভাবে সংরক্ষিত হয়েছে", { icon: "💧" });
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? "সংরক্ষণ ব্যর্থ হয়েছে");
    }
  };

  const f = (k: keyof typeof form, v: any) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-[#0369A1]">মূল তথ্য</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>কোড *</Label>
            <Input value={form.code} onChange={(e) => f("code", e.target.value)} placeholder="HO / BR01" />
            {errors.code && <p className="mt-1 text-xs text-rose-600">{errors.code}</p>}
          </div>
          <div>
            <Label>ধরন *</Label>
            <Select value={form.branch_type} onValueChange={(v) => f("branch_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BRANCH_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branch_type && <p className="mt-1 text-xs text-rose-600">{errors.branch_type}</p>}
          </div>
          <div>
            <Label>বাংলা নাম *</Label>
            <Input value={form.name_bn} onChange={(e) => f("name_bn", e.target.value)} />
            {errors.name_bn && <p className="mt-1 text-xs text-rose-600">{errors.name_bn}</p>}
          </div>
          <div>
            <Label>ইংরেজি নাম</Label>
            <Input value={form.name_en} onChange={(e) => f("name_en", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-[#0369A1]">যোগাযোগ</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>ঠিকানা</Label>
            <Textarea rows={2} value={form.address} onChange={(e) => f("address", e.target.value)} />
          </div>
          <div>
            <Label>শহর</Label>
            <Input value={form.city} onChange={(e) => f("city", e.target.value)} />
          </div>
          <div>
            <Label>বিভাগ</Label>
            <Select value={form.division} onValueChange={(v) => f("division", v)}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ফোন</Label>
            <Input value={form.phone} onChange={(e) => f("phone", e.target.value)} />
          </div>
          <div>
            <Label>ইমেইল</Label>
            <Input type="email" value={form.email} onChange={(e) => f("email", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-[#0369A1]">ব্যবস্থাপনা</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>চালু তারিখ</Label>
            <Input type="date" value={form.opening_date} onChange={(e) => f("opening_date", e.target.value)} />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => f("is_active", v)} />
              <Label className="m-0">সক্রিয়</Label>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>বাতিল</Button>
        <Button
          type="submit"
          disabled={save.isPending}
          className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white hover:opacity-95"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplet className="h-4 w-4" fill="white" />}
          সংরক্ষণ করুন
        </Button>
      </div>
    </form>
  );
}
