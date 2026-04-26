"use client";

import { Card, CardBody } from "@heroui/react";
import { ZoomableFigure } from "@/components/ZoomableFigure";

export function MoleculeCard({
  label,
  variant,
}: {
  label: string;
  variant: "antibody" | "peptide" | "ligand" | "linker" | "payload" | "oligo" | "enzyme" | "radionuclide";
}) {
  const oligoType = label.toLowerCase().includes("sirna")
    ? "sirna"
    : label.toLowerCase().includes("pmo")
      ? "pmo"
      : label.toLowerCase().includes("aso")
        ? "aso"
        : "generic";

  const oligoSummary =
    oligoType === "sirna"
      ? "double-stranded RNA duplex that loads RISC and cuts matching mRNA"
      : oligoType === "pmo"
        ? "charge-neutral morpholino that sterically redirects splicing without RNase H cleavage"
        : oligoType === "aso"
          ? "single-stranded antisense oligo that hybridizes RNA for RNase H knockdown or steric block"
          : "";

  const oligoImageNote =
    oligoType === "sirna"
      ? "This schematic follows the RNAi sequence from duplex processing to RISC loading and target-mRNA cleavage."
      : oligoType === "pmo"
        ? "This figure shows a splice-switching setup where PMO binding blocks a splice-recognition site and changes the transcript outcome."
        : oligoType === "aso"
          ? "This schematic shows an antisense splice-modulation example, where ASO binding changes which mature transcript gets produced."
          : "";

  const oligoSteps =
    oligoType === "sirna"
      ? [
          "1. a short double-stranded RNA duplex reaches the cell interior after productive delivery.",
          "2. the duplex is handed to the RNA-interference machinery, where Argonaute-containing RISC is assembled.",
          "3. the passenger strand is discarded, while the guide strand is retained as the sequence-specific recognition strand.",
          "4. the guide-loaded RISC binds a complementary mRNA and cleaves it, which lowers output from that gene.",
        ]
      : oligoType === "pmo"
        ? [
            "1. the PMO binds a chosen sequence on pre-mRNA, usually near a splice junction or splice-control element.",
            "2. that binding physically blocks the splice machinery from recognizing or using the original site.",
            "3. as a result, exon inclusion or exon skipping changes and a different mature transcript is produced.",
            "4. this is a steric mechanism, so the RNA is redirected rather than cut by RNase H.",
          ]
        : oligoType === "aso"
          ? [
              "1. the ASO hybridizes to a complementary RNA sequence through standard base pairing.",
              "2. depending on the backbone and architecture, that duplex either recruits RNase H or acts as a steric blocker.",
              "3. the transcript outcome then changes: some ASOs trigger RNA cleavage, while others redirect splicing or translation.",
              "4. the final biological effect depends on sequence match, chemistry, and whether the oligo reaches the right intracellular compartment.",
            ]
          : [];

  const oligoTitle =
    oligoType === "sirna"
      ? "RNA interference"
      : oligoType === "pmo"
        ? "steric splice switching"
        : oligoType === "aso"
          ? "antisense modulation"
          : "";

  return (
    <Card className="site-panel">
      <CardBody className="flex flex-col items-center gap-3 p-5">
        {variant === "oligo" && oligoType !== "generic" ? (
          <div className="site-dark-card w-full overflow-hidden rounded-[1rem] border border-slate-700/70 shadow-[0_16px_36px_rgba(2,8,23,0.24)]">
            <div className="border-b border-white/8 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-50">{oligoTitle}</p>
            </div>
            <div className="px-4 py-4">
              {oligoType === "sirna" ? (
                <ZoomableFigure
                  label="siRNA schematic"
                  className="w-full"
                >
                  <div className="zoom-frame flex h-64 w-full items-center justify-center overflow-hidden rounded-[0.9rem] border border-white/8 bg-slate-950/65 p-4">
                    <img
                      src="https://commons.wikimedia.org/wiki/Special:FilePath/SiRNA%20mechanism.2.png"
                      alt="Open-license simple siRNA mechanism schematic"
                      className="zoom-graphic max-h-full w-full object-contain"
                    />
                  </div>
                </ZoomableFigure>
              ) : null}
              {oligoType === "pmo" ? (
                <ZoomableFigure
                  label="PMO schematic"
                  className="w-full"
                >
                  <div className="zoom-frame flex h-64 w-full items-center justify-center overflow-hidden rounded-[0.9rem] border border-white/8 bg-slate-950/65 p-4">
                    <img
                      src="https://cdn.ncbi.nlm.nih.gov/pmc/blobs/03b8/5920040/13c5656d40bf/fmicb-09-00750-g003.jpg"
                      alt="Open-access PMO schematic showing inhibition of pre-mRNA splicing"
                      className="zoom-graphic max-h-full w-full object-contain"
                    />
                  </div>
                </ZoomableFigure>
              ) : null}
              {oligoType === "aso" ? (
                <ZoomableFigure
                  label="ASO schematic"
                  className="w-full"
                >
                  <div className="zoom-frame flex h-64 w-full items-center justify-center overflow-hidden rounded-[0.9rem] border border-white/8 bg-slate-950/65 p-4">
                    <img
                      src="https://commons.wikimedia.org/wiki/Special:FilePath/Nusinersen%20mechanism%20of%20action.svg"
                      alt="Open-license ASO schematic showing nusinersen mechanism of action"
                      className="zoom-graphic max-h-full w-full object-contain"
                    />
                  </div>
                </ZoomableFigure>
              ) : null}
            </div>
            <div className="border-t border-white/8 bg-white/3 px-4 py-3">
              <p className="site-dark-card-muted text-sm leading-7">{oligoSummary}</p>
              {oligoImageNote ? (
                <p className="site-dark-card-soft mt-3 text-sm leading-7">{oligoImageNote}</p>
              ) : null}
              {oligoSteps.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {oligoSteps.map((step) => (
                    <p key={step} className="site-dark-card-soft text-sm leading-7">
                      {step}
                    </p>
                  ))}
                </div>
              ) : null}
              {oligoType === "sirna" ? (
                <p className="site-dark-card-soft mt-3 text-sm leading-7">
                  Image:{" "}
                  <a
                    href="https://commons.wikimedia.org/wiki/File:SiRNA_mechanism.2.png"
                    className="text-sky-300 hover:text-sky-200 hover:underline"
                  >
                    Wikimedia Commons, CC BY-SA 4.0
                  </a>
                </p>
              ) : null}
              {oligoType === "pmo" ? (
                <p className="site-dark-card-soft mt-3 text-sm leading-7">
                  Image:{" "}
                  <a
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5920040/"
                    className="text-sky-300 hover:text-sky-200 hover:underline"
                  >
                    Figure 3 from a CC BY open-access PMO review on PMC
                  </a>
                </p>
              ) : null}
              {oligoType === "aso" ? (
                <p className="site-dark-card-soft mt-3 text-sm leading-7">
                  Image:{" "}
                  <a
                    href="https://commons.wikimedia.org/wiki/File:Nusinersen_mechanism_of_action.svg"
                    className="text-sky-300 hover:text-sky-200 hover:underline"
                  >
                    Wikimedia Commons, CC BY-SA 4.0
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <svg
            className="h-36 w-full max-w-[15rem]"
            viewBox="0 0 180 120"
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
          {variant === "oligo" && oligoType === "sirna" ? (
            <g />
          ) : null}
          {variant === "oligo" && oligoType === "pmo" ? (
            <g />
          ) : null}
          {variant === "oligo" && oligoType === "aso" ? (
            <g />
          ) : null}
          {variant === "oligo" && oligoType === "generic" ? (
            <g stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
              <path d="M30 30c24 20 48 20 72 40" />
              <path d="M30 90c24-20 48-20 72-40" />
              <circle cx="102" cy="70" r="4" fill="#10b981" />
              <circle cx="102" cy="50" r="4" fill="#10b981" />
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
        )}
        {variant !== "oligo" || oligoType === "generic" ? (
          <span className="text-center text-sm text-zinc-600">{label}</span>
        ) : null}
      </CardBody>
    </Card>
  );
}
