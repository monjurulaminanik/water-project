import { cn } from "@/lib/utils";
import { ROLE_COLOR_CLASS, type Role } from "@/lib/rbac";

export function RoleBadge({ role, className }: { role: Pick<Role, "name_bn" | "color"> | null | undefined; className?: string }) {
  if (!role) return null;
  const cls = ROLE_COLOR_CLASS[role.color ?? "blue"] ?? ROLE_COLOR_CLASS.blue;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", cls, className)}>
      {role.name_bn}
    </span>
  );
}
