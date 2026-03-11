import { formatRelativeTime } from "@/lib/utils/relative-time";
import { getMoodIcon } from "@/lib/utils/mood-icons";
import { truncate } from "@/lib/utils/text";
import { MOOD_COLORS, type MoodType } from "@repo/core";
import {
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
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const mood = entry.mood as MoodType;
  const MoodIcon = getMoodIcon(mood);
  const moodColor = MOOD_COLORS[mood]?.light;

  return (
    <Card
      className="relative overflow-hidden group hover:shadow-[0_4px_24px_oklch(0.22_0.003_250/7%)] transition-all duration-200 cursor-pointer"
      style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}
    >
      <Link
        to="/journal/$entryId"
        params={{ entryId: entry.id }}
        className="block"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 pr-20">
          <div className="flex items-center gap-2">
            {MoodIcon && (
              <MoodIcon className="h-4 w-4 text-muted-foreground/70" />
            )}
            <span className="text-sm font-medium text-foreground">{mood}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5">
          {entry.note && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {truncate(entry.note, 150)}
            </p>
          )}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-background border border-border/60 text-xs text-muted-foreground/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Link>

      {/* Timestamp + menu outside Link — pointer-events-none on wrapper so Link stays clickable */}
      <div className="absolute top-0 right-0 flex items-center h-14 px-4 gap-1 pointer-events-none">
        <span className="text-xs text-muted-foreground/60 group-hover:opacity-0 transition-opacity duration-150 whitespace-nowrap">
          {formatRelativeTime(entry.createdAt)}
        </span>
        <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Entry actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(entry.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(entry.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence>
        {entry.aiResponse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <CardFooter className="pt-0">
              <AiResponse
                response={entry.aiResponse.response}
                hasCrisisContent={entry.aiResponse.hasCrisisContent}
                variant="compact"
              />
            </CardFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
