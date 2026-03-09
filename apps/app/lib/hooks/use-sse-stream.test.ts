import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSseStream } from "./use-sse-stream";

type EventHandler = (event: MessageEvent | Event) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  withCredentials: boolean;
  listeners: Record<string, EventHandler[]> = {};
  closed = false;

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = options?.withCredentials ?? false;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, handler: EventHandler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  close() {
    this.closed = true;
  }

  // Test helper: simulate an event
  emit(event: string, data?: unknown) {
    const handlers = this.listeners[event] ?? [];
    const messageEvent =
      data !== undefined
        ? new MessageEvent(event, { data: JSON.stringify(data) })
        : new Event(event);
    for (const handler of handlers) {
      handler(messageEvent);
    }
  }
}

beforeEach(() => {
  MockEventSource.instances = [];
  vi.stubGlobal("EventSource", MockEventSource);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSseStream", () => {
  it("returns initial state when entryId is null", () => {
    const { result } = renderHook(() => useSseStream(null));

    expect(result.current.streamedText).toBe("");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.hasCrisisContent).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("creates EventSource with correct URL when entryId is provided", () => {
    renderHook(() => useSseStream("jrn_abc123"));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe("/api/ai/stream/jrn_abc123");
    expect(MockEventSource.instances[0].withCredentials).toBe(true);
  });

  it("sets isStreaming to true when entryId is provided", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));

    expect(result.current.isStreaming).toBe(true);
  });

  it("accumulates text from token events", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    act(() => {
      source.emit("token", { text: "Hello " });
    });
    expect(result.current.streamedText).toBe("Hello ");

    act(() => {
      source.emit("token", { text: "world" });
    });
    expect(result.current.streamedText).toBe("Hello world");
  });

  it("handles done event correctly", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    act(() => {
      source.emit("done", {
        response: "Full response",
        hasCrisisContent: false,
      });
    });

    expect(result.current.streamedText).toBe("Full response");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.hasCrisisContent).toBe(false);
    expect(source.closed).toBe(true);
  });

  it("sets hasCrisisContent from done event", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    act(() => {
      source.emit("done", {
        response: "Crisis response",
        hasCrisisContent: true,
      });
    });

    expect(result.current.hasCrisisContent).toBe(true);
  });

  it("handles error event", () => {
    const { result } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    act(() => {
      source.emit("error", { message: "Rate limit exceeded" });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBe("Rate limit exceeded");
    expect(source.closed).toBe(true);
  });

  it("closes EventSource on unmount", () => {
    const { unmount } = renderHook(() => useSseStream("jrn_abc123"));
    const source = MockEventSource.instances[0];

    expect(source.closed).toBe(false);
    unmount();
    expect(source.closed).toBe(true);
  });

  it("resets state and creates new EventSource when entryId changes", () => {
    const { result, rerender } = renderHook(
      ({ entryId }: { entryId: string | null }) => useSseStream(entryId),
      { initialProps: { entryId: "jrn_1" } },
    );

    const firstSource = MockEventSource.instances[0];
    act(() => {
      firstSource.emit("token", { text: "partial" });
    });
    expect(result.current.streamedText).toBe("partial");

    rerender({ entryId: "jrn_2" });

    expect(firstSource.closed).toBe(true);
    expect(MockEventSource.instances).toHaveLength(2);
    expect(result.current.streamedText).toBe("");
    expect(result.current.isStreaming).toBe(true);
  });

  it("does not create EventSource when entryId changes to null", () => {
    const { result, rerender } = renderHook(
      ({ entryId }: { entryId: string | null }) => useSseStream(entryId),
      { initialProps: { entryId: "jrn_1" as string | null } },
    );

    rerender({ entryId: null });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamedText).toBe("");
  });
});
