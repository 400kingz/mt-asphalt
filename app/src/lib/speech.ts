/* ============================================================
   MT ASPHALT — Speech to text

   Uses the browser's built-in Web Speech API rather than uploading
   audio to a transcription service. Reasons that matter here:

     · Free. No per-minute cost, no second API key.
     · Fast. Transcribes as Michael speaks, no upload round trip.
     · Works on the S22 Ultra. Chrome on Android supports it natively.
     · Nothing is recorded or stored anywhere.

   Safari and Firefox support is patchy, so isSpeechSupported() gates
   the mic button — the typed input always works regardless.
   ============================================================ */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const isSpeechSupported = (): boolean => getCtor() !== null;

export interface DictationHandlers {
  /** Fires continuously as speech is recognised — interim plus settled text. */
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

export interface Dictation {
  stop: () => void;
}

const FRIENDLY_ERRORS: Record<string, string> = {
  "not-allowed":
    "Microphone blocked. Allow mic access for this site in your browser settings, then tap the mic again.",
  "service-not-allowed":
    "Microphone blocked by the browser. Check site permissions and try again.",
  "no-speech": "Didn't catch that — tap the mic and try again.",
  network: "Speech recognition needs a connection. You can type instead.",
  aborted: "",
};

/**
 * Start dictating. Returns a handle whose stop() ends the session.
 * Accumulates finalised phrases so a long description isn't lost when the
 * recogniser segments mid-sentence.
 */
export function startDictation(handlers: DictationHandlers): Dictation | null {
  const Ctor = getCtor();
  if (!Ctor) {
    handlers.onError?.("This browser can't do speech input. Chrome on Android or desktop works.");
    return null;
  }

  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let settled = "";
  let stopped = false;

  rec.onstart = () => handlers.onStart?.();

  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const chunk = result[0]?.transcript ?? "";
      if (result.isFinal) settled += chunk;
      else interim += chunk;
    }
    const combined = (settled + interim).replace(/\s+/g, " ").trim();
    handlers.onTranscript(combined, interim === "" && settled !== "");
  };

  rec.onerror = (event) => {
    const msg = FRIENDLY_ERRORS[event.error] ?? `Speech error: ${event.error}`;
    if (msg) handlers.onError?.(msg);
  };

  rec.onend = () => {
    // Chrome ends the session on a pause. Restart unless the user stopped it,
    // so Michael can think mid-sentence without losing the mic.
    if (!stopped) {
      try {
        rec.start();
        return;
      } catch {
        /* fall through to ending */
      }
    }
    handlers.onEnd?.();
  };

  try {
    rec.start();
  } catch {
    handlers.onError?.("Could not start the microphone.");
    return null;
  }

  return {
    stop: () => {
      stopped = true;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}
