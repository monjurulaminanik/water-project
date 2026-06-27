import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shield, ShieldCheck, Building2, Calculator, TrendingUp, Wrench, Package, Users, User as UserIcon, ArrowLeft, Save } from "lucide-react";
import { WaterCard } from "@/components/water/WaterCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropletBadge } from "@/components/water/DropletIcon";
import { useRoles, usePermissions, useRolePermissions, useSaveRolePermissions, useUsersList, ACTION_ORDER, ACTIONS_BN, MODULE_ORDER, MODULES_BN, ROLE_COLOR_CLASS, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { toBnDigits } from "@/lib/bn";

export const Route = createFileRoute("/_authenticated/users/roles")({
  component: RolesPage,
});

const ROLE_ICONS: Record<string, typeof Shield> = {
  SUPER_ADMIN: ShieldCheck, BRANCH_MANAGER: Building2, ACCOUNTANT: Calculator,
  SALES_EXECUTIVE: TrendingUp, TECHNICIAN: Wrench, INVENTORY_STAFF: Package,
  HR_MANAGER: Users, CUSTOMER: UserIcon,
};

function RolesPage() {
  const { data: roles = [] } = useRoles();
  const { data: permissions = [] } = usePermissions();
  const { data: users = [] } = useUsersList();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  if (selectedRole) {
    return <RoleDetail role={selectedRole} onBack={() => setSelectedRole(null)} />;
  }

  const userCountByRole = (roleId: string) =>
    users.filter((u) => u.assignments.some((a) => a.role_id === roleId)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DropletBadge className="droplet-float" />
        <div>
          <h1 className="text-3xl font-semibold text-[#0C4A6E]">ভূমিকা ও অনুমতি</h1>
          <p className="text-sm text-[#0369A1]">প্রতিটি ভূমিকার অনুমতি কনফিগার করুন</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => {
          const Icon = ROLE_ICONS[r.code] ?? Shield;
          const cls = ROLE_COLOR_CLASS[r.color ?? "blue"] ?? ROLE_COLOR_CLASS.blue;
          const permCount = permissions.length; // placeholder; actual count from useRolePermissions
          return (
            <WaterCard key={r.id} className="p-5">
              <div className={cn("absolute inset-x-0 top-0 h-1", cls.replace("text-", "bg-").split(" ")[0])} />
              <div className="flex items-start gap-3">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", cls)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#0C4A6E]">{r.name_bn}</h3>
                    {r.is_system && <Badge variant="outline" className="text-[10px]">সিস্টেম</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[#0369A1]">{r.description_bn}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-[#0369A1]">
                <span>{toBnDigits(userCountByRole(r.id))} জন ব্যবহারকারী</span>
                <span className="text-[#7DD3FC]">{toBnDigits(permCount)} টি অনুমতি</span>
              </div>
              <Button variant="ghost" className="mt-3 w-full justify-between text-[#0369A1]" onClick={() => setSelectedRole(r)}>
                অনুমতি দেখুন →
              </Button>
            </WaterCard>
          );
        })}
      </div>
    </div>
  );
}

function RoleDetail({ role, onBack }: { role: Role; onBack: () => void }) {
  const { data: permissions = [] } = usePermissions();
  const { data: currentIds = [] } = useRolePermissions(role.id);
  const save = useSaveRolePermissions();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const isSuper = role.code === "SUPER_ADMIN";
  const disabled = isSuper;

  useEffect(() => { setSelected(new Set(currentIds)); }, [currentIds]);

  const matrix = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const p of permissions) {
      if (!map[p.module]) map[p.module] = {};
      map[p.module][p.action] = p.id;
    }
    return map;
  }, [permissions]);

  const toggle = (id: string) => {
    if (disabled) return;
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleRow = (mod: string) => {
    if (disabled) return;
    const ids = ACTION_ORDER.map((a) => matrix[mod]?.[a]).filter(Boolean) as string[];
    const allOn = ids.every((id) => selected.has(id));
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => { if (allOn) n.delete(id); else n.add(id); });
      return n;
    });
  };

  const onSave = async () => {
    await save.mutateAsync({ roleId: role.id, permissionIds: Array.from(selected) });
    toast.success("ভূমিকার অনুমতি আপডেট হয়েছে", { icon: "💧" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> ফিরে যান</Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#0C4A6E]">{role.name_bn}</h1>
          <p className="text-sm text-[#0369A1]">{role.description_bn}</p>
        </div>
      </div>

      {disabled && (
        <WaterCard className="p-3 text-sm text-rose-700">
          সুপার অ্যাডমিনের সব অনুমতি আছে — সম্পাদনা করা যাবে না।
        </WaterCard>
      )}

      <WaterCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#F0F9FF] text-left text-xs uppercase tracking-wider text-[#0369A1]">
                <th className="px-3 py-3">মডিউল</th>
                {ACTION_ORDER.map((a) => (
                  <th key={a} className="px-3 py-3 text-center">{ACTIONS_BN[a]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2FE]">
              {MODULE_ORDER.map((mod, idx) => (
                <tr key={mod} className={cn(idx % 2 === 0 ? "bg-white/40" : "bg-[#F0F9FF]/40", "hover:bg-[#E0F2FE]/60")}>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => toggleRow(mod)} className="font-medium text-[#0C4A6E] hover:text-[#0EA5E9]">
                      {MODULES_BN[mod]}
                    </button>
                  </td>
                  {ACTION_ORDER.map((act) => {
                    const id = matrix[mod]?.[act];
                    if (!id) return <td key={act} className="px-3 py-2 text-center text-[#BAE6FD]">—</td>;
                    return (
                      <td key={act} className="px-3 py-2 text-center">
                        <Checkbox checked={isSuper || selected.has(id)} disabled={disabled} onCheckedChange={() => toggle(id)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WaterCard>

      {!disabled && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={onSave} disabled={save.isPending} className="bg-gradient-to-r from-[#0EA5E9] to-[#0369A1] text-white shadow-lg">
            <Save className="h-4 w-4" /> {save.isPending ? "সংরক্ষণ..." : "অনুমতি সংরক্ষণ করুন"}
          </Button>
        </div>
      )}
    </div>
  );
}
