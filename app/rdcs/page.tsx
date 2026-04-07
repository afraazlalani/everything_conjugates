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
import { StructureCard } from "@/components/StructureCard";
import { SourceList } from "@/components/SourceList";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { ZoomableFigure } from "@/components/ZoomableFigure";
import { RdcSectionTabs } from "@/components/RdcSectionTabs";

const references = [
  {
    id: 1,
    label: "LUTATHERA (lutetium Lu 177 dotatate) prescribing information (FDA)",
    href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/208700s000lbl.pdf",
    note: "used for approved somatostatin-receptor radioligand context, beta-emitter behavior, and clinical payload framing.",
  },
  {
    id: 2,
    label: "PLUVICTO (lutetium Lu 177 vipivotide tetraxetan) prescribing information (FDA)",
    href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/215833s000lbl.pdf",
    note: "used for PSMA-targeted radioligand context and the ligand-chelator-radionuclide architecture seen in approved therapy.",
  },
  {
    id: 3,
    label: "Lutetium Lu 177 Vipivotide Tetraxetan: First Approval (Drugs, 2022)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9099330/",
    note: "used for theranostic framing, radionuclide-selection tradeoffs, and why isotope behavior has to match target biology.",
  },
  {
    id: 4,
    label: "Radiolabeling of an Anti-CD33 Antibody with Actinium-225 (RSC Adv., 2021) — CC BY 3.0",
    href: "https://pubs.rsc.org/en/content/articlehtml/2021/ra/d1ra01214a",
    note: "used for antibody-linked alpha-radioconjugate context and actinium-225 handling reality.",
  },
  {
    id: 5,
    label: "Wikimedia Commons: Antibody basic unit.svg",
    href: "https://commons.wikimedia.org/wiki/File:Antibody_basic_unit.svg",
    note: "open-source antibody scaffold image used as a representative targeting-module visual.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const platformRows = [
  {
    part: "targeting ligand",
    job: "find the right receptor or antigen and hold enough tumor residence to let radiation matter",
    pressure: "binding-site barrier, normal-tissue uptake, and whether the scaffold internalizes or stays surface-bound",
  },
  {
    part: "chelator",
    job: "keep the metal attached while preserving the ligand’s pharmacology and clearance profile",
    pressure: "metal-release risk, isotope fit, and how much bulk the chelator adds to the construct",
  },
  {
    part: "radionuclide",
    job: "set the path length, decay timing, and damage density that the whole therapy is built around",
    pressure: "dosimetry, safety, daughter nuclides, and whether the target biology suits alpha or beta logic",
  },
];

const anchorRows = [
  {
    program: "LUTATHERA",
    ligand: "somatostatin analog",
    chelator: "DOTA",
    payload: "Lu-177",
    lesson: "peptide targeting plus a beta-emitter can work when receptor biology, chelation, and radionuclide timing line up.",
  },
  {
    program: "PLUVICTO",
    ligand: "PSMA small-molecule ligand",
    chelator: "tetraxetan / DOTA-family chelator",
    payload: "Lu-177",
    lesson: "small-molecule targeting can still support systemic radiotherapy if chelation and target selectivity are strong enough.",
  },
  {
    program: "antibody alpha programs",
    ligand: "antibody scaffold",
    chelator: "actinium-compatible chelation strategy",
    payload: "Ac-225",
    lesson: "antibodies give longer circulation, but alpha payloads make stability and daughter handling much harder.",
  },
];

export default function RdcsPage() {
  const landscapeRef = useRef<HTMLDivElement | null>(null);
  const pressureRef = useRef<HTMLDivElement | null>(null);

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

    const landscapeEl = landscapeRef.current;
    const pressureEl = pressureRef.current;
    if (!Plotly || !landscapeEl || !pressureEl) return;

    void Plotly.newPlot(
      landscapeEl,
      [
        {
          type: "scatter",
          mode: "markers+text",
          x: [2.1, 3.5, 4.5],
          y: [4.6, 3.1, 2.4],
          text: ["antibody radioconjugates", "peptide radioligands", "small-molecule radioligands"],
          textposition: ["top center", "top center", "bottom center"],
          marker: {
            size: [36, 34, 34],
            color: ["#10b981", "#38bdf8", "#8b5cf6"],
            line: { color: "#334155", width: 2 },
          },
          hovertemplate:
            "<b>%{text}</b><br>tissue movement: %{x}<br>carrier residence: %{y}<extra></extra>",
        },
      ],
      {
        margin: { l: 72, r: 28, t: 28, b: 72 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        xaxis: {
          title: "how quickly the construct usually moves through tissue",
          range: [1.5, 5],
          tickvals: [2, 3, 4, 5],
          ticktext: ["slower", "mixed", "fast", "very fast"],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        yaxis: {
          title: "how much residence and carrier buffering it usually has",
          range: [1.8, 5],
          tickvals: [2, 3, 4, 5],
          ticktext: ["lower", "mixed", "high", "very high"],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        font: {
          family: "var(--font-manrope), sans-serif",
          color: "#334155",
        },
      },
      {
        displayModeBar: false,
        responsive: true,
      },
    );

    void Plotly.newPlot(
      pressureEl,
      [
        {
          type: "bar",
          name: "ligand pressure",
          x: ["tumor selectivity", "normal-organ exposure", "trafficking fit", "build complexity"],
          y: [4.8, 4.1, 4.4, 3.3],
          marker: { color: "#0ea5e9" },
        },
        {
          type: "bar",
          name: "chelator pressure",
          x: ["tumor selectivity", "normal-organ exposure", "trafficking fit", "build complexity"],
          y: [2.4, 4.5, 3.4, 4.2],
          marker: { color: "#6366f1" },
        },
        {
          type: "bar",
          name: "radionuclide pressure",
          x: ["tumor selectivity", "normal-organ exposure", "trafficking fit", "build complexity"],
          y: [2.1, 4.8, 4.9, 4.6],
          marker: { color: "#f97316" },
        },
      ],
      {
        barmode: "group",
        margin: { l: 60, r: 24, t: 28, b: 84 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        yaxis: {
          title: "qualitative design pressure",
          range: [0, 5.2],
          tickvals: [1, 2, 3, 4, 5],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        xaxis: {
          tickangle: -10,
        },
        legend: {
          orientation: "h",
          y: 1.16,
          x: 0,
        },
        font: {
          family: "var(--font-manrope), sans-serif",
          color: "#334155",
        },
      },
      {
        displayModeBar: false,
        responsive: true,
      },
    );

    return () => {
      Plotly.purge(landscapeEl);
      Plotly.purge(pressureEl);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="rdc" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="text-sm text-sky-700">
            back to home
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            radionuclide drug conjugates (rdcs)
          </Chip>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold sm:text-6xl">
            targeted radiation delivery is a three-part physics problem
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            RDCs are not only ligand-plus-payload constructs. they are ligand, chelator, and
            radionuclide systems where target biology, metal handling, and decay physics all
            have to agree at the same time. that is why the chapter is really about
            matching tissue address, metal stability, and radiation behavior into one
            workable therapy.{cite(1)}
            {cite(2)}
            {cite(3)}
            {cite(4)}
          </p>
          <RdcSectionTabs active="overview" />
        </motion.section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card className="border border-white/80 bg-white/70">
            <CardBody className="p-5">
              <StructureCard
                title="antibody targeting scaffold"
                subtitle="open-source representative ligand class image"
                src="/antibody-basic-unit.svg"
                note="a stand-in for the antibody-style targeting end of the rdc field, where long residence and slower clearance can support radionuclide delivery."
                className="border-0 bg-transparent shadow-none"
              />
            </CardBody>
          </Card>
          <Card className="border border-white/80 bg-white/70">
            <CardBody className="p-5">
              <StructureCard
                title="DOTA"
                subtitle="representative chelator"
                src="https://pubchem.ncbi.nlm.nih.gov/compound/name/DOTA"
                pubchemQuery="DOTA"
                note="a representative macrocyclic chelator used because radionuclide payloads only work if the metal stays attached long enough in the body."
                category="linker"
                className="border-0 bg-transparent shadow-none"
              />
            </CardBody>
          </Card>
          <Card className="border border-white/80 bg-white/70">
            <CardBody className="p-5">
              <StructureCard
                title="Lu-177"
                subtitle="representative therapeutic isotope"
                formulaDisplay={
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                    <div className="rounded-full border border-sky-200 bg-sky-50 px-6 py-4 text-center text-4xl font-semibold text-sky-700">
                      177Lu
                    </div>
                    <p className="text-center text-sm text-zinc-500">beta-emitting radionuclide payload</p>
                  </div>
                }
                note="the real payload here is the isotope plus its decay behavior, not a classic small-molecule warhead."
                category="payload"
                className="border-0 bg-transparent shadow-none"
              />
            </CardBody>
          </Card>
        </section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              architecture
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what the whole construct is trying to hold together
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Open-source radioimmunoconjugate schematic">
              <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/70 p-3">
                <Image
                  src="/images/ccby/rdc-rsc-graphical.gif"
                  alt="Open-source radioimmunoconjugate schematic"
                  className="zoom-graphic w-full rounded-xl object-contain"
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what this figure is useful for</p>
                <p className="mt-2">
                  it makes the basic build logic visible in one frame: targeting piece,
                  chelated radionuclide, and a construct whose value comes from where the
                  radiation lands, not from a released free drug.{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what changes versus adc logic</p>
                <p className="mt-2">
                  with rdc design, the key question is often not “what small molecule gets
                  released?” but “what isotope is carried where, for how long, and through
                  what normal organs on the way?”{cite(1)}
                  {cite(2)}
                  {cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why the chelator sits in the middle</p>
                <p className="mt-2">
                  the chelator is what turns radioactive metal into a usable payload module.
                  weak metal handling makes the whole targeting scaffold irrelevant very fast.
                  {cite(1)}
                  {cite(2)}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">cc-by graphical abstract from RSC Advances.{cite(4)}</p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated comparison
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              where rdcs usually sit between antibody, peptide, and small-molecule delivery
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={landscapeRef} className="min-h-[25rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">how to read it</p>
                <p className="mt-2">
                  farther right means faster tissue movement. higher means more carrier
                  residence and more buffering from the scaffold itself. peptide and small-
                  molecule radioligands move faster, while antibodies usually buy longer
                  residence and slower clearance.{cite(1)}
                  {cite(2)}
                  {cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why that matters for radiation</p>
                <p className="mt-2">
                  isotope half-life and path length only make sense in the context of how
                  quickly the ligand reaches tissue and how long it stays there.{cite(1)}
                  {cite(2)}
                  {cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what makes rdcs different</p>
                <p className="mt-2">
                  the payload does not wait passively for release. it is active on a time
                  clock, which is why residence, chelation, and radionuclide choice stay
                  tightly coupled through the whole program.{cite(3)}
                  {cite(4)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              pressure map
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              where the hardest design pressure usually lands
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={pressureRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">ligand pressure</p>
                <p className="mt-2">
                  if the target biology is weak or the normal-organ background is wrong,
                  the isotope cannot rescue the construct later.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">chelator pressure</p>
                <p className="mt-2">
                  rdcs fail fast when the metal does not stay where the ligand takes it, so
                  chelator choice is a first-order design problem, not a small connector detail.
                  {cite(1)}
                  {cite(2)}
                  {cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">radionuclide pressure</p>
                <p className="mt-2">
                  alpha vs beta is really a question about range, damage density, and
                  tolerability, not only about “stronger payload”.{cite(3)}
                  {cite(4)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              practical map
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what each part is solving in the same construct
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="RDC three-part architecture map" removeWrapper>
              <TableHeader>
                <TableColumn>part</TableColumn>
                <TableColumn>what it has to do</TableColumn>
                <TableColumn>where it gets hard</TableColumn>
              </TableHeader>
              <TableBody>
                {platformRows.map((row) => (
                  <TableRow key={row.part}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.part}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.job}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.pressure}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              clinical anchors
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              real programs that show the chapter is not hypothetical
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="RDC clinical anchors" removeWrapper>
              <TableHeader>
                <TableColumn>program</TableColumn>
                <TableColumn>ligand</TableColumn>
                <TableColumn>chelator / payload</TableColumn>
                <TableColumn>why it matters</TableColumn>
              </TableHeader>
              <TableBody>
                {anchorRows.map((row) => (
                  <TableRow key={row.program}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.program}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.ligand}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">
                      {row.chelator ? `${row.chelator} / ${row.payload}` : row.payload}
                    </TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.lesson}</TableCell>
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
