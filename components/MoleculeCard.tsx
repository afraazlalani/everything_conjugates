"use client";

import { Card, CardBody } from "@heroui/react";

export function MoleculeCard({
  label,
  variant,
}: {
  label: string;
  variant: "antibody" | "peptide" | "ligand" | "linker" | "payload" | "oligo" | "enzyme" | "radionuclide";
}) {
  return (
    <Card className="bg-white/70 border border-white/80">
      <CardBody className="flex flex-col items-center gap-3">
        <svg
          className="h-28 w-28"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
        >
          {variant === "antibody" ? (
            <g fill="none" stroke="#111827" strokeLinecap="round" strokeLinejoin="round">
              <g strokeWidth="2.8">
                <path d="M60 42V96" />
                <path d="M60 42L41 23" />
                <path d="M60 42L79 23" />
                <path d="M56 46L47 79" />
                <path d="M64 46L73 79" />
              </g>
              <g fill="#ffffff" strokeWidth="2.2">
                <ellipse cx="37" cy="20" rx="7.5" ry="17" transform="rotate(-20 37 20)" />
                <ellipse cx="49" cy="31" rx="7.5" ry="17" transform="rotate(-12 49 31)" />
                <ellipse cx="45" cy="63" rx="8" ry="19" transform="rotate(-12 45 63)" />
                <ellipse cx="75" cy="63" rx="8" ry="19" transform="rotate(12 75 63)" />
                <ellipse cx="71" cy="31" rx="7.5" ry="17" transform="rotate(12 71 31)" />
                <ellipse cx="83" cy="20" rx="7.5" ry="17" transform="rotate(20 83 20)" />
                <ellipse cx="60" cy="62" rx="8.5" ry="19" />
                <ellipse cx="60" cy="92" rx="8.5" ry="20" />
              </g>
              <g strokeWidth="1.8">
                <line x1="56" y1="45" x2="64" y2="45" />
                <line x1="56" y1="58" x2="64" y2="58" />
                <line x1="56" y1="84" x2="64" y2="84" />
              </g>
            </g>
          ) : null}
          {variant === "peptide" ? (
            <g stroke="#6366f1" strokeWidth="3" strokeLinecap="round">
              <path d="M20 60h24l16-20 16 24 24-12" />
              <circle cx="20" cy="60" r="4" fill="#6366f1" />
              <circle cx="100" cy="52" r="4" fill="#6366f1" />
            </g>
          ) : null}
          {variant === "ligand" ? (
            <g stroke="#0ea5e9" strokeWidth="3">
              <circle cx="60" cy="60" r="26" />
              <circle cx="60" cy="60" r="8" fill="#0ea5e9" />
              <path d="M60 34v-10" />
              <path d="M60 96v-10" />
            </g>
          ) : null}
          {variant === "linker" ? (
            <g stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 60h20l10-12 10 24 10-12h20" />
              <circle cx="20" cy="60" r="4" fill="#0f172a" />
              <circle cx="100" cy="60" r="4" fill="#0f172a" />
            </g>
          ) : null}
          {variant === "payload" ? (
            <g stroke="#ef4444" strokeWidth="2.5">
              <polygon points="60,20 88,40 88,80 60,100 32,80 32,40" />
              <circle cx="60" cy="60" r="10" fill="#ef4444" />
            </g>
          ) : null}
          {variant === "oligo" ? (
            <g stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 30c20 20 40 20 60 40" />
              <path d="M20 90c20-20 40-20 60-40" />
              <circle cx="80" cy="70" r="4" fill="#10b981" />
              <circle cx="80" cy="50" r="4" fill="#10b981" />
            </g>
          ) : null}
          {variant === "enzyme" ? (
            <g stroke="#f97316" strokeWidth="2.5">
              <circle cx="60" cy="60" r="26" />
              <path d="M60 34v52" />
              <path d="M34 60h52" />
              <circle cx="60" cy="60" r="6" fill="#f97316" />
            </g>
          ) : null}
          {variant === "radionuclide" ? (
            <g stroke="#8b5cf6" strokeWidth="2.5">
              <circle cx="60" cy="60" r="28" />
              <circle cx="60" cy="60" r="6" fill="#8b5cf6" />
              <path d="M60 18v14" />
              <path d="M60 88v14" />
              <path d="M18 60h14" />
              <path d="M88 60h14" />
            </g>
          ) : null}
        </svg>
        <span className="text-sm text-zinc-600">{label}</span>
      </CardBody>
    </Card>
  );
}
