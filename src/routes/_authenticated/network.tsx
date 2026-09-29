import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/network")({
  head: () => ({ meta: [{ title: "Network — LEX" }, { name: "description", content: "Discover and connect with India's legal professionals." }, { property: "og:title", content: "Network — LEX" }, { property: "og:description", content: "Discover and connect with India's legal professionals." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ComingSoon title="Network" line="Discover and connect with India's legal professionals." />,
});
