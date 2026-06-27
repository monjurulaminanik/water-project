import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatBnDate } from "@/lib/bn";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type Profile = {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>প্রোফাইল তথ্য</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {loading ? (
            <>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
            </>
          ) : (
            <>
              <Row label="পূর্ণ নাম" value={profile?.full_name ?? "—"} />
              <Row label="ইমেইল" value={user?.email ?? "—"} />
              <Row label="মোবাইল" value={profile?.phone ?? "—"} />
              <Row
                label="যোগদানের তারিখ"
                value={profile?.created_at ? formatBnDate(new Date(profile.created_at)) : "—"}
              />
            </>
          )}
          <div className="flex flex-wrap gap-2 pt-3">
            <EditDialog profile={profile} onSaved={load} />
            <PasswordDialog />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

const editSchema = z.object({
  full_name: z.string().min(2, "পূর্ণ নাম প্রয়োজন"),
  phone: z.string().min(10, "সঠিক মোবাইল নম্বর দিন"),
  avatar_url: z.string().url("সঠিক URL দিন").or(z.literal("")).optional(),
});

function EditDialog({ profile, onSaved }: { profile: Profile | null; onSaved: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      avatar_url: profile?.avatar_url ?? "",
    },
  });

  useEffect(() => {
    reset({
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      avatar_url: profile?.avatar_url ?? "",
    });
  }, [profile, reset]);

  const onSubmit = async (v: z.infer<typeof editSchema>) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: v.full_name,
        phone: v.phone,
        avatar_url: v.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      toast.error("আপডেট ব্যর্থ: " + error.message);
      return;
    }
    toast.success("প্রোফাইল আপডেট হয়েছে");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>প্রোফাইল সম্পাদনা</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>প্রোফাইল সম্পাদনা</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>পূর্ণ নাম</Label>
            <Input {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>মোবাইল</Label>
            <Input {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>অ্যাভাটার URL (ঐচ্ছিক)</Label>
            <Input {...register("avatar_url")} />
            {errors.avatar_url && <p className="text-xs text-destructive">{errors.avatar_url.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const pwSchema = z.object({
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "পাসওয়ার্ড মিলছে না", path: ["confirm"] });

function PasswordDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof pwSchema>>({
    resolver: zodResolver(pwSchema),
  });

  const onSubmit = async (v: z.infer<typeof pwSchema>) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: v.password });
    setLoading(false);
    if (error) {
      toast.error("ব্যর্থ: " + error.message);
      return;
    }
    toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">পাসওয়ার্ড পরিবর্তন করুন</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>পাসওয়ার্ড পরিবর্তন</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>নতুন পাসওয়ার্ড</Label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>পাসওয়ার্ড নিশ্চিত করুন</Label>
            <Input type="password" {...register("confirm")} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন করুন"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
