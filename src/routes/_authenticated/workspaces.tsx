import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/workspaces")({
  head: () => ({ meta: [{ title: "Workspaces — LEX" }, { name: "description", content: "Collaborate. Research. Build." }, { property: "og:title", content: "Workspaces — LEX" }, { property: "og:description", content: "Collaborate. Research. Build." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ComingSoon title="Workspaces" line="Collaborate. Research. Build." />,
});
