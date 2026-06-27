import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/service")({
  component: () => <ComingSoon title="সার্ভিস" />,
});
