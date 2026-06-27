import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
});

const schema = z.object({ email: z.string().email("সঠিক ইমেইল দিন") });

function ForgotPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(v.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("ব্যর্থ: " + error.message);
      return;
    }
    toast.success("রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>পাসওয়ার্ড রিসেট</CardTitle>
          <CardDescription>আপনার ইমেইল দিন, আমরা রিসেট লিংক পাঠাব</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "পাঠানো হচ্ছে..." : "পাসওয়ার্ড রিসেট লিংক পাঠান"}
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">লগইনে ফিরে যান</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
