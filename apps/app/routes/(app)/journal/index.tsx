import { EntryForm } from "@/components/journal/entry-form";
import { Timeline } from "@/components/journal/timeline";
import { Card, CardContent, CardHeader, CardTitle, Separator } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/journal/")({
  component: Journal,
});

function Journal() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Journal</h2>
        <p className="text-muted-foreground">
          How are you feeling today? Record your mood and thoughts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm />
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Entries</h2>
        <Timeline />
      </div>
    </div>
  );
}
