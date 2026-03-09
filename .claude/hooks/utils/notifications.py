#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
# ]
# ///

"""
Justfile Notification System

Provides humorous completion messages for justfile commands.
Usage from justfile:
    just notify-commit    # Returns random commit message
    just notify-test      # Returns random test message
    just notify-fix       # Returns random fix message
    etc.

Environment variable:
    NOTIFY_SILENT=1    # Suppresses audio output, only prints message
"""

import os
import random
import sys
from pathlib import Path

# Add hooks directory to path for TTS imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from tts_config import get_tts_script_path


# Humorous message categories
COMMIT_MESSAGES = [
    "Changes immortalized in git history!",
    "Your code is now part of the permanent record.",
    "Commit complete! History remembers everything.",
    "Snapshot taken! The timeline has branches.",
    "Code saved! Future you will thank present you.",
    "Commit successful! Don't look back.",
    "Changes preserved! The blockchain has nothing on git.",
    "Done! Your legacy is now a SHA hash.",
    "Committed! Like, actually committed.",
    "Git forgives, but never forgets.",
]

TEST_MESSAGES = [
    "All tests passed! Time to break something else.",
    "Green across the board! You're basically a wizard now.",
    "Tests pass! Your code knows what it's doing.",
    "Zero failures! The compiler has accepted your offering.",
    "All green! Ship it to prod! Just kidding, don't.",
    "Tests passed! Confidence level: over 9000.",
    "Clean sweep! Not a single test objected.",
    "All systems go! Houston, we have a working app.",
    "Tests pass! You may now proceed with confidence.",
    "Zero red! The code respects you.",
]

TEST_FAILURES = [
    "Tests failed. The code has spoken.",
    "Red builds build character.",
    "Tests failed. Time to earn that paycheck.",
    "Bugs found! They were hiding in plain sight.",
    "Tests failed. At least you know now?",
    "The compiler is judging you. Fix it.",
    "Tests failed. Have you tried turning it off and on again?",
    "Red! But red is a power color, right?",
]

FIX_MESSAGES = [
    "Lint fixes applied! The code is now proper.",
    "Fixed! Your code is now presentable.",
    "Lint errors vanquished! Clean code prevails.",
    "Auto-fixed! The robots are helping.",
    "Style fixes applied! Aesthetics improved.",
    "Linted! The code formatter was satisfied.",
    "Fixed! Standards were meant to be followed.",
    "Cleanup complete! Your future self approves.",
]

VERIFY_MESSAGES = [
    "All verified! Everything checks out.",
    "Verification complete! You're good to go.",
    "All checks passed! The code is solid.",
    "Verified! Nothing exploded.",
    "All green! The code quality is acceptable.",
    "Checks pass! Merge with confidence.",
    "Verified! No surprises found.",
]

FORMAT_MESSAGES = [
    "Code formatted! Beauty is only whitespace deep.",
    "Formatting applied! Consistency is key.",
    "Styled! The code now matches its peers.",
    "Formatted! Art is subjective, but this is standard.",
    "Whitespace adjusted! The code breathes easier.",
]

BUILD_MESSAGES = [
    "Build succeeded! Artifacts created.",
    "Compiled! The machine understands you.",
    "Build complete! Your binary awaits.",
    "Compilation successful! Type checker satisfied.",
    "Built! The code has been transformed.",
]

SCRAPER_MESSAGES = [
    "Spiders deployed! The web awaits.",
    "Scrapers running! Data incoming.",
    "Spiders awake! The hunt begins.",
    "Scraping initiated! Nothing escapes.",
    "Web scrapers dispatched! The crawl is real.",
]

ADW_MESSAGES = [
    "ADW validated! The workflows flow.",
    "Agents confirmed! The automation automates.",
    "ADW checked! The pipelines are clean.",
    "Workflows verified! The agents are pleased.",
]

# Message type mapping
MESSAGE_TYPES = {
    "commit": COMMIT_MESSAGES,
    "test": TEST_MESSAGES,
    "test-fail": TEST_FAILURES,
    "fix": FIX_MESSAGES,
    "verify": VERIFY_MESSAGES,
    "format": FORMAT_MESSAGES,
    "build": BUILD_MESSAGES,
    "scraper": SCRAPER_MESSAGES,
    "adw": ADW_MESSAGES,
}


def get_message(msg_type: str) -> str:
    """Get a random message for the given type."""
    messages = MESSAGE_TYPES.get(msg_type, ["Task complete!"])
    return random.choice(messages)


def play_tts(text: str) -> bool:
    """Play text via TTS if available and not silenced."""
    if os.getenv("NOTIFY_SILENT") == "1":
        return False

    try:
        import subprocess

        tts_script = get_tts_script_path()
        if not tts_script:
            return False

        subprocess.run(
            ["uv", "run", tts_script, text],
            capture_output=True,
            timeout=10
        )
        return True
    except Exception:
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: notify.py <type> [--silent]", file=sys.stderr)
        print("Types:", ", ".join(MESSAGE_TYPES.keys()))
        sys.exit(1)

    msg_type = sys.argv[1]
    if msg_type not in MESSAGE_TYPES:
        print(f"Unknown type: {msg_type}", file=sys.stderr)
        sys.exit(1)

    message = get_message(msg_type)
    print(message)  # Always print to stdout
    play_tts(message)  # Optionally speak


if __name__ == "__main__":
    main()
