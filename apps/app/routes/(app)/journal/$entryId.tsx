import { AiResponse } from "@/components/journal/ai-response";
import { DeleteEntryDialog } from "@/components/journal/delete-entry-dialog";
import { EntryForm } from "@/components/journal/entry-form";
import {
  useDeleteJournalMutation,
  useJournalByIdQuery,
} from "@/lib/queries/journal";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { MOOD_COLORS, type MoodType, type TagType } from "@repo/core";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Separator,
  Skeleton,
} from "@repo/ui";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(app)/journal/$entryId")({
  component: EntryDetail,
});

function EntryDetail() {
  const { entryId } = Route.useParams();
  const { data: entry, isLoading } = useJournalByIdQuery(entryId);
  const navigate = useNavigate();
  const deleteMutation = useDeleteJournalMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function handleDelete() {
    deleteMutation.mutate(entryId, {
      onSuccess: () => {
        navigate({ to: "/journal" });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-xl font-semibold">Entry not found</h2>
        <p className="text-muted-foreground">
          This entry may have been deleted.
        </p>
        <Button asChild variant="outline">
          <Link to="/journal">Back to Journal</Link>
        </Button>
      </div>
    );
  }

  const mood = entry.mood as MoodType;
  const MoodIcon = getMoodIcon(mood);
  const moodColor = MOOD_COLORS[mood]?.light;

  if (isEditing) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel editing
        </Button>
        <Card>
          <CardContent className="pt-6">
            <EntryForm
              entryId={entryId}
              defaultValues={{
                mood,
                tags: entry.tags as TagType[],
                note: entry.note ?? "",
              }}
              onSuccess={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link to="/journal">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journal
        </Link>
      </Button>

      <Card style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {MoodIcon && <MoodIcon className="h-6 w-6 text-muted-foreground" />}
            <div>
              <h2 className="text-xl font-semibold">{mood}</h2>
              <p className="text-sm text-muted-foreground">
                {formatRelativeTime(new Date(entry.createdAt))}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {entry.note && (
            <>
              <Separator />
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {entry.note}
              </p>
            </>
          )}
        </CardContent>

        {entry.aiResponse && (
          <CardFooter>
            <AiResponse
              response={entry.aiResponse.response}
              hasCrisisContent={entry.aiResponse.hasCrisisContent}
              variant="full"
            />
          </CardFooter>
        )}
      </Card>

      <DeleteEntryDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
