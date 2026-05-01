import type {
  ChatStreamEvent,
  ChatStreamEventName,
  ChatStreamEventPayloadMap,
} from '../../types/page-data';

const CHAT_STREAM_EVENT_NAMES = new Set<string>([
  'intent_analysis',
  'pending_confirmation',
  'execution_result',
  'error',
  'done',
]);

function isChatStreamEventName(event: string): event is ChatStreamEventName {
  return CHAT_STREAM_EVENT_NAMES.has(event);
}

function parseEventData(rawData: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(rawData);
    return parsed && typeof parsed === 'object'
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function createChatSseParser() {
  let buffer = '';
  let currentEvent = '';
  let currentDataLines: string[] = [];

  function emit(events: ChatStreamEvent[]) {
    if (currentDataLines.length === 0) return;
    const data = parseEventData(currentDataLines.join('\n'));
    if (data && isChatStreamEventName(currentEvent)) {
      events.push({
        event: currentEvent,
        data: data as ChatStreamEventPayloadMap[typeof currentEvent],
      } as ChatStreamEvent);
    }
    currentEvent = '';
    currentDataLines = [];
  }

  function processLine(rawLine: string, events: ChatStreamEvent[]) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (line === '') {
      emit(events);
      return;
    }
    if (line.startsWith('event:')) {
      currentEvent = line.slice(6).trim();
      return;
    }
    if (line.startsWith('data:')) {
      currentDataLines.push(line.slice(5).replace(/^ /, ''));
    }
  }

  return {
    push(chunk: string) {
      const events: ChatStreamEvent[] = [];
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        processLine(line, events);
      }
      return events;
    },
    flush() {
      const events: ChatStreamEvent[] = [];
      if (buffer) {
        processLine(buffer, events);
        buffer = '';
      }
      emit(events);
      return events;
    },
  };
}

export async function readChatEventStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ChatStreamEvent) => void,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parser = createChatSseParser();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const events = parser.push(decoder.decode(value, { stream: true }));
      events.forEach(onEvent);
    }

    const remainingEvents = parser.push(decoder.decode());
    remainingEvents.forEach(onEvent);
    parser.flush().forEach(onEvent);
  } finally {
    reader.releaseLock();
  }
}
