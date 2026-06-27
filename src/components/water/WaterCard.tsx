import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const WaterCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("water-card relative overflow-hidden", className)} {...props} />
  ),
);
WaterCard.displayName = "WaterCard";
