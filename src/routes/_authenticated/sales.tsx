import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/sales")({
  component: () => <ComingSoon title="বিক্রয়" />,
});
