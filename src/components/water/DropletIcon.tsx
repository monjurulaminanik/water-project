import { Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

export function DropletIcon({
  className,
  filled = true,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <Droplet
      className={cn("h-4 w-4", className)}
      fill={filled ? "currentColor" : "none"}
    />
  );
}

export function DropletBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0369A1] text-white shadow-md shadow-[#0EA5E9]/30",
        className,
      )}
    >
      <Droplet className="h-5 w-5" fill="white" />
    </span>
  );
}
