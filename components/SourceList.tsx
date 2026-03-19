"use client";

import { Card, CardBody, CardHeader, Divider, Link } from "@heroui/react";

export type SourceItem = {
  label: string;
  href: string;
  note?: string;
};

export function SourceList({
  title = "sources",
  items,
}: {
  title?: string;
  items: SourceItem[];
}) {
  return (
    <Card className="bg-white/70 border border-white/80">
      <CardHeader className="flex flex-col items-start gap-1">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
          {title}
        </p>
        <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
          evidence and references
        </h2>
      </CardHeader>
      <Divider />
      <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
        {items.map((item, index) => (
          <div key={item.href} className="flex items-start gap-3">
            <span className="mt-1 h-6 w-6 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-center">
              {index + 1}
            </span>
            <div className="flex flex-col gap-1">
              <Link href={item.href} className="text-sky-700">
                {item.label}
              </Link>
              {item.note ? <p className="text-xs text-zinc-500">{item.note}</p> : null}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
