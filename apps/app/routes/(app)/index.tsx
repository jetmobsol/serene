import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, BookHeart, Flame, PenLine, Sparkles } from "lucide-react";

export const Route = createFileRoute("/(app)/")({
  component: Dashboard,
});

function Dashboard() {
  const stats = [
    {
      title: "Journal Entries",
      value: "0",
      description: "Total entries",
      icon: BookHeart,
    },
    {
      title: "Mood Check-ins",
      value: "0",
      description: "This week",
      icon: Sparkles,
    },
    {
      title: "Current Streak",
      value: "0 days",
      description: "Keep it going!",
      icon: Flame,
    },
    {
      title: "AI Insights",
      value: "0",
      description: "Personalized reflections",
      icon: BarChart3,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to Serene. Track your mood, reflect, and grow.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Your wellness journey begins here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <PenLine className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Log your mood</p>
                  <p className="text-xs text-muted-foreground">
                    Choose how you're feeling right now
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookHeart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Write a reflection</p>
                  <p className="text-xs text-muted-foreground">
                    Share your thoughts in a few sentences
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Receive AI insights</p>
                  <p className="text-xs text-muted-foreground">
                    Get personalized encouragement and support
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Serene</CardTitle>
            <CardDescription>
              Your AI-powered wellness companion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Serene helps you build a mindful journaling habit. Track your
              mood, reflect on your day, and receive personalized AI insights to
              support your emotional well-being. Your entries are private and
              secure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
