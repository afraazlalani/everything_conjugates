"use client";

import { useEffect, useState } from "react";

type Props = {
  query: string;
  compactLabel?: string;
};

type PubChemData = {
  formula: string | null;
  molecularWeight: string | null;
  iupacName: string | null;
  xlogp: string | null;
  hBondDonors: number | null;
  hBondAcceptors: number | null;
};

export function PubChemFacts({ query, compactLabel = "pubchem facts" }: Props) {
  const [data, setData] = useState<PubChemData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(`/api/pubchem?name=${encodeURIComponent(query)}`)
      .then((res) => {
        if (!res.ok) throw new Error("lookup failed");
        return res.json();
      })
      .then((payload: PubChemData) => {
        if (!active) return;
        setData(payload);
        setFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [query]);

  if (failed || !data) return null;

  const facts = [
    data.formula ? `formula ${data.formula}` : null,
    data.molecularWeight ? `mw ${data.molecularWeight}` : null,
    data.xlogp ? `xlogp ${data.xlogp}` : null,
  ].filter(Boolean);

  if (!facts.length) return null;

  return (
    <div className="rounded-[1rem] border border-slate-100 bg-slate-50/90 p-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {compactLabel}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {facts.map((fact) => (
          <span
            key={fact}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.7rem] font-medium text-slate-600"
          >
            {fact}
          </span>
        ))}
      </div>
    </div>
  );
}
