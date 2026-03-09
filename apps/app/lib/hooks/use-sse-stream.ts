import { atom } from "jotai";
import { useEffect, useState } from "react";

/**
 * Jotai atom holding the entry ID currently being streamed.
 * Set by EntryForm after successful create with note >= 50 chars.
 * Read by Timeline to activate streaming on the matching EntryCard.
 */
export const streamingEntryIdAtom = atom<string | null>(null);

export interface SseStreamState {
  streamedText: string;
  isStreaming: boolean;
  isComplete: boolean;
  hasCrisisContent: boolean;
  error: string | null;
}

const INITIAL_STATE: SseStreamState = {
  streamedText: "",
  isStreaming: false,
  isComplete: false,
  hasCrisisContent: false,
  error: null,
};

export function useSseStream(entryId: string | null): SseStreamState {
  const [state, setState] = useState<SseStreamState>(INITIAL_STATE);

  useEffect(() => {
    if (!entryId) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setState(INITIAL_STATE);
      return;
    }

    // Reset state for new stream
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setState({ ...INITIAL_STATE, isStreaming: true });

    const url = `/api/ai/stream/${encodeURIComponent(entryId)}`;
    const source = new EventSource(url, { withCredentials: true });

    // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener
    source.addEventListener("token", (event: MessageEvent) => {
      const data = JSON.parse(event.data) as { text: string };
      setState((prev) => ({
        ...prev,
        streamedText: prev.streamedText + data.text,
      }));
    });

    // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener
    source.addEventListener("done", (event: MessageEvent) => {
      const data = JSON.parse(event.data) as {
        response: string;
        hasCrisisContent: boolean;
      };
      setState({
        streamedText: data.response,
        isStreaming: false,
        isComplete: true,
        hasCrisisContent: data.hasCrisisContent,
        error: null,
      });
      source.close();
    });

    // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener
    source.addEventListener("error", (event: Event) => {
      // EventSource error can be a MessageEvent with data or a generic Event
      let message = "Failed to generate AI response";
      if ("data" in event && typeof (event as MessageEvent).data === "string") {
        try {
          const data = JSON.parse((event as MessageEvent).data) as {
            message: string;
          };
          message = data.message;
        } catch {
          // Use default message
        }
      }
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: message,
      }));
      source.close();
    });

    return () => {
      source.close();
    };
  }, [entryId]);

  return state;
}
