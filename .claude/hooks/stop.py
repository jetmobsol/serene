#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import argparse
import json
import os
import sys
import random
import subprocess
from pathlib import Path
from datetime import datetime

# Ensure hooks directory is on sys.path for utils imports
sys.path.insert(0, str(Path(__file__).parent))
from utils.constants import ensure_session_log_dir
from utils.tts_config import get_tts_script_path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def get_completion_messages():
    """Return list of friendly completion messages."""
    return [
        "Work complete!",
        "All done!",
        "Task finished!",
        "Job complete!",
        "Ready for next task!"
    ]


def get_llm_completion_message():
    """
    Generate completion message using 50/50 choice:
    - 50% chance: Generate humorous message via GLM CLI
    - 50% chance: Use a predefined friendly message

    Returns:
        str: Generated or predefined completion message
    """
    # 50/50 random choice
    if random.random() < 0.5:
        # Try GLM CLI for humorous message
        try:
            result = subprocess.run([
                "glm",
                "-p", "Generate a SINGLE short, witty, humorous completion message (under 10 words) for when a coding task is done. Return ONLY the message, no quotes, no explanation.",
                "--model", "haiku",
                "--setting-sources", "",
                "--strict-mcp-config",
                "--mcp-config", '{"mcpServers":{}}',
                "--no-session-persistence"
            ],
            capture_output=True,
            text=True,
            timeout=10
            )
            if result.returncode == 0:
                # Extract just the message from GLM output
                message = result.stdout.strip()
                # Remove common prefixes GLM might add
                for prefix in ["Here's", "Here is", "Message:", "The message is", "Completion:"]:
                    if message.startswith(prefix):
                        message = message.split(prefix, 1)[1].strip()
                # Remove quotes if present
                message = message.strip('"\'').strip()
                if message and len(message) < 100:  # Sanity check
                    return message
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
            pass  # Fall through to predefined message

    # Use random predefined message
    messages = get_completion_messages()
    return random.choice(messages)

def announce_completion():
    """Announce completion using the best available TTS service."""
    try:
        tts_script = get_tts_script_path()
        if not tts_script:
            return  # No TTS scripts available
        
        # Get completion message (LLM-generated or fallback)
        completion_message = get_llm_completion_message()
        
        # Call the TTS script with the completion message
        subprocess.run([
            "uv", "run", tts_script, completion_message
        ], 
        capture_output=True,  # Suppress output
        timeout=10  # 10-second timeout
        )
        
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        # Fail silently if TTS encounters issues
        pass
    except Exception:
        # Fail silently for any other errors
        pass


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--chat', action='store_true', help='Copy transcript to chat.json')
        args = parser.parse_args()
        
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Extract required fields
        session_id = input_data.get("session_id", "")
        stop_hook_active = input_data.get("stop_hook_active", False)

        # Ensure session log directory exists
        log_dir = ensure_session_log_dir(session_id)
        log_path = log_dir / "stop.json"

        # Read existing log data or initialize empty list
        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []

        # Append new data
        log_data.append(input_data)

        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)

        # Handle --chat switch
        if args.chat and 'transcript_path' in input_data:
            transcript_path = input_data['transcript_path']
            if os.path.exists(transcript_path):
                # Read .jsonl file and convert to JSON array
                chat_data = []
                try:
                    with open(transcript_path, 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                try:
                                    chat_data.append(json.loads(line))
                                except json.JSONDecodeError:
                                    pass  # Skip invalid lines

                    # Write to session log dir chat.json
                    chat_file = log_dir / 'chat.json'
                    with open(chat_file, 'w') as f:
                        json.dump(chat_data, f, indent=2)
                except Exception:
                    pass  # Fail silently

        # Announce completion via TTS
        announce_completion()

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        print(f"Warning: stop hook failed: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
