import { notFound } from "next/navigation";
import { getPublicCatalogueData } from "@/actions/catalogue-share";
import PublicCatalogueClient from "./client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicCataloguePage({ params }: Props) {
  const { token } = await params;
  const data = await getPublicCatalogueData(token);

  if ("error" in data) {
    if (data.error === "not_found") notFound();

    const messages: Record<string, { title: string; body: string }> = {
      inactive: {
        title: "This catalogue link is no longer active",
        body: "The business has deactivated this link. Please contact them for an updated link.",
      },
      expired: {
        title: "This catalogue link has expired",
        body: "The link you followed has passed its expiry date. Please contact the business for a new one.",
      },
      segment_deleted: {
        title: "Pricing configuration unavailable",
        body: "The pricing tier for this catalogue is no longer available. Please contact the business.",
      },
      unknown: {
        title: "Something went wrong",
        body: "We couldn't load this catalogue. Please try again later.",
      },
    };

    const msg = messages[data.error] ?? messages.unknown;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center space-y-3 max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-center mx-auto">
            <svg
              className="h-8 w-8 text-muted-foreground/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h1 className="text-lg font-bold">{msg.title}</h1>
          <p className="text-sm text-muted-foreground">{msg.body}</p>
        </div>
      </div>
    );
  }

  return <PublicCatalogueClient data={data} />;
}
