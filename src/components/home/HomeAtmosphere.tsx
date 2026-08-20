"use client";

/**
 * Solid brand atmosphere — depth via soft navy gradients only.
 * No frosted glass overlays competing with the cream store surface.
 */
export function HomeAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#071A33]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-5%,#0c2a4d_0%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_80%,rgba(200,164,93,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_0%_70%,rgba(15,118,84,0.1),transparent_45%)]" />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.1]"
        viewBox="0 0 1200 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx="980" cy="150" r="110" stroke="#c8a45d" strokeWidth="1.25" />
        <circle cx="980" cy="150" r="68" stroke="#f3efe6" strokeWidth="0.75" opacity="0.5" />
        <path
          d="M70 540 C200 390 300 370 420 430 C540 500 620 560 740 520 C880 470 960 390 1100 430"
          stroke="#c8a45d"
          strokeWidth="1.5"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}
