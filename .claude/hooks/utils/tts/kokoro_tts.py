#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "openai",
#     "pyaudio",
# ]
# ///

import sys
import random
import time


def main():
    """
    Kokoro TTS Script

    Uses Kokoro FastAPI for high-quality text-to-speech synthesis.
    Accepts optional text prompt as command-line argument.

    Usage:
    - ./kokoro_tts.py                    # Uses default text
    - ./kokoro_tts.py "Your custom text" # Uses provided text

    Features:
    - Local TTS (requires Kokoro FastAPI server running)
    - High-quality voice synthesis
    - Streaming audio playback
    - Multiple voice options

    Prerequisites:
    - Start Kokoro FastAPI: docker run -d -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
    """

    try:
        from openai import OpenAI
        import pyaudio

        # Initialize Kokoro client (OpenAI-compatible API)
        client = OpenAI(
            base_url="http://localhost:8880/v1",
            api_key="not-needed"
        )

        print("🎙️  Kokoro TTS")
        print("=" * 20)

        # Get text from command line argument or use default
        if len(sys.argv) > 1:
            text = " ".join(sys.argv[1:])  # Join all arguments as text
        else:
            # Default completion messages
            completion_messages = [
                "Work complete!",
                "All done!",
                "Task finished!",
                "Job complete!",
                "Ready for next task!"
            ]
            text = random.choice(completion_messages)

        print(f"🎯 Text: {text}")
        print("🔊 Speaking...")

        # Set up audio player for PCM streaming
        pya = pyaudio.PyAudio()
        player = pya.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=24000,
            output=True,
            frames_per_buffer=1024
        )

        # Stream audio directly to speakers
        with client.audio.speech.with_streaming_response.create(
            model="kokoro",
            voice="af_heart",  # American female voice
            response_format="pcm",
            input=text
        ) as response:
            for chunk in response.iter_bytes(chunk_size=1024):
                if len(chunk) > 0:
                    player.write(chunk)

        # Drain buffer to prevent weird sounds at the end
        time.sleep(0.1)
        player.stop_stream()
        player.close()
        pya.terminate()

        print("✅ Playback complete!")

    except ImportError as e:
        print("❌ Error: Required package not installed")
        print("This script uses UV to auto-install dependencies.")
        print(f"Missing: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure Kokoro FastAPI server is running:")
        print("  docker run -d -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest")
        sys.exit(1)


if __name__ == "__main__":
    main()
