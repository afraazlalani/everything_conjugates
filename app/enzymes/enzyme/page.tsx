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
    note: "Used for classic ADEPT enzyme-selection logic including turnover, specificity, and immunogenicity concerns.",
  },
  {
    id: 2,
    label:
      "Targeted enzyme prodrug therapy using 2′-deoxyribosyltransferase conjugates (Biomolecules, 2024) — CC BY",
    href: "https://www.mdpi.com/2218-273X/14/8/894",
    note: "Used for modern enzyme-prodrug therapy framing and examples of current targeted catalyst strategies.",
  },
  {
    id: 3,
    label: "Wikimedia Commons: Induced fit diagram (CC BY-SA 4.0)",
    href: "https://commons.wikimedia.org/wiki/File:Induced_fit_diagram.svg",
    note: "Open-source educational figure used to illustrate the basic catalyst-substrate recognition idea.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const enzymeRows = [
  {
    family: "Prodrug-cleaving enzymes",
    role: "Directly unmask a substrate into a more active local product",
    watchout: "Need strong substrate selectivity plus practical in vivo stability",
  },
  {
    family: "Nucleoside / transfer enzymes",
    role: "Convert one local substrate pool into another active species through catalytic turnover",
    watchout: "The biology only works if substrate access and local concentration cooperate",
  },
  {
    family: "Engineered or microbial catalysts",
    role: "Provide orthogonal chemistry that host tissues usually do not perform strongly on their own",
    watchout: "Immunogenicity and platform complexity often increase fast",
  },
];

export default function EnzymeEnzymePage() {
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
          name: "turnover pressure",
          x: ["substrate selectivity", "in vivo stability", "turnover need", "immunogenicity risk"],
          y: [4.2, 3.8, 4.8, 3.5],
          marker: { color: "#10b981" },
        },
        {
          type: "development pressure",
          x: ["substrate selectivity", "in vivo stability", "turnover need", "immunogenicity risk"],
          y: [3.9, 4.2, 3.6, 4.6],
          marker: { color: "#8b5cf6" },
        },
      ],
      {
        barmode: "group",
        margin: { l: 60, r: 24, t: 28, b: 90 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        yaxis: {
          title: "Qualitative pressure",
          range: [0, 5.2],
          tickvals: [1, 2, 3, 4, 5],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        xaxis: {
          tickangle: -12,
        },
        legend: {
          orientation: "h",
          y: 1.16,
          x: 0,
        },
        font: {
          family: "Var(--font-manrope), sans-serif",
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
            enzyme
          </Chip>
          <h1 className="site-page-title font-semibold">
            the catalyst is the real engine of the platform
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            the enzyme is what turns localization into chemistry. it has to recognize the chosen
            substrate, survive long enough in vivo, and keep enough catalytic competence that
            local activation is meaningfully stronger than background chemistry.{cite(1)}
            {cite(2)}
          </p>
          <EnzymeSectionTabs active="enzyme" />
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                open-source visual
              </p>
              <h2 className="site-page-heading font-semibold">
                enzyme recognition is still the core gate
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4">
              <ZoomableFigure label="Induced fit diagram">
                <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/80 p-4">
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Induced_fit_diagram.svg/1024px-Induced_fit_diagram.svg.png"
                    alt="Induced fit diagram"
                    className="zoom-graphic w-full rounded-xl object-contain"
                  />
                </div>
              </ZoomableFigure>
              <p className="text-sm leading-7 text-zinc-600">
                this is a generic educational enzyme figure, not an ADEPT-specific mechanism.
                it still helps because the whole platform depends on one basic thing remaining
                true in vivo: the catalyst has to keep recognizing the intended substrate
                productively.{cite(1)}
                {cite(3)}
              </p>
            </CardBody>
          </Card>

          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                design notes
              </p>
              <h2 className="site-page-heading font-semibold">
                what makes enzyme choice hard
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4 text-sm leading-7 text-zinc-600">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">turnover has to be real, not nominal</p>
                <p className="mt-2">
                  good catalytic numbers on paper do not help much if the enzyme does not see
                  enough substrate locally after targeting.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">specificity decides the safety story</p>
                <p className="mt-2">
                  if the enzyme accepts unintended substrates or the prodrug is too easy to unmask,
                  local activation turns into systemic background chemistry fast.{cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">immunogenicity is not a side note</p>
                <p className="mt-2">
                  microbial or engineered catalysts can look attractive chemically, but immune
                  response and in vivo persistence can become the practical limitation.{cite(1)}
                  {cite(2)}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated plot
            </p>
            <h2 className="site-page-heading font-semibold">
              which enzyme-selection pressures dominate development fastest
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why turnover stays central</p>
                <p className="mt-2">
                  unlike direct payload formats, the enzyme page lives or dies on whether the
                  catalyst does enough chemistry locally to matter.{cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why development gets heavy fast</p>
                <p className="mt-2">
                  enzyme expression, formulation, persistence, and immune tolerance all add burden
                  well before a clean clinical effect is obvious.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why the catalyst is still worth it</p>
                <p className="mt-2">
                  when the enzyme is chosen well, the system can get a local amplification effect
                  that simpler one-shot formats do not naturally have.{cite(1)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              enzyme families
            </p>
            <h2 className="site-page-heading font-semibold">
              what kinds of enzymes get considered
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="Enzyme families" removeWrapper>
              <TableHeader>
                <TableColumn>family</TableColumn>
                <TableColumn>what it is trying to do</TableColumn>
                <TableColumn>where the risk shows up</TableColumn>
              </TableHeader>
              <TableBody>
                {enzymeRows.map((row) => (
                  <TableRow key={row.family}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.family}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.role}</TableCell>
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
