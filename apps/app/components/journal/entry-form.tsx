import { MoodSelector } from "@/components/journal/mood-selector";
import {
  NoteEditor,
  type NoteEditorHandle,
} from "@/components/journal/note-editor";
import { TagChips } from "@/components/journal/tag-chips";
import { useUpdateJournalMutation } from "@/lib/queries/journal";
import type { MoodType, TagType } from "@repo/core";
import { Button } from "@repo/ui";
import { Loader2, Save } from "lucide-react";
import { useRef, useState } from "react";

const AI_THRESHOLD = 50;

interface EntryFormProps {
  defaultValues: {
    mood: MoodType;
    tags: TagType[];
    note: string;
  };
  entryId: string;
  onSuccess?: () => void;
  /** Called when update succeeds and note >= 50 chars (AI will regenerate) */
  onSaveWithAi?: (entryId: string) => void;
}

export function EntryForm({
  defaultValues,
  entryId,
  onSuccess,
  onSaveWithAi,
}: EntryFormProps) {
  const noteEditorRef = useRef<NoteEditorHandle>(null);

  const [mood, setMood] = useState<MoodType | null>(defaultValues.mood);
  const [tags, setTags] = useState<TagType[]>(defaultValues.tags);
  const [note, setNote] = useState(defaultValues.note);

  const updateMutation = useUpdateJournalMutation();
  const isPending = updateMutation.isPending;
  const canSave = mood !== null && !isPending;

  function handleSave() {
    if (!mood) return;
    noteEditorRef.current?.flush();

    updateMutation.mutate(
      { id: entryId, mood, tags, note },
      {
        onSuccess: () => {
          if (note.length >= AI_THRESHOLD) {
            onSaveWithAi?.(entryId);
          }
          onSuccess?.();
        },
      },
    );
  }

  return (
    <div className="space-y-5 lg:space-y-7">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-3">
          How are you feeling?
        </p>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-3">
          What&apos;s on your mind?
        </p>
        <TagChips value={tags} onChange={setTags} />
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-3">
          Your Reflection
        </p>
        <NoteEditor ref={noteEditorRef} value={note} onChange={setNote} />
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Button onClick={handleSave} disabled={!canSave}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Update Entry
            </>
          )}
        </Button>
        {onSuccess && (
          <Button variant="ghost" onClick={onSuccess}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
