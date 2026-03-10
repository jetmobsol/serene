import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { journalEntry, type NewJournalEntry, user } from "../schema";

/**
 * Seeds the database with realistic journal entries for development.
 * Requires users to be seeded first (assigns entries to first user).
 */
export async function seedJournalEntries(
  db: PostgresJsDatabase<typeof schema>,
) {
  console.log("Seeding journal entries...");

  // Get first seeded user to assign entries to
  const [firstUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, "alice@example.com"))
    .limit(1);

  if (!firstUser) {
    console.warn(
      "⚠️ No users found — skipping journal seed. Run seedUsers first.",
    );
    return;
  }

  const now = new Date();
  const day = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  const entries: NewJournalEntry[] = [
    {
      userId: firstUser.id,
      mood: "Happy",
      tags: ["Nature", "Fitness"],
      note: "Morning run through the park was exactly what I needed. The air was crisp and I spotted a family of ducks by the pond.",
      createdAt: day(0),
    },
    {
      userId: firstUser.id,
      mood: "Calm",
      tags: ["Hobbies"],
      note: "Spent an hour reading on the porch. Peaceful afternoon.",
      createdAt: day(0),
    },
    {
      userId: firstUser.id,
      mood: "Anxious",
      tags: ["Work"],
      note: "Big presentation tomorrow and I keep running through all the things that could go wrong. Need to remind myself I have prepared well.",
      createdAt: day(1),
    },
    {
      userId: firstUser.id,
      mood: "Happy",
      tags: ["Social", "Hobbies"],
      note: "Game night with friends was a blast. We laughed so hard playing charades that my cheeks hurt. These moments matter.",
      createdAt: day(1),
    },
    {
      userId: firstUser.id,
      mood: "Sad",
      tags: ["Relationships"],
      note: "Missing my sister who moved across the country. We used to have coffee together every Sunday morning. Called her today though.",
      createdAt: day(2),
    },
    {
      userId: firstUser.id,
      mood: "Calm",
      tags: ["Health", "Nature"],
      note: "Meditation session by the lake.",
      createdAt: day(2),
    },
    {
      userId: firstUser.id,
      mood: "Overwhelmed",
      tags: ["Work", "Health"],
      note: "Three deadlines converging this week and I forgot to eat lunch again. Setting a reminder to take breaks. Small steps.",
      createdAt: day(3),
    },
    {
      userId: firstUser.id,
      mood: "Happy",
      tags: ["Fitness"],
      note: "Personal best on my 5K today! All those early mornings are paying off. Celebrated with a smoothie.",
      createdAt: day(4),
    },
    {
      userId: firstUser.id,
      mood: "Anxious",
      tags: ["Health", "Sleep"],
      note: "Couldn't sleep last night. Mind racing about things I can't control. Going to try the breathing exercise tonight.",
      createdAt: day(5),
    },
    {
      userId: firstUser.id,
      mood: "Calm",
      tags: ["Nature", "Hobbies"],
      note: "Gardening is becoming my favorite weekend activity. Planted tomatoes and basil today. There is something grounding about working with soil.",
      createdAt: day(6),
    },
    {
      userId: firstUser.id,
      mood: "Angry",
      tags: ["Work"],
      note: "Frustrated with a colleague who keeps taking credit for team work. Need to address this directly instead of stewing over it.",
      createdAt: day(7),
    },
    {
      userId: firstUser.id,
      mood: "Happy",
      tags: ["Social", "Nature"],
      note: "Picnic in the botanical gardens with old college friends. Perfect weather. Grateful for people who make you feel like no time has passed.",
      createdAt: day(9),
    },
    {
      userId: firstUser.id,
      mood: "Sad",
      tags: ["Health"],
      note: "Low energy day. Gave myself permission to rest.",
      createdAt: day(10),
    },
    {
      userId: firstUser.id,
      mood: "Overwhelmed",
      tags: ["Work", "Relationships"],
      note: "Trying to balance a demanding project with family commitments. Feeling pulled in too many directions. Partner was understanding when I explained.",
      createdAt: day(12),
    },
    {
      userId: firstUser.id,
      mood: "Calm",
      tags: ["Sleep", "Health"],
      note: "Finally got a full eight hours. Amazing what a difference good sleep makes. The new bedtime routine with no screens is working.",
      createdAt: day(14),
    },
  ];

  for (const entry of entries) {
    await db.insert(journalEntry).values(entry).onConflictDoNothing();
  }

  console.log(`Seeded ${entries.length} journal entries`);
}
