#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

"""
Constants for Claude Code Hooks.
"""

import os
import re
from pathlib import Path

# Base directory for all logs
# Default is 'logs' in the current working directory
LOG_BASE_DIR = os.environ.get("CLAUDE_HOOKS_LOG_DIR", "logs")


def _sanitize_session_id(session_id: str) -> str:
    """Sanitize session_id to prevent path traversal attacks."""
    return re.sub(r"[^a-zA-Z0-9_\-]", "_", session_id)


def get_session_log_dir(session_id: str) -> Path:
    """
    Get the log directory for a specific session.

    Args:
        session_id: The Claude session ID

    Returns:
        Path object for the session's log directory
    """
    return Path(LOG_BASE_DIR) / _sanitize_session_id(session_id)

def ensure_session_log_dir(session_id: str) -> Path:
    """
    Ensure the log directory for a session exists.

    Args:
        session_id: The Claude session ID

    Returns:
        Path object for the session's log directory
    """
    log_dir = get_session_log_dir(session_id)
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir