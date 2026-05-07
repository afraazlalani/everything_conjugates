"use client";

import { Link } from "@heroui/react";

const tabs = [
  { key: "mab", label: "mAb page", href: "/oligo/mab" },
  { key: "linker", label: "Linker page", href: "/oligo/linker" },
  { key: "oligo", label: "Oligo page", href: "/oligo/oligo" },
];

export function OligoSectionTabs({
  active,
}: {
  active?: "mab" | "linker" | "oligo";
}) {
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
