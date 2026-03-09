#!/usr/bin/env python3
"""
Text-to-Script (TTS) configuration for Claude Code hooks.

Centralized TTS script selection with configurable priority order.
Add/remove/reorder TTS providers here to change behavior across all hooks.
"""

import os
from pathlib import Path
from typing import List, Callable


def get_tts_script_path() -> str | None:
    """
    Determine which TTS script to use based on available API keys.
    Returns the path to the first available TTS script in priority order.

    Returns:
        str: Path to the TTS script, or None if no TTS is available

    To configure TTS priority, modify the PROVIDERS list below.
    """
    script_dir = Path(__file__).parent.parent
    tts_dir = script_dir / "utils" / "tts"

    # ============================================================================
    # TTS PROVIDER CONFIGURATION
    # ============================================================================
    # Add/remove/reorder providers here to change TTS selection behavior.
    # Each provider: (name, env_var, script_filename, check_fn)
    # ============================================================================
    PROVIDERS: List[tuple[str, str | None, str, Callable[[], bool]]] = [
        # ("ElevenLabs", "ELEVENLABS_API_KEY", "elevenlabs_tts.py", lambda: True),
        # ("OpenAI", "OPENAI_API_KEY", "openai_tts.py", lambda: True),
        ("Kokoro", None, "kokoro_tts.py", lambda: True),
        # ("pyttsx3", None, "pyttsx3_tts.py", lambda: True),
    ]

    for name, env_var, script_filename, check_fn in PROVIDERS:
        # Check environment variable if required
        if env_var and not os.getenv(env_var):
            continue

        # Run custom check if provided
        if not check_fn():
            continue

        # Check if script file exists
        script_path = tts_dir / script_filename
        if script_path.exists():
            return str(script_path)

    return None
