"use client";

import { Link } from "@heroui/react";

const tabs = [
  { key: "targeting", label: "Targeting page", href: "/enzymes/targeting" },
  { key: "enzyme", label: "Enzyme page", href: "/enzymes/enzyme" },
  { key: "prodrug", label: "Prodrug page", href: "/enzymes/prodrug" },
];

type EnzymeTabKey = "targeting" | "enzyme" | "prodrug";

export function EnzymeSectionTabs({ active }: { active?: EnzymeTabKey }) {
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
