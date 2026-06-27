import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Users, Calculator, Package, ShoppingCart,
  TrendingUp, UserCheck, Factory, Briefcase, Wrench, FileCheck,
  UsersRound, BadgeDollarSign, BarChart3, Settings, Droplet,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

const items = [
  { title: "ড্যাশবোর্ড", url: "/", icon: LayoutDashboard, perm: "dashboard.view" },
  { title: "শাখা ব্যবস্থাপনা", url: "/branches", icon: Building2, perm: "branches.view" },
  { title: "ব্যবহারকারী", url: "/users", icon: Users, perm: "users.view" },
  { title: "হিসাব নিকাশ", url: "/accounting", icon: Calculator, perm: "accounting.view" },
  { title: "পণ্য ও স্টক", url: "/inventory", icon: Package, perm: "inventory.view" },
  { title: "ক্রয়", url: "/purchase", icon: ShoppingCart, perm: "purchase.view" },
  { title: "বিক্রয়", url: "/sales", icon: TrendingUp, perm: "sales.view" },
  { title: "গ্রাহক", url: "/crm", icon: UserCheck, perm: "crm.view" },
  { title: "উৎপাদন", url: "/manufacturing", icon: Factory, perm: "manufacturing.view" },
  { title: "প্রকল্প", url: "/projects", icon: Briefcase, perm: "projects.view" },
  { title: "সার্ভিস", url: "/service", icon: Wrench, perm: "service.view" },
  { title: "এএমসি", url: "/amc", icon: FileCheck, perm: "amc.view" },
  { title: "মানবসম্পদ", url: "/hr", icon: UsersRound, perm: "hr.view" },
  { title: "বেতন", url: "/payroll", icon: BadgeDollarSign, perm: "payroll.view" },
  { title: "প্রতিবেদন", url: "/reports", icon: BarChart3, perm: "reports.view" },
  { title: "সেটিংস", url: "/settings", icon: Settings, perm: "settings.view" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { hasPermission, isSuperAdmin, loading } = useAuth();
  const visible = items.filter((i) => isSuperAdmin || loading || hasPermission(i.perm));

  return (
    <Sidebar collapsible="icon" className="border-r border-[#BAE6FD]/60">
      <SidebarHeader className="border-b border-[#BAE6FD]/60 water-glass">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0369A1] text-white shadow-md shadow-[#0EA5E9]/30">
            <Droplet className="h-5 w-5" fill="white" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-[#0C4A6E]">এসকে কর্পোরেশন</span>
            <span className="text-[11px] text-[#0369A1]">ওয়াটার পিউরিফায়ার</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="water-glass">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#0369A1]">মূল মেনু</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => {
                const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={
                        active
                          ? "border-l-[3px] border-[#0EA5E9] bg-[#E0F2FE] text-[#075985] hover:bg-[#E0F2FE]"
                          : "text-[#0369A1] hover:bg-[#F0F9FF] hover:text-[#0C4A6E]"
                      }
                    >
                      <Link to={item.url}>
                        <item.icon className={active ? "text-[#0EA5E9]" : "text-[#0284C7]"} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
