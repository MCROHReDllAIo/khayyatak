"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { BRAND_LOGO_SRC } from "./BrandLogo";
import { BRAND } from "@/lib/constants/brand";

const SESSION_KEY = "kytk_splash_seen_v1";
const MIN_MS = 2200;
const MAX_MS = 3200;

/**
 * Full-viewport brand loading screen — logo is the hero.
 * Shows once per browser tab session.
 */
export function BrandSplash({ force }: { force?: boolean }) {
  const reduced = Boolean(useReducedMotion());
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (!force && sessionStorage.getItem(SESSION_KEY) === "1") {
        setReady(true);
        return;
      }
    } catch {
      /* ignore */
    }
    setVisible(true);
    setReady(true);

    const start = Date.now();
    const finish = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_MS - elapsed);
      window.setTimeout(() => {
        setVisible(false);
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
      }, wait);
    };

    // Prefer waiting for fonts + first paint; cap at MAX_MS
    const maxTimer = window.setTimeout(finish, MAX_MS);
    if (document.readyState === "complete") {
      window.clearTimeout(maxTimer);
      finish();
    } else {
      window.addEventListener(
        "load",
        () => {
          window.clearTimeout(maxTimer);
          finish();
        },
        { once: true }
      );
    }

    return () => window.clearTimeout(maxTimer);
  }, [force]);

  if (!ready) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="brand-splash"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ backgroundColor: "#f3efe6" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          aria-busy="true"
          aria-label={`${BRAND.nameAr} loading`}
        >
          {/* Soft atmosphere */}
          {!reduced && (
            <>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute h-[42vmin] w-[42vmin] rounded-full bg-[#071A33]/[0.04] blur-3xl"
                animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute h-[28vmin] w-[28vmin] translate-y-8 rounded-full bg-[#C8A45D]/10 blur-3xl"
                animate={{ scale: [1.05, 0.95, 1.05] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}

          <div className="relative flex flex-col items-center px-6">
            {/* Logo stage */}
            <motion.div
              className="relative"
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.82, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Glow ring behind logo */}
              {!reduced && (
                <motion.div
                  aria-hidden
                  className="absolute inset-[-12%] rounded-full border border-[#071A33]/10"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: [0, 0.7, 0.35], scale: 1 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
              )}

              <motion.div
                animate={reduced ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src={BRAND_LOGO_SRC}
                  alt={BRAND.nameAr}
                  width={220}
                  height={220}
                  priority
                  className="relative h-[min(42vw,200px)] w-[min(42vw,200px)] object-contain drop-shadow-[0_18px_40px_rgba(7,26,51,0.12)]"
                />
              </motion.div>

              {/* Sew / stitch shimmer across logo */}
              {!reduced && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                >
                  <motion.div
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    initial={{ x: "-140%", opacity: 0 }}
                    animate={{ x: ["-140%", "160%"], opacity: [0, 0.85, 0] }}
                    transition={{ duration: 1.6, delay: 0.55, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </motion.div>

            {/* Brand wordmark under (reinforces logo) */}
            <motion.p
              className="mt-6 text-[11px] uppercase tracking-[0.42em] text-[#071A33]/45"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.45 }}
            >
              k y t k
            </motion.p>

            {/* Progress stitch line */}
            <div className="mt-8 h-[2px] w-36 overflow-hidden rounded-full bg-[#071A33]/10">
              <motion.div
                className="h-full origin-right rounded-full bg-[#071A33]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduced ? 0.4 : 1.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <motion.p
              className="mt-4 text-xs text-[#071A33]/40 font-arabic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {BRAND.taglineAr}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
