import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/about")({
  component: About,
});

function About() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-6">About Serene</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Serene is your private AI-powered wellness journal. Track your mood,
          write reflections, and receive gentle, personalized encouragement to
          support your emotional well-being.
        </p>
      </div>

      {/* Mission Section */}
      <section className="mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Our Mission</CardTitle>
            <CardDescription>
              Making mindful self-reflection accessible to everyone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We believe that small, consistent acts of self-reflection can have
              a profound impact on emotional well-being. Serene was created to
              make journaling effortless and rewarding.
            </p>
            <p className="text-muted-foreground">
              By combining mood tracking with AI-powered insights, Serene helps
              you notice patterns, celebrate progress, and navigate difficult
              moments with greater self-awareness.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">
          How Serene Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Log Your Mood</CardTitle>
              <CardDescription>
                Choose how you're feeling from six mood options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Happy, Calm, Anxious, Sad, Overwhelmed, or Angry. Each check-in
                takes just a moment and helps build a picture of your emotional
                landscape.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Write a Reflection</CardTitle>
              <CardDescription>
                Share your thoughts in your own words
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add context with optional tags and a brief note. There's no
                right or wrong way to journal. Even a few words can be
                meaningful.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Receive Insights</CardTitle>
              <CardDescription>
                Get personalized AI encouragement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Serene's AI companion responds with gentle, contextual
                encouragement. It acknowledges your feelings and offers support
                without judgment.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Privacy Matters</CardTitle>
            <CardDescription>
              Your journal entries are private and secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Every journal entry is encrypted and accessible only to you. We
              never share your personal reflections with third parties. You can
              export or delete your data at any time.
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-12" />

      {/* Disclaimer */}
      <section className="text-center">
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Serene is not a substitute for professional mental health care. If you
          are in crisis, please contact the 988 Suicide and Crisis Lifeline
          (call or text 988) or the Crisis Text Line (text HOME to 741741).
        </p>
      </section>
    </div>
  );
}
