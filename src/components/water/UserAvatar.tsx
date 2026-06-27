import { cn } from "@/lib/utils";

const sizeCls = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function UserAvatar({
  name,
  url,
  size = "md",
  className,
}: {
  name?: string | null;
  url?: string | null;
  size?: keyof typeof sizeCls;
  className?: string;
}) {
  const initial = (name?.trim()?.[0] ?? "ব").toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0369A1] font-semibold text-white ring-2 ring-[#BAE6FD]",
        sizeCls[size],
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name ?? ""} className="h-full w-full rounded-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
