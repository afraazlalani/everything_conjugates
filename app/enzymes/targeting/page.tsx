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
    note: "Used for the targeting-localization logic and why site separation from healthy tissue is the core safety gate in enzyme conjugates.",
  },
  {
    id: 2,
    label:
      "Targeted enzyme prodrug therapy using 2′-deoxyribosyltransferase conjugates (Biomolecules, 2024) — CC BY",
    href: "https://www.mdpi.com/2218-273X/14/8/894",
    note: "Used for modern targeting-enzyme-prodrug framing and current targeted enzyme-prodrug context.",
  },
  {
    id: 3,
    label: "Wikimedia Commons: Antibody basic unit (public domain)",
    href: "https://commons.wikimedia.org/wiki/File:Antibody_basic_unit.svg",
    note: "Open-source visual used as a stand-in for antibody-type targeting architecture.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const familyRows = [
  {
    family: "Full antibodies / large proteins",
    upside: "Best when long residence time and high selectivity matter more than deep tissue penetration",
    downside: "slower penetration and more complex construct behavior",
  },
  {
    family: "Fragments / smaller binders",
    upside: "Can improve access while keeping some targeting specificity",
    downside: "often shorter residence and less forgiving biodistribution",
  },
  {
    family: "Small ligands",
    upside: "Compact and fast-moving when the target biology really supports them",
    downside: "less shielding and less margin for off-target uptake",
  },
];

export default function EnzymeTargetingPage() {
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
          type: "scatter",
          mode: "markers+text",
          x: [4.5, 3.2, 2.1],
          y: [2.1, 3.2, 4.4],
          text: ["full antibody", "fragment", "small ligand"],
          textposition: ["top center", "bottom center", "top center"],
          marker: {
            size: [34, 30, 30],
            color: ["#0ea5e9", "#8b5cf6", "#10b981"],
            line: { color: "#334155", width: 2 },
          },
          hovertemplate:
            "<b>%{text}</b><br>tumor residence: %{x}<br>penetration speed: %{y}<extra></extra>",
        },
      ],
      {
        margin: { l: 72, r: 30, t: 24, b: 72 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        xaxis: {
          title: "How long the targeting module can often stay engaged",
          range: [1.5, 5],
          tickvals: [2, 3, 4, 5],
          ticktext: ["short", "mixed", "long", "longer"],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        yaxis: {
          title: "How quickly it can move through tissue",
          range: [1.5, 5],
          tickvals: [2, 3, 4, 5],
          ticktext: ["slower", "mixed", "fast", "faster"],
          gridcolor: "#dbeafe",
          zeroline: false,
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
            targeting
          </Chip>
          <h1 className="site-page-title font-semibold">
            targeting decides whether the catalyst ever matters
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            for enzyme conjugates, targeting is not only about binding. it is about getting
            enough active enzyme to the right place, keeping it separated from healthy tissue,
            and making sure the later catalytic step happens where the biology actually helps
            instead of hurts.{cite(1)}
            {cite(2)}
          </p>
          <EnzymeSectionTabs active="targeting" />
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                open-source visual
              </p>
              <h2 className="site-page-heading font-semibold">
                antibody-style targeting as the classic anchor
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4">
              <ZoomableFigure label="Antibody targeting scaffold">
                <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/80 p-4">
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Antibody_basic_unit.svg/1024px-Antibody_basic_unit.svg.png"
                    alt="Antibody basic unit"
                    className="zoom-graphic w-full rounded-xl object-contain"
                  />
                </div>
              </ZoomableFigure>
              <p className="text-sm leading-7 text-zinc-600">
                this is not saying every enzyme conjugate has to use a full antibody. it is just
                a clean reminder of the classic targeting logic: a large targeting module can
                localize well, but that comes with slower penetration and more construct
                complexity.{cite(1)}
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
                what targeting has to solve
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4 text-sm leading-7 text-zinc-600">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">site separation comes first</p>
                <p className="mt-2">
                  the biggest promise of enzyme conjugates is local activation, so healthy-tissue
                  separation is more fundamental than it is in many direct-delivery formats.
                  {cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">internalization is not always the only goal</p>
                <p className="mt-2">
                  some programs want internalization, but others mainly need the enzyme to stay
                  localized long enough to convert substrate near the target site.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">too much speed can still hurt</p>
                <p className="mt-2">
                  smaller targeting systems may move through tissue faster, but they can also clear
                  faster or spread the catalyst more broadly than the catalytic strategy can tolerate.
                  {cite(1)}
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
              how targeting formats trade residence against penetration
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">how to read it</p>
                <p className="mt-2">
                  farther right means the targeting format often stays around longer. higher means
                  it usually moves through tissue faster. this is a design aid, not a measured dataset.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why the tradeoff matters here</p>
                <p className="mt-2">
                  enzyme conjugates need enough localization to create a local catalytic zone, so
                  the “faster is always better” instinct can be wrong.{cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why big binders still matter</p>
                <p className="mt-2">
                  long enough target residence can matter more than raw penetration speed when the
                  enzyme still needs time to build local product formation.{cite(1)}
                  {cite(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              targeting families
            </p>
            <h2 className="site-page-heading font-semibold">
              the main ways teams try to localize the catalyst
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="Targeting families for enzyme conjugates" removeWrapper>
              <TableHeader>
                <TableColumn>family</TableColumn>
                <TableColumn>where it can look strong</TableColumn>
                <TableColumn>where it gets harder</TableColumn>
              </TableHeader>
              <TableBody>
                {familyRows.map((row) => (
                  <TableRow key={row.family}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.family}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.upside}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.downside}</TableCell>
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
