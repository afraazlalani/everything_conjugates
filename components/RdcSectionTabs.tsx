"use client";

import { Link } from "@heroui/react";

const tabs = [
  { key: "overview", label: "Overview", href: "/rdcs" },
  { key: "ligand", label: "Ligand", href: "/rdcs/ligand" },
  { key: "chelator", label: "Chelator", href: "/rdcs/chelator" },
  { key: "radionuclide", label: "Radionuclide", href: "/rdcs/radionuclide" },
];

type RdcTabKey = "overview" | "ligand" | "chelator" | "radionuclide";

export function RdcSectionTabs({ active }: { active?: RdcTabKey }) {
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
