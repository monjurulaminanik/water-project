import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppNavbar } from "@/components/AppNavbar";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BranchProvider } from "@/lib/branch-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  return (
    <BranchProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="relative z-10 flex min-h-screen flex-col bg-transparent">
          <AppNavbar />
          <main className="relative z-10 flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
          <AppFooter />
        </SidebarInset>
      </SidebarProvider>
    </BranchProvider>
  );
}
