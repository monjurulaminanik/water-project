import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().min(1, "ইমেইল প্রয়োজন").email("সঠিক ইমেইল দিন"),
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/" });
  }, [session, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) {
      toast.error("লগইন ব্যর্থ: " + error.message);
      return;
    }
    toast.success("সফলভাবে লগইন হয়েছে");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">এসকে কর্পোরেশন ইআরপি</CardTitle>
          <CardDescription>আপনার অ্যাকাউন্টে লগইন করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : "লগইন করুন"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/signup" className="text-primary hover:underline">
                নতুন অ্যাকাউন্ট তৈরি করুন
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
