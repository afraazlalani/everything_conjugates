"use client";

import { useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Image,
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

const compareRows = [
  {
    question: "Design freedom",
    nonCyclic: "easier to rescan, trim, and mutate because the sequence is not locked into a ring-closing plan",
    cyclic: "less free once the ring architecture is chosen, but more deliberate once the geometry is working",
  },
  {
    question: "Protease stability",
    nonCyclic: "usually weaker unless d-residues, n-methylation, peg, or sequence hardening are layered in",
    cyclic: "often better because the ring can hide cleavage-prone conformations and reduce floppy exposure",
  },
  {
    question: "Binding pose control",
    nonCyclic: "can be adaptable, but sometimes too adaptable",
    cyclic: "often better at preserving one favored receptor-binding shape if the ring was designed well",
  },
  {
    question: "Synthesis burden",
    nonCyclic: "usually the faster and easier route for early iteration",
    cyclic: "ring closure, purity, and conformer control can make synthesis and scale-up harder",
  },
];

const chooserCards = [
  {
    title: "Start non-cyclic when...",
    text: "you are still mapping the receptor-binding motif, want to move fast through sequence ideas, or need a quick read on whether a peptide carrier is even viable.",
  },
  {
    title: "Push cyclic when...",
    text: "the linear sequence binds but trims too fast, or when preserving one tighter binding geometry matters more than easy iteration.",
  },
  {
    title: "Keep both in play when...",
    text: "the program is still learning whether stability, penetration, or receptor geometry is the main bottleneck. a lot of teams compare both before committing.",
  },
];

export default function PdcPeptideOverviewPage() {
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
        name: "non-cyclic",
        x: ["speed to iterate", "stability", "geometry control", "synthetic simplicity"],
        y: [5, 2.5, 3, 5],
        marker: { color: "#38bdf8", line: { color: "#334155", width: 1 } },
      },
      {
        type: "bar",
        name: "cyclic",
        x: ["speed to iterate", "stability", "geometry control", "synthetic simplicity"],
        y: [2.5, 4.8, 4.6, 2.7],
        marker: { color: "#22c55e", line: { color: "#334155", width: 1 } },
      },
    ];

    const layout = {
      barmode: "group",
      margin: { l: 48, r: 20, t: 18, b: 88 },
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
      legend: {
        orientation: "h",
        y: 1.12,
        x: 0,
        font: { size: 13, color: "#334155" },
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
          <Link href="/pdcs" className="text-sm text-sky-700">
            pdc overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            peptides
          </Chip>
          <h1 className="site-page-title font-semibold">
            peptide carriers split into non-cyclic and cyclic design styles
          </h1>
          <p className="max-w-4xl text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            both families are trying to do the same core job — bind, route, and survive —
            but they get there differently. non-cyclic peptides lean on sequence design and
            fast synthesis, while cyclic peptides lean on conformational control and
            stability.{cite(1)}{cite(2)}{cite(3)}
          </p>
          <PdcSectionTabs active="peptide" />
          <PdcPeptideTabs active="overview" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              overview
            </p>
            <h2 className="site-page-heading font-semibold">
              two ways peptide carriers usually get built
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/85 p-5">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                  non-cyclic peptide image
                </p>
                <ZoomableFigure label="linear pentapeptide structure">
                  <div className="zoom-frame mt-4 flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-4">
                    <Image
                      alt="linear pentapeptide structural formula"
                      src="https://upload.wikimedia.org/wikipedia/commons/7/73/Pentapeptide_beta_Ala-TRp-Met-Asp-Phe_Formula_V1.svg"
                      className="zoom-graphic h-[16rem] w-full object-contain"
                      radius="none"
                      removeWrapper
                    />
                  </div>
                </ZoomableFigure>
                <p className="mt-4 text-sm leading-7 text-zinc-600">
                  this is a real linear pentapeptide structure, which works better here as
                  a stand-in for non-cyclic peptide logic: open chain, easier sequence
                  editing, and no ring-constrained geometry.{cite(1)}{cite(2)}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  source:{" "}
                  <Link
                    href="https://commons.wikimedia.org/wiki/File:Pentapeptide_beta_Ala-TRp-Met-Asp-Phe_Formula_V1.svg"
                    className="text-sky-700"
                  >
                    Wikimedia Commons
                  </Link>
                  , public domain.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(236,253,245,0.96)_100%)] p-5">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                  cyclic peptide image
                </p>
                <ZoomableFigure label="cyclic peptide murepavadin structure">
                  <div className="zoom-frame mt-4 flex items-center justify-center rounded-2xl border border-emerald-100 bg-white p-4">
                    <Image
                      alt="cyclic peptide murepavadin structural formula"
                      src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Murepavadin_structure.svg"
                      className="zoom-graphic h-[16rem] w-full object-contain"
                      radius="none"
                      removeWrapper
                    />
                  </div>
                </ZoomableFigure>
                <p className="mt-4 text-sm leading-7 text-zinc-600">
                  this is a real cyclic peptide structure, which helps show the basic
                  difference on the page: the carrier is conformationally constrained by a
                  ring, which is why cyclic programs often push on stability and shape
                  retention.{cite(1)}{cite(2)}{cite(3)}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  source:{" "}
                  <Link
                    href="https://commons.wikimedia.org/wiki/File:Murepavadin_structure.svg"
                    className="text-sky-700"
                  >
                    Wikimedia Commons
                  </Link>
                  , CC BY-SA 4.0.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/pdcs/peptide/non-cyclic" className="block">
                <Card className="h-full border border-white/80 bg-white/80 transition hover:border-sky-300">
                  <CardBody className="flex h-full flex-col gap-3 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-sky-500">non-cyclic</p>
                    <h3 className="site-page-heading font-semibold">
                      linear and cpp-style peptide logic
                    </h3>
                    <p className="text-sm leading-7 text-zinc-600">
                      receptor-targeting peptides, cpps, homing motifs, stability edits,
                      and why flexibility is both a strength and a weakness.
                    </p>
                  </CardBody>
                </Card>
              </Link>
              <Link href="/pdcs/peptide/cyclic" className="block">
                <Card className="h-full border border-emerald-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(236,253,245,0.95)_100%)] transition hover:border-emerald-300">
                  <CardBody className="flex h-full flex-col gap-3 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">cyclic</p>
                    <h3 className="site-page-heading font-semibold">
                      ring-constrained peptide logic
                    </h3>
                    <p className="text-sm leading-7 text-zinc-600">
                      how ring closure changes protease stability, binding pose, and why
                      cyclic carriers can behave differently from linear ones.
                    </p>
                  </CardBody>
                </Card>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              comparison plot
            </p>
            <h2 className="site-page-heading font-semibold">
              where linear and cyclic peptides usually pull ahead
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              {chooserCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-zinc-900">{card.title}</p>
                  <p className="mt-2">{card.text}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              side-by-side table
            </p>
            <h2 className="site-page-heading font-semibold">
              what really separates non-cyclic from cyclic peptides
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="non-cyclic versus cyclic peptide comparison"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>question</TableColumn>
                <TableColumn>non-cyclic peptides</TableColumn>
                <TableColumn>cyclic peptides</TableColumn>
              </TableHeader>
              <TableBody>
                {compareRows.map((row) => (
                  <TableRow key={row.question}>
                    <TableCell className="font-semibold text-zinc-900">{row.question}</TableCell>
                    <TableCell>{row.nonCyclic}</TableCell>
                    <TableCell>{row.cyclic}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <section className="grid gap-3">
          <h3 className="site-card-heading font-semibold">
            references
          </h3>
          <ol className="list-decimal pl-6 text-sm text-zinc-600">
            {references.map((ref) => (
              <li key={ref.id} id={`ref-${ref.id}`}>
                <Link href={ref.href} className="text-sky-700">
                  {ref.label}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
