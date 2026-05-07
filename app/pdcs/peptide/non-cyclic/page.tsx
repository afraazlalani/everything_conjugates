"use client";

import { useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Link,
  Navbar,
  NavbarBrand,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { motion } from "framer-motion";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { PdcSectionTabs } from "@/components/PdcSectionTabs";
import { PdcPeptideTabs } from "@/components/PdcPeptideTabs";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const references = [
  {
    id: 1,
    label:
      "Peptide-Drug Conjugates: Design, Chemistry, and Drug Delivery System as a Novel Cancer Theranostic (ACS Pharmacol. Transl. Sci., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acsptsci.3c00269",
  },
  {
    id: 2,
    label:
      "Peptides as a platform for targeted therapeutics for cancer: PDCs (Chem. Soc. Rev., 2021)",
    href: "https://pubs.rsc.org/en/Content/ArticleLanding/2021/CS/D0CS00556H",
  },
  {
    id: 3,
    label:
      "Peptide-drug conjugates: A new paradigm for targeted cancer therapy (Eur. J. Med. Chem., 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38194773/",
  },
  {
    id: 4,
    label:
      "Peptide-Drug Conjugates: An Emerging Direction for the Next Generation of Peptide Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.3c01835",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const modalityRows = [
  {
    modality: "receptor-targeting peptide",
    when: "when a defined cell-surface receptor is already known and a short ligand can bind it",
    plus: "compact and selective when the receptor biology is real",
    minus: "affinity can be fragile and not every receptor internalizes productively",
  },
  {
    modality: "cell-penetrating peptide",
    when: "when uptake itself is the main gate",
    plus: "raises cell entry in tougher systems",
    minus: "less clean selectivity and still vulnerable to endosomal trapping",
  },
  {
    modality: "homing peptide",
    when: "when tissue bias matters more than one clean receptor lock",
    plus: "useful for vascular or microenvironmental targeting",
    minus: "binding context can be broader and harder to interpret",
  },
];

const attachmentRows = [
  {
    site: "n-terminus",
    bestFor: "When the binding motif lives deeper in the sequence and the front end can tolerate a handle",
    upside: "Synthetically straightforward and easy to compare across sequence variants",
    risk: "Can weaken binding if the receptor-facing head is actually using the terminus",
  },
  {
    site: "c-terminus",
    bestFor: "When the peptide binds through an internal motif and the tail can point toward the linker",
    upside: "Often cleaner for keeping the receptor-facing side less disturbed",
    risk: "Can still change local charge, helicity, or protease exposure near the end",
  },
  {
    site: "side-chain handle",
    bestFor: "When one residue can be reserved as a conjugation point without breaking the motif",
    upside: "Can separate binding residues from linker installation more intelligently",
    risk: "More medicinal-chemistry work and not every side chain is equally quiet",
  },
];

const failureCards = [
  {
    title: "Protease trimming",
    text: "the open backbone can get clipped before the carrier has enough time to bind, internalize, or deliver the payload.",
  },
  {
    title: "Fast renal loss",
    text: "small linear peptides can move through the body fast enough that exposure becomes the main bottleneck.",
  },
  {
    title: "Motif drift after conjugation",
    text: "a linker or payload can change the local charge and steric profile enough that a previously good binder no longer behaves the same way.",
  },
  {
    title: "Uptake without productive fate",
    text: "a peptide can help entry but still route the conjugate into compartments where the payload never gets a chance to act.",
  },
];

export default function PdcNonCyclicPeptidePage() {
  const plotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !plotRef.current) return;
    const plotEl = plotRef.current;
    const Plotly = (
      window as typeof window & {
        Plotly?: {
          newPlot: (
            el: HTMLElement,
            data: unknown[],
            layout: Record<string, unknown>,
            config?: Record<string, unknown>
          ) => Promise<unknown>;
          purge: (el: HTMLElement) => void;
        };
      }
    ).Plotly;

    if (!Plotly) return;

    const data = [
      {
        type: "bar",
        name: "linear peptide reality",
        x: ["iteration speed", "sequence freedom", "protease stability", "shape discipline", "scale simplicity"],
        y: [5, 5, 2.5, 2.8, 4.7],
        marker: {
          color: ["#38bdf8", "#60a5fa", "#93c5fd", "#818cf8", "#0ea5e9"],
          line: { color: "#334155", width: 1 },
        },
      },
    ];

    const layout = {
      margin: { l: 54, r: 20, t: 12, b: 94 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
      },
      yaxis: {
        title: { text: "qualitative strength", font: { size: 15, color: "#334155" } },
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
        range: [0, 5.5],
      },
      font: { family: "Var(--font-manrope), sans-serif", color: "#0f172a" },
    };

    void Plotly.newPlot(plotEl, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    return () => Plotly.purge(plotEl);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="pdc" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/pdcs" className="text-sm text-sky-700">pdc overview</Link>
          <Link href="/" className="text-sm text-sky-700">home</Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">non-cyclic peptide</Chip>
          <h1 className="site-page-title font-semibold">
            linear peptides keep flexibility, but they pay for it
          </h1>
          <p className="max-w-4xl text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            non-cyclic peptide carriers are easier to synthesize and iterate, but that same
            flexibility can increase protease exposure and make binding geometry less
            disciplined. that is why linear peptide work is usually an optimization problem,
            not just a sequence-picking problem.{cite(1)}{cite(2)}{cite(3)}
          </p>
          <PdcSectionTabs active="peptide" />
          <PdcPeptideTabs active="non-cyclic" />
        </motion.section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">sequence-level visuals</p>
              <h2 className="site-page-heading font-semibold">
                what a non-cyclic carrier really looks like
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white/85 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                    open-chain sequence
                  </p>
                  <ZoomableFigure label="non-cyclic peptide single-letter sequence diagram">
                    <div className="zoom-frame mt-4 flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-4">
                      <svg className="zoom-graphic h-auto w-full" viewBox="0 0 760 260" fill="none">
                        <text x="48" y="54" fontSize="24" fill="#0369a1" fontWeight="700">
                          receptor-facing linear motif
                        </text>
                        <line x1="88" y1="132" x2="672" y2="132" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
                        {[
                          ["R", 122, "#e0f2fe", "#0369a1"],
                          ["G", 204, "#e0f2fe", "#0369a1"],
                          ["D", 286, "#e0f2fe", "#0369a1"],
                          ["W", 368, "#e0f2fe", "#0369a1"],
                          ["K", 450, "#e0f2fe", "#0369a1"],
                          ["R", 532, "#e0f2fe", "#0369a1"],
                          ["Y", 614, "#e0f2fe", "#0369a1"],
                        ].map(([letter, cx, fill, stroke]) => (
                          <g key={String(letter) + String(cx)}>
                            <circle cx={Number(cx)} cy="132" r="31" fill={String(fill)} stroke={String(stroke)} strokeWidth="3" />
                            <text x={Number(cx)} y="142" textAnchor="middle" fontSize="26" fill={String(stroke)} fontWeight="700">
                              {letter}
                            </text>
                          </g>
                        ))}
                        <rect x="596" y="92" width="104" height="80" rx="22" fill="#eef2ff" stroke="#818cf8" strokeWidth="3" />
                        <text x="648" y="122" textAnchor="middle" fontSize="18" fill="#4338ca" fontWeight="700">
                          linker
                        </text>
                        <text x="648" y="146" textAnchor="middle" fontSize="18" fill="#4338ca" fontWeight="700">
                          exit
                        </text>
                        <text x="88" y="210" fontSize="18" fill="#475569">
                          single-letter sequence stays open, easy to trim, mutate, or extend
                        </text>
                      </svg>
                    </div>
                  </ZoomableFigure>
                  <p className="mt-4 text-sm leading-7 text-zinc-600">
                    this is the right visual language for a non-cyclic carrier: an open
                    amino-acid sequence with no ring closure. that openness is why teams can
                    re-sequence, trim, mutate, and move the linker exit more freely while
                    they are still learning the receptor logic.{cite(1)}{cite(2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.85)_0%,rgba(239,246,255,0.95)_100%)] p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                    fast sequence iteration
                  </p>
                  <ZoomableFigure label="non-cyclic peptide variant scanning diagram">
                    <div className="zoom-frame mt-4 flex items-center justify-center rounded-2xl border border-sky-100 bg-white p-4">
                      <svg className="zoom-graphic h-auto w-full" viewBox="0 0 760 260" fill="none">
                        <text x="48" y="54" fontSize="24" fill="#0369a1" fontWeight="700">
                          one motif, many quick variants
                        </text>
                        {[
                          ["R G D W K", 88, 96],
                          ["R G D Y K", 88, 138],
                          ["R G E W K", 88, 180],
                        ].map(([seq, x, y]) => (
                          <g key={String(seq)}>
                            <rect x={Number(x)} y={Number(y)} width="238" height="30" rx="15" fill="#f8fafc" stroke="#cbd5e1" />
                            <text x={Number(x) + 119} y={Number(y) + 21} textAnchor="middle" fontSize="18" fill="#0f172a" fontWeight="600">
                              {seq}
                            </text>
                          </g>
                        ))}
                        <path d="M352 111H448" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" markerEnd="url(#scanArrowNc)" />
                        <path d="M352 153H448" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" markerEnd="url(#scanArrowNc)" />
                        <path d="M352 195H448" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" markerEnd="url(#scanArrowNc)" />
                        <rect x="474" y="82" width="208" height="136" rx="24" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="3" />
                        <text x="578" y="118" textAnchor="middle" fontSize="23" fill="#0369a1" fontWeight="700">
                          sequence scan
                        </text>
                        <text x="578" y="152" textAnchor="middle" fontSize="18" fill="#334155">
                          swap residues
                        </text>
                        <text x="578" y="176" textAnchor="middle" fontSize="18" fill="#334155">
                          move handles
                        </text>
                        <text x="578" y="200" textAnchor="middle" fontSize="18" fill="#334155">
                          trim weak regions
                        </text>
                        <defs>
                          <marker id="scanArrowNc" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                            <path d="M0,0 L10,5 L0,10 Z" fill="#38bdf8" />
                          </marker>
                        </defs>
                      </svg>
                    </div>
                  </ZoomableFigure>
                  <p className="mt-4 text-sm leading-7 text-zinc-600">
                    this is why non-cyclic programs are often the first pass: one motif can
                    be scanned quickly across residue substitutions, truncations, and linker
                    positions before the team commits to something more constrained.{cite(2)}{cite(4)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">mechanism</p>
              <h2 className="site-page-heading font-semibold">
                non-cyclic peptides still have to bias binding and uptake
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4">
              <ZoomableFigure label="non-cyclic peptide engagement and uptake">
                <div className="zoom-frame rounded-2xl border border-white/70 bg-white/85 p-5">
                  <svg className="zoom-graphic h-auto w-full" viewBox="0 0 1100 300" fill="none">
                    <rect x="46" y="82" width="220" height="136" rx="28" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="4" />
                    <text x="88" y="134" fontSize="30" fill="#0369a1" fontWeight="700">target cell</text>
                    <text x="88" y="174" fontSize="18" fill="#334155">receptor-rich surface</text>
                    <rect x="342" y="114" width="170" height="72" rx="36" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
                    <text x="374" y="158" fontSize="26" fill="#0f172a">peptide</text>
                    <path d="M266 150H342" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" markerEnd="url(#ncpArrow)" />
                    <rect x="594" y="82" width="220" height="136" rx="28" fill="#eef2ff" stroke="#818cf8" strokeWidth="4" />
                    <text x="645" y="134" fontSize="30" fill="#4338ca" fontWeight="700">uptake</text>
                    <text x="632" y="174" fontSize="18" fill="#334155">endocytosis / biased entry</text>
                    <path d="M512 150H594" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" markerEnd="url(#ncpArrow)" />
                    <rect x="888" y="82" width="160" height="136" rx="28" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="4" />
                    <text x="925" y="134" fontSize="30" fill="#6d28d9" fontWeight="700">fate</text>
                    <text x="918" y="174" fontSize="18" fill="#334155">release or action</text>
                    <path d="M814 150H888" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" markerEnd="url(#ncpArrow)" />
                    <defs>
                      <marker id="ncpArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                        <path d="M0,0 L10,5 L0,10 Z" fill="#0f172a" />
                      </marker>
                    </defs>
                  </svg>
                </div>
              </ZoomableFigure>
            </CardBody>
          </Card>
        </section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">integrated comparison</p>
            <h2 className="site-page-heading font-semibold">
              where non-cyclic peptides feel strong versus exposed
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[22rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what the plot is saying</p>
                <p className="mt-2">
                  the same openness that makes linear peptides fast to redesign also leaves
                  them more exposed to trimming and more dependent on sequence-level
                  optimization.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">where they shine</p>
                <p className="mt-2">
                  early receptor mapping, fast medicinal-peptide loops, and programs where
                  the team wants to test multiple carrier ideas before locking geometry.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what usually has to be fixed</p>
                <p className="mt-2">
                  protease susceptibility, renal loss, and endosomal fate usually need help
                  from the sequence, linker, or payload design rather than from the peptide
                  scaffold alone.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">modality choices</p>
            <h2 className="site-page-heading font-semibold">
              the main non-cyclic peptide modes
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="non-cyclic pdc peptide modality choices"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>modality</TableColumn>
                <TableColumn>best fit</TableColumn>
                <TableColumn>advantage</TableColumn>
                <TableColumn>watchout</TableColumn>
              </TableHeader>
              <TableBody>
                {modalityRows.map((row) => (
                  <TableRow key={row.modality}>
                    <TableCell className="font-semibold text-zinc-900">{row.modality}</TableCell>
                    <TableCell>{row.when}</TableCell>
                    <TableCell>{row.plus}</TableCell>
                    <TableCell>{row.minus}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">attachment strategy</p>
            <h2 className="site-page-heading font-semibold">
              where teams usually attach the linker on a linear peptide
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="non-cyclic peptide attachment strategy"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>placement</TableColumn>
                <TableColumn>best fit</TableColumn>
                <TableColumn>upside</TableColumn>
                <TableColumn>watchout</TableColumn>
              </TableHeader>
              <TableBody>
                {attachmentRows.map((row) => (
                  <TableRow key={row.site}>
                    <TableCell className="font-semibold text-zinc-900">{row.site}</TableCell>
                    <TableCell>{row.bestFor}</TableCell>
                    <TableCell>{row.upside}</TableCell>
                    <TableCell>{row.risk}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">stability</p>
            <h2 className="site-page-heading font-semibold">
              what teams do when linear peptides fall apart too fast
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="font-semibold text-zinc-900">d-residue substitution</p>
              <p className="mt-2">used when the sequence is too easy for proteases to clip but the design can tolerate stereochemical edits.</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="font-semibold text-zinc-900">peg or lipid appendages</p>
              <p className="mt-2">used when the peptide clears so fast that the payload never gets enough exposure time.</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="font-semibold text-zinc-900">sequence trimming and rescanning</p>
              <p className="mt-2">used when only a small core motif is really needed for binding and the rest adds instability.</p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">failure modes</p>
            <h2 className="site-page-heading font-semibold">
              what usually goes wrong first in non-cyclic programs
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {failureCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">{card.title}</p>
                <p className="mt-2">{card.text}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <section className="grid gap-3">
          <h3 className="site-card-heading font-semibold">references</h3>
          <ol className="list-decimal pl-6 text-sm text-zinc-600">
            {references.map((ref) => (
              <li key={ref.id} id={`ref-${ref.id}`}>
                <Link href={ref.href} className="text-sky-700">{ref.label}</Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
