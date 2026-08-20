"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  ExternalLink,
  FileText,
  Play,
} from "lucide-react";
import { SlideVisual } from "./SlideVisuals";
import { PITCH_SLIDES, DEMO_LINKS, VISIBLE_SLIDE_COUNT } from "@/lib/presentation/content";
import type { SlideDefinition } from "@/lib/presentation/types";

function getVisibleSlides(showHidden: boolean): SlideDefinition[] {
  return PITCH_SLIDES.filter((s) => !s.hidden || showHidden);
}

export function PitchDeck() {
  const [index, setIndex] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const slides = getVisibleSlides(showHidden);
  const slide = slides[index];
  const notes = slide?.notes;
  const displayIndex = slide?.index ?? index + 1;
  const totalDisplay = showHidden ? slides.length : VISIBLE_SLIDE_COUNT;
  const progress = ((index + 1) / slides.length) * 100;

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => undefined);
          }
          setShowDemo(false);
          setShowNotes(false);
          break;
        case "f":
        case "F":
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => undefined);
          } else {
            document.documentElement.requestFullscreen().catch(() => undefined);
          }
          break;
        case "n":
        case "N":
          setShowNotes((v) => !v);
          break;
        case "d":
        case "D":
          setShowDemo((v) => !v);
          break;
        case "?":
          setShowHidden((v) => !v);
          setIndex(0);
          break;
        default:
          break;
      }
    };

    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));

    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [goNext, goPrev]);

  useEffect(() => {
    if (index >= slides.length) setIndex(Math.max(0, slides.length - 1));
  }, [slides.length, index]);

  if (!slide) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Progress */}
      <div className="absolute top-0 inset-x-0 z-50 h-0.5 bg-white/10">
        <motion.div
          className="h-full bg-[#C8A45D]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>

      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <Link
            href="/"
            className="text-white/60 hover:text-white text-xs font-medium transition-colors"
          >
            خياطك
          </Link>
          <span className="text-white/30 text-xs hidden sm:inline">|</span>
          <Link
            href="/presentation/speaker-notes"
            target="_blank"
            className="text-white/60 hover:text-[#C8A45D] text-xs flex items-center gap-1 transition-colors pointer-events-auto hidden sm:flex"
          >
            <FileText className="h-3 w-3" />
            Speaker Notes
          </Link>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="text-white/80 text-sm font-mono tabular-nums">
            {String(displayIndex).padStart(2, "0")} / {String(totalDisplay).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setShowDemo(true)}
            className="p-2 rounded-lg text-white/60 hover:text-[#C8A45D] hover:bg-white/10 transition-colors"
            aria-label="Live demo"
            title="Live Demo (D)"
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors hidden md:block"
            aria-label="Toggle notes"
            title="Speaker Notes (N)"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen();
            }}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fullscreen"
            title="Fullscreen (F)"
          >
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
          <Link
            href="/"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Exit"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Slide */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <SlideVisual slide={slide} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav buttons */}
      <div className="absolute bottom-6 inset-x-0 z-40 flex justify-center gap-4 pointer-events-none">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index >= slides.length - 1}
          className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Speaker notes panel */}
      <AnimatePresence>
        {showNotes && notes && (
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 inset-x-0 z-50 max-h-[40vh] overflow-y-auto bg-[#071A33]/95 backdrop-blur-md border-t border-[#C8A45D]/30 text-white p-6 md:p-8"
          >
            <p className="text-[#C8A45D] text-xs font-bold uppercase tracking-wider mb-3">
              Slide {String(displayIndex).padStart(2, "0")} — Speaker Notes
            </p>
            <p className="font-arabic text-lg font-medium mb-3">&quot;{notes.opening}&quot;</p>
            <ul className="space-y-2 text-sm text-white/80 font-arabic leading-relaxed mb-4">
              {notes.main.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
            {notes.transition && (
              <p className="text-sm text-[#C8A45D]/90 font-arabic border-t border-white/10 pt-3">
                → {notes.transition}
              </p>
            )}
            {notes.demoCue && (
              <p className="text-xs text-white/50 mt-2 font-mono">{notes.demoCue}</p>
            )}
            {notes.judgeTip && (
              <p className="text-xs text-amber-300/80 mt-2 font-arabic">💡 {notes.judgeTip}</p>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Live demo overlay */}
      <AnimatePresence>
        {showDemo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              onClick={() => setShowDemo(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-[15%] z-[70] md:w-full md:max-w-lg rounded-2xl border border-[#C8A45D]/30 bg-[#071A33] text-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div>
                  <p className="font-bold">Live Demo</p>
                  <p className="text-xs text-white/50 font-arabic">بدل ما أشرح — خلوني أوريكم</p>
                </div>
                <button type="button" onClick={() => setShowDemo(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {DEMO_LINKS.map((link) => (
                  <Link
                    key={link.href + link.step}
                    href={link.href}
                    target="_blank"
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors group"
                  >
                    <span className="text-[#C8A45D] font-bold text-sm w-6">{link.step}</span>
                    <span className="flex-1 text-sm font-arabic">{link.label_ar}</span>
                    <ExternalLink className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-white/10 text-xs text-white/40">
                Rule: never demo a feature that isn&apos;t working. Say: &quot;هذه ضمن المرحلة القادمة.&quot;
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Keyboard hints */}
      <div className="absolute bottom-2 end-4 z-30 text-[10px] text-white/25 hidden lg:block pointer-events-none">
        ← → Space · F fullscreen · N notes · D demo · ? Q&A
      </div>
    </div>
  );
}
