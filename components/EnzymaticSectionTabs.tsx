"use client";

import { Link } from "@heroui/react";

const mainTabs = [
  { key: "overview", label: "Overview page", href: "/chemistry/enzymatic" },
];

const methodTabs = [
  {
    key: "transglutaminase",
    label: "Transglutaminase",
    href: "/chemistry/enzymatic/transglutaminase",
  },
  { key: "sortase", label: "Sortase A", href: "/chemistry/enzymatic/sortase" },
  {
    key: "glycan-remodeling",
    label: "Glycan remodeling",
    href: "/chemistry/enzymatic/glycan-remodeling",
  },
  {
    key: "glycoconnect",
    label: "GlycoConnect",
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
  return `section-tab ${isActive ? "section-tab-active" : ""}`.trim();
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
