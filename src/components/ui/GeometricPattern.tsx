"use client";

export function GeometricPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id="omani-geo" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <path
            d="M24 4 L44 24 L24 44 L4 24 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.15"
          />
          <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.08" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#omani-geo)" />
    </svg>
  );
}
