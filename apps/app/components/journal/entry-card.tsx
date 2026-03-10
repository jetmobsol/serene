import { formatRelativeTime } from "@/lib/utils/relative-time";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { truncate } from "@/lib/utils/text";
import { MOOD_COLORS, type MoodType } from "@repo/core";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { AiResponse } from "./ai-response";

export interface JournalEntryWithAi {
  id: string;
  mood: string;
  tags: string[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  aiResponse: {
    id: string;
    response: string;
    hasCrisisContent: boolean;
  } | null;
}

interface EntryCardProps {
  entry: JournalEntryWithAi;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isStreaming?: boolean;
  streamedText?: string;
  streamHasCrisisContent?: boolean;
}

export function EntryCard({
  entry,
  onEdit,
  onDelete,
  isStreaming = false,
  streamedText = "",
  streamHasCrisisContent = false,
}: EntryCardProps) {
  const mood = entry.mood as MoodType;
  const MoodIcon = getMoodIcon(mood);
  const moodColor = MOOD_COLORS[mood]?.light;

  return (
    <Card
      className="relative overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}
    >
      <Link
        to="/journal/$entryId"
        params={{ entryId: entry.id }}
        className="block"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            {MoodIcon && <MoodIcon className="h-5 w-5 text-muted-foreground" />}
            <span className="font-medium">{mood}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </CardHeader>

        <CardContent className="space-y-2">
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {entry.note && (
            <p className="text-sm text-muted-foreground">
              {truncate(entry.note, 150)}
            </p>
          )}
        </CardContent>
      </Link>

      <AnimatePresence>
        {(entry.aiResponse || isStreaming) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <CardFooter className="pt-0">
              <AiResponse
                response={entry.aiResponse?.response ?? null}
                hasCrisisContent={
                  entry.aiResponse?.hasCrisisContent ?? streamHasCrisisContent
                }
                isStreaming={isStreaming}
                streamedText={streamedText}
                variant="compact"
              />
            </CardFooter>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Entry actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onEdit(entry.id);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onDelete(entry.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
