"use client";

import { Link } from "@heroui/react";

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 no-underline">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-[1.35rem] border border-white/20 bg-gradient-to-br from-sky-400 via-cyan-300 to-indigo-400 shadow-[0_18px_36px_rgba(14,165,233,0.28)]" />
        <div className="absolute inset-[2px] rounded-[1.25rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
        <div className="absolute left-4 top-4 h-10 w-10 rounded-full border border-white/55 bg-white/12" />
        <div className="absolute right-4 top-5 h-3 w-3 rounded-full bg-white/80" />
        <div className="absolute left-5 bottom-4 h-3 w-3 rounded-full bg-white/80" />
        <div className="absolute right-5 bottom-5 h-3 w-3 rounded-full bg-white/80" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-3xl sm:text-4xl font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)] text-zinc-900">
          Everything
        </span>
        <span className="text-sm sm:text-base uppercase tracking-[0.35em] text-sky-700">
          Conjugates
        </span>
      </div>
    </Link>
  );
}
