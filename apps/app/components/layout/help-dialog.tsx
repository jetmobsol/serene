import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Heart,
  Keyboard,
  Moon,
  PenLine,
  Shield,
  Sparkles,
} from "lucide-react";
import { atom, useAtom } from "jotai";

export const helpDialogOpenAtom = atom(false);

const features = [
  {
    icon: PenLine,
    title: "Journal Entries",
    desc: "Record your mood, thoughts, and reflections. Entries over 50 characters receive an AI-powered insight.",
  },
  {
    icon: Sparkles,
    title: "AI Reflections",
    desc: "After saving a detailed entry, Serene gently reflects back patterns and perspectives you might not notice.",
  },
  {
    icon: BookOpen,
    title: "Timeline",
    desc: "Browse your past entries chronologically. Tap any card to revisit and re-read your reflections.",
  },
  {
    icon: Heart,
    title: "Mood Tracking",
    desc: "Choose from six moods — Happy, Calm, Anxious, Sad, Overwhelmed, or Angry — to build awareness over time.",
  },
];

const shortcuts = [
  { keys: "N", label: "New entry" },
  { keys: "D", label: "Toggle dark mode" },
  { keys: "?", label: "Open this help" },
];

export function HelpDialog() {
  const [open, setOpen] = useAtom(helpDialogOpenAtom);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 lg:px-8 pt-6 lg:pt-8 pb-0">
          <DialogTitle
            className="text-2xl lg:text-3xl text-foreground"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 400,
            }}
          >
            Welcome to Serene
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your private space for reflection and self-awareness
          </p>
        </DialogHeader>

        <div className="px-6 lg:px-8 py-6 lg:py-8">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-7"
            >
              {/* Features */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-4">
                  What you can do
                </p>
                <div className="grid gap-3">
                  {features.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i, duration: 0.25 }}
                      className="flex gap-3.5 rounded-lg bg-muted/40 border border-border/30 px-4 py-3"
                    >
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center
                          rounded-full bg-primary/10 text-primary"
                      >
                        <f.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {f.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          {f.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Keyboard shortcuts */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground/50 font-medium mb-3 flex items-center gap-1.5">
                  <Keyboard className="h-3 w-3" />
                  Keyboard shortcuts
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {shortcuts.map((s) => (
                    <div key={s.keys} className="flex items-center gap-2">
                      <kbd
                        className="inline-flex h-6 min-w-[24px] items-center justify-center
                          rounded border border-border bg-muted px-1.5
                          text-[11px] font-mono font-medium text-muted-foreground"
                      >
                        {s.keys}
                      </kbd>
                      <span className="text-xs text-muted-foreground">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="flex gap-3 rounded-lg bg-secondary/50 border border-secondary px-4 py-3">
                <Moon className="h-4 w-4 mt-0.5 shrink-0 text-secondary-foreground" />
                <p className="text-xs text-secondary-foreground leading-relaxed">
                  <span className="font-medium">Tip:</span> Use the font-size
                  button (Aa) in the toolbar to adjust text size to your
                  preference. Your choice is remembered across sessions.
                </p>
              </div>

              {/* Privacy note */}
              <div className="flex gap-3 rounded-lg border border-border/30 px-4 py-3">
                <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">
                    Your privacy matters.
                  </span>{" "}
                  Entries are stored securely and never shared. AI reflections
                  are generated in real-time and not retained after delivery.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
