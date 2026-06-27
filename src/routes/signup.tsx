import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const schema = z.object({
  full_name: z.string().min(2, "পূর্ণ নাম প্রয়োজন"),
  email: z.string().email("সঠিক ইমেইল দিন"),
  phone: z.string().min(10, "সঠিক মোবাইল নম্বর দিন"),
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "পাসওয়ার্ড মিলছে না", path: ["confirm"],
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        data: { full_name: v.full_name, phone: v.phone },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error("সাইনআপ ব্যর্থ: " + error.message);
      return;
    }
    toast.success("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">নতুন অ্যাকাউন্ট</CardTitle>
          <CardDescription>এসকে কর্পোরেশন ইআরপি-তে যোগ দিন</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">পূর্ণ নাম</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">মোবাইল নম্বর</Label>
              <Input id="phone" type="tel" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input id="confirm" type="password" {...register("confirm")} />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : "অ্যাকাউন্ট তৈরি করুন"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link to="/login" className="text-primary hover:underline">লগইন করুন</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
