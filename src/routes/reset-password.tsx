import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
});

const schema = z.object({
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "পাসওয়ার্ড মিলছে না", path: ["confirm"] });

function ResetPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: v.password });
    setLoading(false);
    if (error) {
      toast.error("ব্যর্থ: " + error.message);
      return;
    }
    toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>নতুন পাসওয়ার্ড</CardTitle>
          <CardDescription>একটি নিরাপদ পাসওয়ার্ড নির্ধারণ করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input id="confirm" type="password" {...register("confirm")} />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "সংরক্ষণ হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
