"use client";

import { Card, CardBody, CardHeader, Divider, Link } from "@heroui/react";

export type SourceItem = {
  id?: number;
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
    <Card className="site-panel">
      <CardHeader className="flex flex-col items-start gap-1">
        <p className="site-eyebrow">
          {title}
        </p>
        <h2 className="site-section-heading text-2xl font-semibold">
          evidence and references
        </h2>
      </CardHeader>
      <Divider className="site-divider" />
      <CardBody className="flex flex-col gap-3 text-sm text-slate-700">
        {items.map((item, index) => (
          <div key={item.href} id={item.id ? `ref-${item.id}` : undefined} className="flex items-start gap-3">
            <span className="site-number-badge mt-1">
              {index + 1}
            </span>
            <div className="flex flex-col gap-1">
              <Link href={item.href} className="site-link">
                {item.label}
              </Link>
              {item.note ? <p className="site-panel-subtitle text-xs">{item.note}</p> : null}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
