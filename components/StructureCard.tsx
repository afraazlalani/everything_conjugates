"use client";

import { Card, CardBody, Chip, Image } from "@heroui/react";
import { SmilesStructure } from "@/components/SmilesStructure";

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
  note,
  category,
  className,
}: {
  title: string;
  subtitle?: string;
  src?: string;
  smiles?: string;
  smilesName?: string;
  note?: string;
  category?: "payload" | "linker";
  className?: string;
}) {
  const resolvedName = smilesName ?? resolvePubchemName(src);
  const shouldRenderSmiles = Boolean(resolvedName || smiles);
  const chipStyles =
    category === "payload"
      ? "bg-rose-50 text-rose-700 border border-rose-200"
      : category === "linker"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-slate-50 text-slate-600 border border-slate-200";
  return (
    <Card className={`bg-white/70 border border-white/80 ${className ?? ""}`.trim()}>
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h4 className="text-base font-semibold text-zinc-900 font-[family-name:var(--font-space-grotesk)]">
              {title}
            </h4>
            {subtitle ? (
              <p className="text-xs text-zinc-500">{subtitle}</p>
            ) : null}
          </div>
          {category ? (
            <Chip size="sm" className={chipStyles}>
              {category}
            </Chip>
          ) : null}
        </div>
        {!shouldRenderSmiles && src ? (
          <div className="flex h-44 items-center justify-center rounded-sm bg-white">
            <Image
              alt={title}
              src={src}
              className="h-40 w-full object-contain"
              radius="sm"
            />
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center rounded-sm bg-white">
            <SmilesStructure
              name={resolvedName ?? undefined}
              smiles={smiles}
              width={240}
              height={160}
              className="h-40 w-full"
              ariaLabel={title}
            />
          </div>
        )}
        {note ? <p className="text-xs text-zinc-500">{note}</p> : null}
      </CardBody>
    </Card>
  );
}
