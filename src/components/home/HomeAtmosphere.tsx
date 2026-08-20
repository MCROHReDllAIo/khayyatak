"use client";

import { motion } from "framer-motion";

/**
 * Subtle full-bleed glass/depth backdrop.
 * Inspired by brand curves (round mark, soft garment flow) — not a literal logo copy.
 * Intentionally quiet so stores remain the primary focus.
 */
export function HomeAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Deep navy base */}
      <div className="absolute inset-0 bg-[#050d18]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(28,58,96,0.55),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_80%,rgba(200,164,93,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_10%_60%,rgba(15,118,84,0.07),transparent_45%)]" />

      {/* Soft drifting glass orbs */}
      <motion.div
        className="absolute -top-[12%] start-[8%] h-[42vmin] w-[42vmin] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(243,239,230,0.14), rgba(243,239,230,0.03) 45%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 18, 0], y: [0, 12, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[28%] end-[-8%] h-[48vmin] w-[48vmin] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(200,164,93,0.12), rgba(200,164,93,0.02) 50%, transparent 72%)",
          filter: "blur(48px)",
        }}
        animate={{ x: [0, -14, 0], y: [0, 20, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] start-[20%] h-[36vmin] w-[36vmin] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(120,170,210,0.1), transparent 65%)",
          filter: "blur(36px)",
        }}
        animate={{ x: [0, 10, 0], y: [0, -16, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Abstract glass forms — soft garment/mark curves */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        viewBox="0 0 1200 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ha-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3efe6" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#c8a45d" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#7eb8d4" stopOpacity="0.08" />
          </linearGradient>
          <filter id="ha-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        {/* Soft circular mark echo */}
        <circle
          cx="980"
          cy="160"
          r="120"
          stroke="url(#ha-glass)"
          strokeWidth="1.5"
          filter="url(#ha-soft)"
        />
        <circle
          cx="980"
          cy="160"
          r="72"
          stroke="rgba(243,239,230,0.2)"
          strokeWidth="1"
        />
        {/* Flowing silhouette curve — abstracted garment line */}
        <path
          d="M80 520 C180 380 280 360 380 420 C500 500 560 560 680 520 C820 470 900 380 1040 420"
          stroke="url(#ha-glass)"
          strokeWidth="2"
          filter="url(#ha-soft)"
          opacity="0.7"
        />
        <path
          d="M140 640 C260 560 340 540 460 580 C600 630 700 700 860 640"
          stroke="rgba(200,164,93,0.18)"
          strokeWidth="1.25"
          filter="url(#ha-soft)"
        />
      </svg>

      {/* Fine grain — very light */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Soft vignette so edges feel finished, not empty */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,13,24,0.45)_100%)]" />
    </div>
  );
}
