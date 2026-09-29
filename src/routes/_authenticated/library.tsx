import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Library — LEX" }, { name: "description", content: "Your saved judgments, articles and legal updates." }, { property: "og:title", content: "Library — LEX" }, { property: "og:description", content: "Your saved judgments, articles and legal updates." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ComingSoon title="Library" line="Your saved judgments, articles and legal updates." />,
});
