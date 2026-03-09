import { MoodSelector } from "@/components/journal/mood-selector";
import {
  NoteEditor,
  type NoteEditorHandle,
} from "@/components/journal/note-editor";
import { TagChips } from "@/components/journal/tag-chips";
import {
  useCreateJournalMutation,
  useUpdateJournalMutation,
} from "@/lib/queries/journal";
import { streamingEntryIdAtom } from "@/lib/hooks/use-sse-stream";
import type { MoodType, TagType } from "@repo/core";
import { Button } from "@repo/ui";
import { Loader2, Save } from "lucide-react";
import { useRef, useState } from "react";
import { useSetAtom } from "jotai";

interface EntryFormProps {
  defaultValues?: {
    mood: MoodType;
    tags: TagType[];
    note: string;
  };
  entryId?: string;
  onSuccess?: () => void;
}

export function EntryForm({
  defaultValues,
  entryId,
  onSuccess,
}: EntryFormProps) {
  const noteEditorRef = useRef<NoteEditorHandle>(null);

  const [mood, setMood] = useState<MoodType | null>(
    defaultValues?.mood ?? null,
  );
  const [tags, setTags] = useState<TagType[]>(defaultValues?.tags ?? []);
  const [note, setNote] = useState(defaultValues?.note ?? "");

  const setStreamingEntryId = useSetAtom(streamingEntryIdAtom);

  const createMutation = useCreateJournalMutation();
  const updateMutation = useUpdateJournalMutation();

  const isEditing = !!entryId;
  const mutation = isEditing ? updateMutation : createMutation;
  const isPending = mutation.isPending;
  const canSave = mood !== null && !isPending;

  function handleSave() {
    if (!mood) return;
    noteEditorRef.current?.flush();

    if (isEditing && entryId) {
      updateMutation.mutate(
        { id: entryId, mood, tags, note },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        },
      );
    } else {
      createMutation.mutate(
        { mood, tags, note },
        {
          onSuccess: (data) => {
            if (note.length >= 50 && data?.id) {
              setStreamingEntryId(data.id);
            }
            setMood(null);
            setTags([]);
            setNote("");
            onSuccess?.();
          },
        },
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">How are you feeling?</h3>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Tags</h3>
        <TagChips value={tags} onChange={setTags} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Notes</h3>
        <NoteEditor ref={noteEditorRef} value={note} onChange={setNote} />
      </div>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {isEditing ? "Update Entry" : "Save Entry"}
          </>
        )}
      </Button>
    </div>
  );
}
