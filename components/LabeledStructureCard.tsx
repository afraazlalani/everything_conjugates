"use client";

import { Card, CardBody, Image } from "@heroui/react";

export function LabeledStructureCard({
  title,
  subtitle,
  src,
  note,
  className,
}: {
  title: string;
  subtitle?: string;
  src: string;
  note?: string;
  className?: string;
}) {
  return (
    <Card className={`bg-white/70 border border-white/80 ${className ?? ""}`.trim()}>
      <CardBody className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-base font-semibold text-zinc-900 font-[family-name:var(--font-space-grotesk)]">
            {title}
          </h4>
          {subtitle ? <p className="text-xs text-zinc-500">{subtitle}</p> : null}
        </div>

        <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-sm bg-white">
          <Image
            alt={title}
            src={src}
            className="h-64 w-full object-contain rotate-180"
            radius="sm"
          />

          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="absolute left-[5.5cm] bottom-7 rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
              Fc region
            </div>
            <div className="absolute right-[6.5cm] bottom-[2cm] rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
              Hinge region
            </div>
            <div className="absolute left-[5.5cm] top-[3.5rem] rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
              left Fab
            </div>
            <div className="absolute right-[6.5cm] top-[3.5rem] rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
              right Fab
            </div>

            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 320 320"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="label-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L8,4 L0,8 z" fill="#0F172A" />
                </marker>
              </defs>
              <path
                d="M94 276C120 262 136 248 150 228"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
                markerEnd="url(#label-arrow)"
              />
              <path
                d="M226 214C206 202 188 190 170 178"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
                markerEnd="url(#label-arrow)"
              />
              <path
                d="M14 98C70 102 104 108 116 112"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
                markerEnd="url(#label-arrow)"
              />
              <path
                d="M244 74C228 86 214 94 198 100"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
                markerEnd="url(#label-arrow)"
              />
            </svg>
          </div>
        </div>

        {note ? <p className="text-xs text-zinc-500">{note}</p> : null}
      </CardBody>
    </Card>
  );
}
