"use client";

import { Link } from "@heroui/react";

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 no-underline">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-400 to-indigo-500 shadow-[0_10px_24px_rgba(56,189,248,0.45)]" />
        <div className="absolute left-4 top-4 h-10 w-10 rounded-full border border-white/70 bg-white/15" />
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
