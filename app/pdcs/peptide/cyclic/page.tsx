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
      "Peptides as a platform for targeted therapeutics for cancer: PDCs (Chem. Soc. Rev., 2021)",
    href: "https://pubs.rsc.org/en/Content/ArticleLanding/2021/CS/D0CS00556H",
  },
  {
    id: 2,
    label:
      "Peptide-Drug Conjugates: Design, Chemistry, and Drug Delivery System as a Novel Cancer Theranostic (ACS Pharmacol. Transl. Sci., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acsptsci.3c00269",
  },
  {
    id: 3,
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

const closureRows = [
  {
    type: "head-to-tail",
    why: "used when the whole sequence can be turned into one closed macrocycle",
    strength: "Maximally removes free ends and often gives a very clean ring concept",
    watchout: "Can over-constrain the wrong conformation if the sequence map is still immature",
  },
  {
    type: "side-chain to side-chain",
    why: "used when the team wants to lock only part of the sequence while preserving other functional residues",
    strength: "Lets medicinal chemists tune ring size and position more intentionally",
    watchout: "Bridge placement can get synthetically harder and easier to over-engineer",
  },
  {
    type: "disulfide or redox-sensitive bridge",
    why: "used when reversible or simpler ring closure is attractive in discovery",
    strength: "Fast way to explore constrained geometry during early screening",
    watchout: "Redox sensitivity can complicate interpretation if the final use case needs stronger stability",
  },
];

const cyclicRiskCards = [
  {
    title: "Wrong conformation, but locked",
    text: "cyclization helps only if it preserves a useful pose. a bad ring can freeze the peptide into a weaker binder.",
  },
  {
    title: "Harder synthesis loop",
    text: "ring closure, purification, and conformer mixtures can slow down the build-test-learn cycle.",
  },
  {
    title: "Linker position becomes more sensitive",
    text: "because the scaffold is tighter, a bad payload exit vector can interfere with binding more sharply than on a floppy linear peptide.",
  },
  {
    title: "Stability is not the same as productive biology",
    text: "a cyclic peptide can survive longer but still miss the right receptor behavior or intracellular fate.",
  },
];

export default function PdcCyclicPeptidePage() {
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
        name: "cyclic peptide reality",
        x: ["protease stability", "shape retention", "binding-pose control", "synthetic ease", "iteration speed"],
        y: [4.9, 4.7, 4.4, 2.6, 2.5],
        marker: {
          color: ["#22c55e", "#4ade80", "#10b981", "#86efac", "#34d399"],
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
        gridcolor: "#dcfce7",
      },
      yaxis: {
        title: { text: "qualitative strength", font: { size: 15, color: "#334155" } },
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dcfce7",
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
          <Chip className="w-fit border border-emerald-200 bg-white/70 text-emerald-700">cyclic peptide</Chip>
          <h1 className="site-page-title font-semibold">
            cyclic peptides trade synthetic simplicity for control
          </h1>
          <p className="max-w-4xl text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            when a pdc peptide is cyclized, the ring can reduce conformational floppiness,
            protect vulnerable sites from proteases, and sometimes preserve receptor-binding
            geometry better than a linear sequence. that is why cyclic motifs show up so
            often in high-value peptide targeting programs.{cite(1)}{cite(2)}{cite(3)}
          </p>
          <PdcSectionTabs active="peptide" />
          <PdcPeptideTabs active="cyclic" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">sequence-level visuals</p>
            <h2 className="site-page-heading font-semibold">
              what ring-constrained peptide carriers really look like
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(236,253,245,0.96)_100%)] p-5">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                  ring-constrained sequence
                </p>
                <ZoomableFigure label="cyclic peptide single-letter ring diagram">
                  <div className="zoom-frame mt-4 flex items-center justify-center rounded-2xl border border-emerald-100 bg-white p-4">
                    <svg className="zoom-graphic h-auto w-full" viewBox="0 0 760 300" fill="none">
                      <text x="48" y="54" fontSize="24" fill="#166534" fontWeight="700">
                        ring holds the motif in one tighter shape
                      </text>
                      <circle cx="380" cy="156" r="86" fill="#ecfdf5" stroke="#22c55e" strokeWidth="6" />
                      {[
                        ["R", 380, 70],
                        ["G", 442, 96],
                        ["D", 468, 156],
                        ["W", 442, 216],
                        ["K", 380, 242],
                        ["R", 318, 216],
                        ["Y", 292, 156],
                        ["F", 318, 96],
                      ].map(([letter, x, y]) => (
                        <g key={String(letter) + String(x)}>
                          <circle cx={Number(x)} cy={Number(y)} r="24" fill="#ffffff" stroke="#16a34a" strokeWidth="3" />
                          <text x={Number(x)} y={Number(y) + 8} textAnchor="middle" fontSize="22" fill="#166534" fontWeight="700">
                            {letter}
                          </text>
                        </g>
                      ))}
                      <path d="M535 132C582 126 610 108 628 86" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
                      <text x="636" y="84" fontSize="18" fill="#334155">linker exit can be planned</text>
                      <text x="236" y="282" fontSize="18" fill="#475569">
                        same amino-acid alphabet, but now ring closure limits floppy conformations
                      </text>
                    </svg>
                  </div>
                </ZoomableFigure>
                <p className="mt-4 text-sm leading-7 text-zinc-600">
                  this is the core cyclic-peptide idea in a cleaner form: the same
                  single-letter amino-acid logic is still there, but a ring now biases how
                  the motif can move and present itself to the receptor.{cite(1)}{cite(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/85 p-5">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                  common closure logic
                </p>
                <ZoomableFigure label="cyclic peptide closure mode diagram">
                  <div className="zoom-frame mt-4 flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-4">
                    <svg className="zoom-graphic h-auto w-full" viewBox="0 0 760 300" fill="none">
                      <text x="48" y="54" fontSize="24" fill="#166534" fontWeight="700">
                        different ways teams close the ring
                      </text>
                      <rect x="58" y="92" width="188" height="150" rx="22" fill="#f8fafc" stroke="#cbd5e1" />
                      <text x="152" y="126" textAnchor="middle" fontSize="20" fill="#0f172a" fontWeight="700">head-to-tail</text>
                      <circle cx="152" cy="178" r="42" fill="none" stroke="#22c55e" strokeWidth="6" />
                      <text x="152" y="186" textAnchor="middle" fontSize="18" fill="#166534" fontWeight="700">A G D F</text>
                      <rect x="286" y="92" width="188" height="150" rx="22" fill="#f8fafc" stroke="#cbd5e1" />
                      <text x="380" y="126" textAnchor="middle" fontSize="20" fill="#0f172a" fontWeight="700">side-chain bridge</text>
                      <path d="M342 188C362 144 398 144 418 188" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />
                      <text x="380" y="202" textAnchor="middle" fontSize="18" fill="#166534" fontWeight="700">C ... C</text>
                      <rect x="514" y="92" width="188" height="150" rx="22" fill="#f8fafc" stroke="#cbd5e1" />
                      <text x="608" y="126" textAnchor="middle" fontSize="20" fill="#0f172a" fontWeight="700">stapled-like</text>
                      <path d="M564 180H652" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />
                      <path d="M574 160C590 140 626 140 642 160" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                      <text x="608" y="202" textAnchor="middle" fontSize="18" fill="#166534" fontWeight="700">i, i+4 lock</text>
                    </svg>
                  </div>
                </ZoomableFigure>
                <p className="mt-4 text-sm leading-7 text-zinc-600">
                  teams do not all cyclize the same way. head-to-tail, disulfide or other
                  side-chain bridges, and stapled-style constraints all change how rigid the
                  carrier becomes and where the linker can be installed.{cite(2)}{cite(3)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">ring logic</p>
            <h2 className="site-page-heading font-semibold">
              what cyclization changes
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <ZoomableFigure label="linear versus cyclic peptide logic">
              <div className="zoom-frame rounded-2xl border border-white/70 bg-white/85 p-5">
                <svg className="zoom-graphic h-auto w-full" viewBox="0 0 1080 330" fill="none">
                  <rect x="54" y="62" width="382" height="206" rx="26" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
                  <text x="88" y="112" fontSize="30" fill="#0f172a" fontWeight="700">linear peptide</text>
                  <path d="M120 190C180 132 250 248 318 178C344 150 372 152 404 188" stroke="#0ea5e9" strokeWidth="14" strokeLinecap="round" />
                  <text x="88" y="240" fontSize="18" fill="#475569">more flexible, easier to make, often easier to clip</text>
                  <rect x="642" y="62" width="382" height="206" rx="26" fill="#ecfdf5" stroke="#4ade80" strokeWidth="3" />
                  <text x="680" y="112" fontSize="30" fill="#166534" fontWeight="700">cyclic peptide</text>
                  <path d="M778 190C812 132 904 140 924 194C942 244 852 276 794 242C758 220 750 208 778 190Z" stroke="#22c55e" strokeWidth="14" strokeLinecap="round" />
                  <text x="680" y="240" fontSize="18" fill="#475569">more constrained, often more stable, sometimes more affinity-preserving</text>
                </svg>
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why teams do it</p>
                <p className="mt-2">to keep the peptide from sampling too many weak conformations and to slow down proteolysis.</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why it helps pdcs</p>
                <p className="mt-2">if the carrier lives longer and stays in the right shape, the linker and payload get a better chance to matter.</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what it does not solve</p>
                <p className="mt-2">cyclization does not automatically fix poor receptor biology, wrong uptake routing, or a bad linker-payload fit.</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">integrated comparison</p>
            <h2 className="site-page-heading font-semibold">
              where cyclic carriers usually buy you something
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
                  cyclic design usually earns its keep when geometry control and stability
                  matter more than the fastest possible synthesis loop.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">when it pays off</p>
                <p className="mt-2">
                  when a strong linear binder exists but degrades too fast, or when receptor
                  recognition depends on preserving one favored binding pose.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what still costs you</p>
                <p className="mt-2">
                  ring closure, purification, and conformer control make cyclic programs more
                  deliberate and often slower to optimize than open-chain ones.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">comparison</p>
            <h2 className="site-page-heading font-semibold">
              linear versus cyclic peptide tradeoffs
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="linear versus cyclic peptide tradeoffs"
              classNames={{
                th: "bg-emerald-50/80 text-emerald-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>question</TableColumn>
                <TableColumn>linear peptide</TableColumn>
                <TableColumn>cyclic peptide</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow key="synthesis">
                  <TableCell className="font-semibold text-zinc-900">synthesis</TableCell>
                  <TableCell>usually simpler and faster to iterate</TableCell>
                  <TableCell>often harder because ring closure and purity control matter more</TableCell>
                </TableRow>
                <TableRow key="stability">
                  <TableCell className="font-semibold text-zinc-900">protease stability</TableCell>
                  <TableCell>often lower unless extra edits are layered in</TableCell>
                  <TableCell>often stronger because the ring can shield cleavage-prone conformations</TableCell>
                </TableRow>
                <TableRow key="affinity">
                  <TableCell className="font-semibold text-zinc-900">binding geometry</TableCell>
                  <TableCell>more flexible but can lose shape precision</TableCell>
                  <TableCell>can preserve a preferred receptor-binding pose if the ring is well designed</TableCell>
                </TableRow>
                <TableRow key="watchout">
                  <TableCell className="font-semibold text-zinc-900">watchout</TableCell>
                  <TableCell>fast trimming or weak in vivo persistence</TableCell>
                  <TableCell>constraint can also lock the wrong conformation if the design is poor</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">closure chemistries</p>
            <h2 className="site-page-heading font-semibold">
              the main ways cyclic carriers get closed
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="cyclic peptide closure chemistries"
              classNames={{
                th: "bg-emerald-50/80 text-emerald-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>closure style</TableColumn>
                <TableColumn>why teams use it</TableColumn>
                <TableColumn>strength</TableColumn>
                <TableColumn>watchout</TableColumn>
              </TableHeader>
              <TableBody>
                {closureRows.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-semibold text-zinc-900">{row.type}</TableCell>
                    <TableCell>{row.why}</TableCell>
                    <TableCell>{row.strength}</TableCell>
                    <TableCell>{row.watchout}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">practical watchouts</p>
            <h2 className="site-page-heading font-semibold">
              what teams still have to watch even after cyclization
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cyclicRiskCards.map((card) => (
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
