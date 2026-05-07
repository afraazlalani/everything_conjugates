"use client";

import { Link } from "@heroui/react";

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 no-underline">
      <div className="relative h-14 w-14 sm:h-16 sm:w-16">
        <div className="absolute inset-0 rounded-[1.35rem] border border-white/20 bg-gradient-to-br from-sky-400 via-cyan-300 to-indigo-400 shadow-[0_18px_36px_rgba(14,165,233,0.28)]" />
        <div className="absolute inset-[2px] rounded-[1.25rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
        <div className="absolute left-3 top-3 h-7 w-7 rounded-full border border-white/55 bg-white/12 sm:h-8 sm:w-8" />
        <div className="absolute right-3 top-4 h-2.5 w-2.5 rounded-full bg-white/80" />
        <div className="absolute bottom-3 left-4 h-2.5 w-2.5 rounded-full bg-white/80" />
        <div className="absolute bottom-4 right-4 h-2.5 w-2.5 rounded-full bg-white/80" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)] text-zinc-900">
          Everything
        </span>
        <span className="text-xs sm:text-sm uppercase tracking-[0.35em] text-sky-700">
          Conjugates
        </span>
      </div>
    </Link>
  );
}
