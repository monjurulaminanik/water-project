import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useBranches } from "@/lib/branches";
import { useRoles, useUserBranches, useSaveUserBranches, type UserListItem, type UserBranchAssignment } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type Form = {
  full_name: string;
  email: string;
  phone: string;
  employee_code: string;
  designation_bn: string;
  date_of_birth: string;
  national_id: string;
  joining_date: string;
  address: string;
  emergency_contact: string;
  password: string;
  confirm: string;
};

export function UserForm({ user, onDone }: { user: UserListItem | null; onDone: () => void }) {
  const isEdit = !!user;
  const [step, setStep] = useState(1);
  const [assignments, setAssignments] = useState<UserBranchAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: branches = [] } = useBranches();
  const { data: roles = [] } = useRoles();
  const { data: existing } = useUserBranches(user?.id ?? null);
  const saveAssignments = useSaveUserBranches();

  const { register, handleSubmit, control, formState: { errors } } = useForm<Form>({
    defaultValues: {
      full_name: user?.full_name ?? "",
      phone: user?.phone ?? "",
      employee_code: user?.employee_code ?? "",
      designation_bn: user?.designation_bn ?? "",
      email: "",
      date_of_birth: "",
      national_id: "",
      joining_date: "",
      address: "",
      emergency_contact: "",
      password: "",
      confirm: "",
    },
  });

  useEffect(() => {
    if (existing && existing.length) {
      setAssignments(existing.map((e) => ({ branch_id: e.branch_id, role_id: e.role_id, is_primary: e.is_primary })));
    } else if (!isEdit && assignments.length === 0) {
      setAssignments([{ branch_id: "", role_id: "", is_primary: true }]);
    }
  }, [existing, isEdit]);

  const addRow = () => setAssignments((a) => [...a, { branch_id: "", role_id: "", is_primary: false }]);
  const removeRow = (i: number) => setAssignments((a) => a.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<UserBranchAssignment>) => {
    setAssignments((a) => a.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  };
  const setPrimary = (i: number) => {
    setAssignments((a) => a.map((row, idx) => ({ ...row, is_primary: idx === i })));
  };

  const onSubmit = async (v: Form) => {
    if (assignments.length === 0 || !assignments.some((a) => a.is_primary)) {
      toast.error("কমপক্ষে একটি শাখা ও একটি প্রধান শাখা নির্বাচন করুন");
      setStep(2);
      return;
    }
    if (assignments.some((a) => !a.branch_id || !a.role_id)) {
      toast.error("প্রতিটি সারিতে শাখা ও ভূমিকা নির্বাচন করুন");
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      let userId = user?.id;
      if (!isEdit) {
        if (v.password.length < 8 || v.password !== v.confirm) {
          toast.error("পাসওয়ার্ড ৮ অক্ষরের হতে হবে এবং মিলতে হবে");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: v.email,
          password: v.password,
          options: { data: { full_name: v.full_name, phone: v.phone } },
        });
        if (error) throw error;
        userId = data.user?.id;
        if (!userId) throw new Error("ব্যবহারকারী তৈরি ব্যর্থ");
      }

      const { error: pErr } = await supabase.from("profiles").update({
        full_name: v.full_name,
        phone: v.phone,
        employee_code: v.employee_code || null,
        designation_bn: v.designation_bn || null,
        national_id: v.national_id || null,
        date_of_birth: v.date_of_birth || null,
        joining_date: v.joining_date || null,
        address: v.address || null,
        emergency_contact: v.emergency_contact || null,
        updated_at: new Date().toISOString(),
      }).eq("id", userId!);
      if (pErr) throw pErr;

      await saveAssignments.mutateAsync({ userId: userId!, assignments });
      toast.success(isEdit ? "ব্যবহারকারী আপডেট হয়েছে" : "ব্যবহারকারী সফলভাবে তৈরি হয়েছে");
      onDone();
    } catch (e: unknown) {
      toast.error("ব্যর্থ: " + (e instanceof Error ? e.message : "অজানা ত্রুটি"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-3 py-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
              step >= s ? "bg-gradient-to-br from-[#0EA5E9] to-[#0369A1] text-white" : "bg-[#E0F2FE] text-[#0369A1]",
            )}>
              <Droplet className="h-4 w-4" fill={step >= s ? "white" : "none"} />
            </div>
            {s < 3 && <div className={cn("h-0.5 w-10", step > s ? "bg-[#0EA5E9]" : "bg-[#E0F2FE]")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="পূর্ণ নাম *"><Input {...register("full_name", { required: true })} />{errors.full_name && <Err>প্রয়োজন</Err>}</Field>
          <Field label="কর্মী কোড *"><Input {...register("employee_code", { required: true })} placeholder="EMP-001" />{errors.employee_code && <Err>প্রয়োজন</Err>}</Field>
          {!isEdit && <Field label="ইমেইল *"><Input type="email" {...register("email", { required: true })} />{errors.email && <Err>প্রয়োজন</Err>}</Field>}
          <Field label="মোবাইল *"><Input {...register("phone", { required: true })} />{errors.phone && <Err>প্রয়োজন</Err>}</Field>
          <Field label="পদবী"><Input {...register("designation_bn")} /></Field>
          <Field label="জন্ম তারিখ"><Input type="date" {...register("date_of_birth")} /></Field>
          <Field label="জাতীয় পরিচয়পত্র"><Input {...register("national_id")} /></Field>
          <Field label="যোগদানের তারিখ"><Input type="date" {...register("joining_date")} /></Field>
          <Field label="জরুরি যোগাযোগ"><Input {...register("emergency_contact")} /></Field>
          <Field label="ঠিকানা" full><Textarea rows={2} {...register("address")} /></Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-[#0369A1]">এই ব্যবহারকারীকে কোন কোন শাখায় কোন ভূমিকায় কাজ করবেন?</p>
          {assignments.map((row, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-[#BAE6FD]/60 bg-white/60 p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <Select value={row.branch_id} onValueChange={(v) => updateRow(i, { branch_id: v })}>
                <SelectTrigger><SelectValue placeholder="শাখা বাছাই করুন" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_bn}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={row.role_id} onValueChange={(v) => updateRow(i, { role_id: v })}>
                <SelectTrigger><SelectValue placeholder="ভূমিকা" /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name_bn}</SelectItem>)}</SelectContent>
              </Select>
              <label className="flex items-center gap-1 text-xs text-[#0369A1]">
                <input type="radio" checked={row.is_primary} onChange={() => setPrimary(i)} />প্রধান
              </label>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeRow(i)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addRow} className="border-[#BAE6FD] text-[#0369A1]">
            <Plus className="h-4 w-4" /> আরেকটি শাখা যোগ করুন
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          {isEdit ? (
            <p className="rounded-xl bg-[#F0F9FF] p-3 text-sm text-[#0369A1]">
              পাসওয়ার্ড পরিবর্তন করতে ব্যবহারকারীর প্রোফাইল থেকে আলাদাভাবে পরিবর্তন করুন।
            </p>
          ) : (
            <>
              <Field label="পাসওয়ার্ড *"><Input type="password" {...register("password")} /></Field>
              <Field label="পাসওয়ার্ড নিশ্চিত করুন *"><Input type="password" {...register("confirm")} /></Field>
              <p className="text-xs text-[#0369A1]">কমপক্ষে ৮ অক্ষর</p>
            </>
          )}
        </div>
      )}

      <div className="flex justify-between gap-2 border-t border-[#BAE6FD]/60 pt-3">
        <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>পূর্ববর্তী</Button>
        {step < 3 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)} className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">পরবর্তী</Button>
        ) : (
          <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white">
            {loading ? "সংরক্ষণ হচ্ছে..." : isEdit ? "আপডেট করুন" : "অ্যাকাউন্ট তৈরি করুন"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label className="text-xs text-[#0369A1]">{label}</Label>
      {children}
    </div>
  );
}
function Err({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-rose-500">{children}</p>;
}
