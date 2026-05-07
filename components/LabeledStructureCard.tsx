"use client";

import Image from "next/image";
import { Card, CardBody } from "@heroui/react";
import { ZoomableFigure } from "@/components/ZoomableFigure";

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
    <Card className={`site-panel ${className ?? ""}`.trim()}>
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="site-panel-title text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
            {title}
          </h4>
          {subtitle ? <p className="site-panel-subtitle text-sm font-medium">{subtitle}</p> : null}
        </div>

        <ZoomableFigure label={title}>
          <div className="zoom-frame overflow-hidden rounded-[1.5rem] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-8">
            <Image
              alt={title}
              src={src}
              width={1200}
              height={900}
              className="zoom-graphic mx-auto h-auto max-h-[28rem] w-full object-contain rotate-180"
            />
          </div>
        </ZoomableFigure>

        {note ? <p className="site-panel-note text-sm leading-6">{note}</p> : null}
      </CardBody>
    </Card>
  );
}
