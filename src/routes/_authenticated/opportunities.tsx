import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — LEX" }, { name: "description", content: "Internships, jobs and research positions." }, { property: "og:title", content: "Opportunities — LEX" }, { property: "og:description", content: "Internships, jobs and research positions." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ComingSoon title="Opportunities" line="Internships, jobs and research positions." />,
});
