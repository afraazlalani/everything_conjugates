"use client";

import { Link } from "@heroui/react";

const tabs = [
  { key: "overview", label: "Overview", href: "/pdcs" },
  { key: "peptide", label: "Peptides", href: "/pdcs/peptide" },
  { key: "linker", label: "Linker", href: "/pdcs/linker" },
  { key: "payload", label: "Payload", href: "/pdcs/payload" },
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
            className={`section-tab ${isActive ? "section-tab-active" : ""}`.trim()}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
