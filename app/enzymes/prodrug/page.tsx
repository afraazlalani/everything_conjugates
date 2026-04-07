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
import { StructureCard } from "@/components/StructureCard";
import { SourceList } from "@/components/SourceList";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { EnzymeSectionTabs } from "@/components/EnzymeSectionTabs";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const references = [
  {
    id: 1,
    label:
      "Antibody-directed enzyme prodrug therapy (ADEPT): concepts and developments (Advanced Drug Delivery Reviews, 1997)",
    href: "https://pubmed.ncbi.nlm.nih.gov/9363870/",
    note: "used for the core prodrug principles: circulation stability first, local enzymatic unmasking second.",
  },
  {
    id: 2,
    label:
      "Targeted enzyme prodrug therapy using 2′-deoxyribosyltransferase conjugates (Biomolecules, 2024) — CC BY",
    href: "https://www.mdpi.com/2218-273X/14/8/894",
    note: "used for modern targeted-enzyme prodrug examples and why substrate design still dominates selectivity.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const prodrugRows = [
  {
    class: "masked cytotoxics",
    fit: "useful when the free agent is too dangerous systemically but still valuable locally",
    watchout: "background instability or off-site activation can erase the whole advantage",
  },
  {
    class: "nucleoside / metabolite substrates",
    fit: "useful when enzyme turnover can amplify local conversion rather than only release one drug equivalent",
    watchout: "depends strongly on substrate access and compartment biology",
  },
  {
    class: "reporter / imaging-style substrates",
    fit: "useful when the goal is local signal generation rather than only cytotoxic effect",
    watchout: "signal-to-background can still collapse if the substrate is too easy to process elsewhere",
  },
];

export default function EnzymeProdrugPage() {
  const plotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const Plotly = (
      window as typeof window & {
        Plotly?: {
          newPlot: (
            target: HTMLDivElement,
            data: unknown[],
            layout: Record<string, unknown>,
            config?: Record<string, unknown>,
          ) => Promise<void>;
          purge: (target: HTMLDivElement) => void;
        };
      }
    ).Plotly;

    const plotEl = plotRef.current;
    if (!Plotly || !plotEl) return;

    void Plotly.newPlot(
      plotEl,
      [
        {
          type: "bar",
          name: "circulation stability need",
          x: ["masked cytotoxic", "metabolite substrate", "reporter substrate"],
          y: [4.8, 4.1, 3.5],
          marker: { color: "#0ea5e9" },
        },
        {
          type: "local activation dependence",
          x: ["masked cytotoxic", "metabolite substrate", "reporter substrate"],
          y: [4.9, 4.5, 4.0],
          marker: { color: "#8b5cf6" },
        },
      ],
      {
        barmode: "group",
        margin: { l: 60, r: 24, t: 28, b: 80 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        yaxis: {
          title: "qualitative design pressure",
          range: [0, 5.2],
          tickvals: [1, 2, 3, 4, 5],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        font: {
          family: "var(--font-manrope), sans-serif",
          color: "#334155",
        },
      },
      { displayModeBar: false, responsive: true },
    );

    return () => {
      Plotly.purge(plotEl);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="enzyme" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/enzymes" className="text-sm text-sky-700">
            enzyme overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            prodrug
          </Chip>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold sm:text-5xl">
            the substrate has to stay quiet until the catalyst sees it
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            prodrug design is where the whole selectivity promise either holds or falls apart.
            the substrate has to survive blood exposure, avoid broad background activation, and
            then become meaningfully more useful only after the targeted enzyme has reached the
            right site.{cite(1)}
            {cite(2)}
          </p>
          <EnzymeSectionTabs active="prodrug" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              activation logic
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what the prodrug is trying to do in the system
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Prodrug activation logic">
              <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/80 p-5">
                <svg
                  viewBox="0 0 1080 340"
                  className="zoom-graphic h-auto w-full"
                  role="img"
                  aria-label="Enzyme prodrug activation logic"
                >
                  <rect x="60" y="96" width="260" height="104" rx="28" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="4" />
                  <rect x="408" y="120" width="240" height="56" rx="24" fill="#dcfce7" stroke="#34d399" strokeWidth="4" />
                  <rect x="736" y="96" width="280" height="104" rx="28" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="4" />
                  <path d="M320 148 H 408" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                  <path d="M648 148 H 736" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                  <polygon points="378,124 428,148 378,172" fill="#0f172a" />
                  <polygon points="706,124 756,148 706,172" fill="#0f172a" />
                  <text x="92" y="136" fill="#0369a1" fontSize="28" fontWeight="700">masked substrate</text>
                  <text x="92" y="171" fill="#475569" fontSize="22">quiet in blood if design works</text>
                  <text x="472" y="157" fill="#047857" fontSize="28" fontWeight="700">enzyme sees it</text>
                  <text x="768" y="136" fill="#6d28d9" fontSize="28" fontWeight="700">active local species</text>
                  <text x="768" y="171" fill="#475569" fontSize="22">generated where the catalyst sits</text>

                  <rect x="115" y="244" width="250" height="48" rx="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <rect x="432" y="244" width="270" height="48" rx="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <rect x="768" y="244" width="220" height="48" rx="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="163" y="274" fill="#334155" fontSize="20">1. survive circulation</text>
                  <text x="480" y="274" fill="#334155" fontSize="20">2. resist broad background cleavage</text>
                  <text x="812" y="274" fill="#334155" fontSize="20">3. activate locally</text>
                </svg>
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what the figure means</p>
                <p className="mt-2">
                  the point is not just “drug off, drug on.” the point is that the substrate has
                  to stay masked long enough that the catalyst localizes before useful activation
                  begins.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why this is harder than it sounds</p>
                <p className="mt-2">
                  if the substrate is too stable, nothing happens. if it is too labile, the
                  selectivity story is gone before the targeting system can help.{cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why medicinal chemistry matters</p>
                <p className="mt-2">
                  prodrug design controls what species is really released, how fast it appears,
                  and whether it stays meaningfully more local than the free active agent would.
                  {cite(1)}
                  {cite(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <section className="grid gap-4 md:grid-cols-2">
          <StructureCard
            title="5-fluorocytosine"
            subtitle="classic prodrug example"
            smilesName="5-fluorocytosine"
            pubchemQuery="5-fluorocytosine"
            note="a classic masked substrate example in enzyme/prodrug therapy discussions."
            className="h-full"
          />
          <StructureCard
            title="5-fluorouracil"
            subtitle="activated drug example"
            smilesName="5-fluorouracil"
            pubchemQuery="5-fluorouracil"
            note="a representative active species showing how the useful product can be more exposed and more dangerous than the masked precursor."
            className="h-full"
          />
        </section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated plot
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              which substrate classes depend most on staying masked until late
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">masked cytotoxics are unforgiving</p>
                <p className="mt-2">
                  these can look the strongest when local activation works, but they punish any
                  premature unmasking much more aggressively.{cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">substrate access still matters</p>
                <p className="mt-2">
                  some enzyme systems are less about one-step release and more about whether a
                  local metabolic pool can be turned over enough to matter.{cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">reporter logic has the same trap</p>
                <p className="mt-2">
                  even imaging-style substrates lose value quickly if background chemistry starts
                  generating signal away from the target site.{cite(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              substrate classes
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what types of prodrugs get considered
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="Prodrug classes" removeWrapper>
              <TableHeader>
                <TableColumn>class</TableColumn>
                <TableColumn>where it can look strong</TableColumn>
                <TableColumn>where it gets risky</TableColumn>
              </TableHeader>
              <TableBody>
                {prodrugRows.map((row) => (
                  <TableRow key={row.class}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.class}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.fit}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.watchout}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <SourceList title="verified sources" items={references} />
      </main>
    </div>
  );
}
