"use client";

import { Link } from "@heroui/react";

const tabs = [
  { key: "overview", label: "Overview", href: "/pdcs/peptide" },
  { key: "non-cyclic", label: "Non-cyclic peptides", href: "/pdcs/peptide/non-cyclic" },
  { key: "cyclic", label: "Cyclic peptides", href: "/pdcs/peptide/cyclic" },
];

type PdcPeptideTabKey = "overview" | "non-cyclic" | "cyclic";

export function PdcPeptideTabs({ active }: { active?: PdcPeptideTabKey }) {
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
