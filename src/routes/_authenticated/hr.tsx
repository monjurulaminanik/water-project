import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/hr")({
  component: () => <ComingSoon title="মানবসম্পদ" />,
});
