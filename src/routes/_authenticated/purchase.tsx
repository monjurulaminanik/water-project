import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/purchase")({
  component: () => <ComingSoon title="ক্রয়" />,
});
