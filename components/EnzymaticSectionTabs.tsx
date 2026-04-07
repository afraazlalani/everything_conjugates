"use client";

import { Link } from "@heroui/react";

const mainTabs = [
  { key: "overview", label: "overview page", href: "/chemistry/enzymatic" },
];

const methodTabs = [
  {
    key: "transglutaminase",
    label: "transglutaminase",
    href: "/chemistry/enzymatic/transglutaminase",
  },
  { key: "sortase", label: "sortase a", href: "/chemistry/enzymatic/sortase" },
  {
    key: "glycan-remodeling",
    label: "glycan remodeling",
    href: "/chemistry/enzymatic/glycan-remodeling",
  },
  {
    key: "glycoconnect",
    label: "glycoconnect",
    href: "/chemistry/enzymatic/glycoconnect",
  },
];

type EnzymaticTabKey =
  | "overview"
  | "transglutaminase"
  | "sortase"
  | "glycan-remodeling"
  | "glycoconnect";

function pillClass(isActive: boolean) {
  return `rounded-full border px-6 py-3 text-lg font-medium transition ${
    isActive
      ? "border-sky-600 bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.22)]"
      : "border-sky-200 bg-white/70 text-sky-700 hover:border-sky-300 hover:bg-white"
  }`.trim();
}

export function EnzymaticSectionTabs({ active }: { active?: EnzymaticTabKey }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        {mainTabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={pillClass(active === tab.key)}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {methodTabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={pillClass(active === tab.key)}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
