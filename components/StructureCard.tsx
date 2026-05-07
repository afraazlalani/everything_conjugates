"use client";

import type { ReactNode } from "react";
import { Card, CardBody, Chip, Image } from "@heroui/react";
import { PubChemFacts } from "@/components/PubChemFacts";
import { SmilesStructure } from "@/components/SmilesStructure";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const PUBCHEM_CID_MAP: Record<string, string> = {
  "11542188": "monomethyl auristatin E",
  "11343137": "mertansine",
  "104842": "SN-38",
  "125175": "SMCC",
  "9921644": "L-Valyl-L-citrulline",
  "9561072": "benzaldehyde hydrazone",
  "95116": "dipropyl disulfide",
  "60961": "adenosine",
  "6029": "uridine",
  "471573": "Arg-Glu-Asp",
  "6037": "folic acid",
  "11359": "DOTA",
};

function resolvePubchemName(src?: string) {
  if (!src || !src.includes("pubchem.ncbi.nlm.nih.gov")) return null;
  const nameMatch = src.match(/compound\/name\/([^/]+)/i);
  if (nameMatch?.[1]) {
    return decodeURIComponent(nameMatch[1]).replace(/\+/g, " ");
  }
  const cidMatch = src.match(/CID\/(\d+)/i);
  if (cidMatch?.[1] && PUBCHEM_CID_MAP[cidMatch[1]]) {
    return PUBCHEM_CID_MAP[cidMatch[1]];
  }
  return null;
}

export function StructureCard({
  title,
  subtitle,
  src,
  smiles,
  smilesName,
  pubchemQuery,
  formulaDisplay,
  note,
  category,
  className,
}: {
  title: string;
  subtitle?: string;
  src?: string;
  smiles?: string;
  smilesName?: string;
  pubchemQuery?: string;
  formulaDisplay?: ReactNode;
  note?: string;
  category?: "payload" | "linker";
  className?: string;
}) {
  const resolvedName = smilesName ?? resolvePubchemName(src);
  const factsQuery = pubchemQuery ?? resolvedName ?? null;
  const shouldRenderSmiles = Boolean(resolvedName || smiles);
  const chipStyles =
    category === "payload"
      ? "bg-rose-50 text-rose-700 border border-rose-200"
      : category === "linker"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-slate-50 text-slate-600 border border-slate-200";
  return (
    <Card className={`site-panel ${className ?? ""}`.trim()}>
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h4 className="site-panel-title text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
              {title}
            </h4>
            {subtitle ? (
              <p className="site-panel-subtitle text-sm font-medium">{subtitle}</p>
            ) : null}
          </div>
          {category ? (
            <Chip size="sm" className={chipStyles}>
              {category}
            </Chip>
          ) : null}
        </div>
        <ZoomableFigure label={title}>
          {formulaDisplay ? (
            <div className="zoom-frame flex h-44 items-center justify-center rounded-sm bg-white px-4">
              <div className="zoom-graphic flex h-40 w-full items-center justify-center rounded-[1.25rem] border border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)]">
                {formulaDisplay}
              </div>
            </div>
          ) : !shouldRenderSmiles && src ? (
            <div className="zoom-frame flex h-44 items-center justify-center rounded-sm bg-white">
              <Image
                alt={title}
                src={src}
                className="zoom-graphic h-40 w-full object-contain"
                radius="sm"
              />
            </div>
          ) : (
            <div className="zoom-frame flex h-44 items-center justify-center rounded-sm bg-white">
              <SmilesStructure
                name={resolvedName ?? undefined}
                smiles={smiles}
                width={240}
                height={160}
                className="zoom-graphic h-40 w-full"
                ariaLabel={title}
              />
            </div>
          )}
        </ZoomableFigure>
        {factsQuery ? <PubChemFacts query={factsQuery} /> : null}
        {note ? <p className="site-panel-note text-sm leading-6">{note}</p> : null}
      </CardBody>
    </Card>
  );
}
