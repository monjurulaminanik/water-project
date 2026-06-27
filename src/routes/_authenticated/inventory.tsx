import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: () => <ComingSoon title="পণ্য ও স্টক" />,
});
