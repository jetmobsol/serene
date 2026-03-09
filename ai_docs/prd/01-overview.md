# 1. Executive Summary

Serene is an AI-powered mental wellness journal that transforms the existing Bun monorepo starter kit into a purposeful product. Users log their mood, tag relevant life activities, and write reflective notes. Upon saving an entry, the Anthropic Claude API provides a supportive, non-clinical "vibe check" — a brief empathetic response that acknowledges the user's emotional state and offers encouragement. A visual analytics dashboard shows mood patterns over time, helping users gain self-awareness.

**Key Business Objectives:**

- Provide a private, secure space for emotional reflection with zero friction.
- Differentiate through AI-powered empathetic analysis that feels genuinely supportive, not robotic.
- Deliver measurable user engagement via daily journaling streaks and return visits.
- Demonstrate a production-grade application built on modern web technologies.

**Scope:** This PRD covers the transformation of the existing codebase (auth, Docker, UI components, routing) into the Serene product. It introduces three new feature domains: mood journaling, AI vibe check, and visual analytics. The landing page, onboarding, and authentication flows are adapted from existing infrastructure.

---

# 2. Product Vision and Core Value Proposition

## 2.1 Vision Statement

Serene empowers individuals to build emotional self-awareness through guided journaling, contextual mood tracking, and AI-driven empathetic feedback — all within a calm, private digital environment.

## 2.2 Unique Selling Proposition (USP)

"Your private AI companion for daily emotional check-ins. Log how you feel, understand why, and receive gentle encouragement — all in under 60 seconds."

## 2.3 Target Users

| Persona                  | Description                                                | Primary Need                                            |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------- |
| **Mindful Professional** | Ages 25-40, high-stress career, limited time for self-care | Quick daily emotional check-in with actionable patterns |
| **Wellness Seeker**      | Ages 18-35, actively interested in mental health practices | Structured journaling with AI-powered reflection        |
| **Therapy Companion**    | Any age, currently in or considering therapy               | Track moods between sessions, identify triggers         |

## 2.4 Business Goals and Success Metrics

| Metric                       | Target                                | Measurement Method                                      |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------- |
| **Daily Active Users (DAU)** | 100 within 30 days of launch          | Analytics event tracking                                |
| **7-Day Retention Rate**     | >= 40%                                | Cohort analysis (users who return within 7 days)        |
| **Entries Per Active User**  | >= 3/week average                     | Database query: entries / active users / week           |
| **AI Vibe Check Engagement** | >= 80% of entries trigger AI response | Ratio of entries with >= 50 char notes to total entries |
| **Average Session Duration** | >= 2 minutes                          | Analytics timing events                                 |
| **User Satisfaction (NPS)**  | >= 50                                 | In-app survey (post-onboarding, day 7, day 30)          |
