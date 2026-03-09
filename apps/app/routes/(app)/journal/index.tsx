import { MoodSelector } from "@/components/journal/mood-selector";
import { NoteEditor } from "@/components/journal/note-editor";
import { TagChips } from "@/components/journal/tag-chips";
import type { MoodType, TagType } from "@repo/core";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/(app)/journal/")({
  component: Journal,
});

function Journal() {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [note, setNote] = useState("");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Journal Entry</h2>
        <p className="text-muted-foreground">
          How are you feeling today? Record your mood and thoughts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mood</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodSelector value={selectedMood} onChange={setSelectedMood} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <TagChips value={selectedTags} onChange={setSelectedTags} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <NoteEditor value={note} onChange={setNote} />
        </CardContent>
      </Card>
    </div>
  );
}
