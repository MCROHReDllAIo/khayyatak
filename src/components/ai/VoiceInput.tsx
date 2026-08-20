"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

const DEMO_PHRASES = [
  "أبغى دشداشة بيضاء رسمية صيفية",
  "أبغى عباية سوداء أنيقة",
  "أريد تطريز ذهبي بسيط",
  "خلّيه أنحف وصيفي",
];

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  className?: string;
}

export function VoiceInput({ onTranscript, onListeningChange, className }: VoiceInputProps) {
  const { t } = useLocale();
  const [listening, setListening] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const recognitionRef = useRef<{
    stop: () => void;
    abort: () => void;
  } | null>(null);

  const setListeningState = useCallback(
    (value: boolean) => {
      setListening(value);
      onListeningChange?.(value);
    },
    [onListeningChange]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListeningState(false);
  }, [setListeningState]);

  const applyTranscript = useCallback(
    (text: string, isDemo = false) => {
      setDemoMode(isDemo);
      setListeningState(false);
      setShowDemoMenu(false);
      onTranscript(text);
    },
    [onTranscript, setListeningState]
  );

  const startListening = () => {
    if (listening) {
      stopListening();
      return;
    }

    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };

    type SpeechRecognitionInstance = {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      start: () => void;
      stop: () => void;
      abort: () => void;
      onresult: ((event: { results: Array<{ 0: { transcript: string } }> }) => void) | null;
      onerror: ((event: { error: string }) => void) | null;
      onend: (() => void) | null;
    };

    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setDemoMode(true);
      setShowDemoMenu(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ar-SA";
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript?.trim();
        if (text) applyTranscript(text, false);
      };

      recognition.onerror = (event) => {
        setListeningState(false);
        if (event.error === "not-allowed") {
          setDemoMode(true);
          setShowDemoMenu(true);
        } else if (event.error !== "aborted") {
          applyTranscript(DEMO_PHRASES[0], true);
        }
      };

      recognition.onend = () => setListeningState(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListeningState(true);
      setDemoMode(false);
    } catch {
      setDemoMode(true);
      setShowDemoMenu(true);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant={listening ? "default" : "outline"}
        size="sm"
        className={cn("gap-2", className)}
        onClick={startListening}
        aria-pressed={listening}
      >
        {listening ? (
          <>
            <MicOff className="h-4 w-4 animate-pulse" />
            {t("إيقاف", "Stop")}
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            {t("صوت", "Voice")}
          </>
        )}
        {demoMode && !listening && (
          <span className="text-[10px] opacity-70">Demo</span>
        )}
      </Button>

      {showDemoMenu && (
        <div className="absolute bottom-full mb-2 start-0 z-50 min-w-[240px] rounded-xl border bg-white shadow-lg p-2 space-y-1">
          <p className="text-[10px] text-muted-foreground px-2 py-1">
            {t("Demo Voice — اختر عبارة", "Demo Voice — pick a phrase")}
          </p>
          {DEMO_PHRASES.map((phrase) => (
            <button
              key={phrase}
              type="button"
              className="w-full text-start text-sm rounded-lg px-3 py-2 hover:bg-muted/60 transition-colors"
              onClick={() => applyTranscript(phrase, true)}
            >
              {phrase}
            </button>
          ))}
          <button
            type="button"
            className="w-full text-xs text-muted-foreground py-1 flex items-center justify-center gap-1"
            onClick={() => setShowDemoMenu(false)}
          >
            <ChevronDown className="h-3 w-3" />
            {t("إغلاق", "Close")}
          </button>
        </div>
      )}
    </div>
  );
}
