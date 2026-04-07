"use client";

import { Link } from "@heroui/react";

const tabs = [
  { key: "overview", label: "overview", href: "/pdcs" },
  { key: "peptide", label: "peptides", href: "/pdcs/peptide" },
  { key: "linker", label: "linker", href: "/pdcs/linker" },
  { key: "payload", label: "payload", href: "/pdcs/payload" },
];

type PdcTabKey = "overview" | "peptide" | "linker" | "payload";

export function PdcSectionTabs({ active }: { active?: PdcTabKey }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-full border px-6 py-3 text-lg font-medium transition ${
              isActive
                ? "border-sky-600 bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.22)]"
                : "border-sky-200 bg-white/70 text-sky-700 hover:border-sky-300 hover:bg-white"
            }`.trim()}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
