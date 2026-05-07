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
    note: "Used for somatostatin-receptor peptide radioligand context.",
  },
  {
    id: 2,
    label: "PLUVICTO (lutetium Lu 177 vipivotide tetraxetan) prescribing information (FDA)",
    href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/215833s000lbl.pdf",
    note: "Used for PSMA small-molecule ligand context and organ-uptake tradeoffs.",
  },
  {
    id: 3,
    label: "Lutetium Lu 177 Vipivotide Tetraxetan: First Approval (Drugs, 2022)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9099330/",
    note: "Used for theranostic ligand framing and why ligand biology still dominates the whole program.",
  },
  {
    id: 4,
    label: "Radiolabeling of an Anti-CD33 Antibody with Actinium-225 (RSC Adv., 2021) — CC BY 3.0",
    href: "https://pubs.rsc.org/en/content/articlehtml/2021/ra/d1ra01214a",
    note: "Used for antibody radioconjugate context and alpha-targeting scaffold logic.",
  },
  {
    id: 5,
    label: "Wikimedia Commons: Antibody basic unit.svg",
    href: "https://commons.wikimedia.org/wiki/File:Antibody_basic_unit.svg",
    note: "Open-source antibody scaffold image used on this page.",
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
    family: "Antibody ligands",
    examples: "radioimmunoconjugates, anti-CD33-style programs",
    whatTheyBuy: "longer residence and strong antigen selectivity when the target biology is clean enough",
    watchout: "Slower penetration and longer normal-tissue exposure windows",
  },
  {
    family: "Peptide ligands",
    examples: "DOTATATE / somatostatin analog logic",
    whatTheyBuy: "fast receptor binding with strong internalization in the right endocrine or receptor-driven settings",
    watchout: "Shorter exposure windows and faster clearance than antibodies",
  },
  {
    family: "Small-molecule ligands",
    examples: "PSMA-617-style urea-based binders",
    whatTheyBuy: "very compact scaffolds that can penetrate tissue quickly and support theranostic workflows",
    watchout: "Kidney, salivary, or other normal-organ uptake can show up early and strongly",
  },
];

const takeaways = [
  {
    title: "The ligand decides where radiation goes",
    body: "Because the payload is always on, the ligand is what determines whether dose lands in tumor or in background organs.",
    refs: [1, 2, 3],
  },
  {
    title: "Internalization is helpful, but not the whole story",
    body: "Some programs benefit from internalization and retention, while others still work by surface residence plus local radiation delivery.",
    refs: [1, 2, 4],
  },
  {
    title: "The best ligand is not always the tightest binder",
    body: "A ligand can bind beautifully and still fail if it pushes the construct into the wrong organs or clears before the isotope has time to help.",
    refs: [1, 2, 3],
  },
];

export default function RdcLigandPage() {
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
          x: [4.6, 3.7, 2.2],
          y: [2.3, 3.8, 4.8],
          text: ["small molecules", "peptides", "antibodies"],
          textposition: ["bottom center", "top center", "top center"],
          marker: {
            size: [34, 34, 36],
            color: ["#8b5cf6", "#38bdf8", "#10b981"],
            line: { color: "#334155", width: 2 },
          },
          hovertemplate:
            "<b>%{text}</b><br>tissue movement: %{x}<br>residence / buffering: %{y}<extra></extra>",
        },
      ],
      {
        margin: { l: 72, r: 24, t: 28, b: 72 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        xaxis: {
          title: "How quickly the ligand class usually moves through tissue",
          range: [1.8, 5],
          tickvals: [2, 3, 4, 5],
          ticktext: ["slower", "mixed", "fast", "very fast"],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        yaxis: {
          title: "How much residence / shielding the scaffold usually brings",
          range: [1.8, 5],
          tickvals: [2, 3, 4, 5],
          ticktext: ["lower", "mixed", "high", "very high"],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        font: {
          family: "Var(--font-manrope), sans-serif",
          color: "#334155",
        },
      },
      {
        displayModeBar: false,
        responsive: true,
      },
    );

    return () => {
      Plotly.purge(plotEl);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="rdc" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/rdcs" className="text-sm text-sky-700">
            rdc overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
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
            ligand
          </Chip>
          <h1 className="site-page-title font-semibold">
            ligands choose the target and the exposure pattern
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            in rdcs, the ligand is not only an address label. it controls how fast the
            construct finds tissue, whether it internalizes or stays on the surface, and
            how much normal-organ background the radionuclide will see along the way.
            {cite(1)}
            {cite(2)}
            {cite(3)}
            {cite(4)}
          </p>
          <RdcSectionTabs active="ligand" />
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                open-source scaffold
              </p>
              <h2 className="site-page-heading font-semibold">
                antibody ligands stay relevant because residence still matters
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4">
              <ZoomableFigure label="Antibody ligand scaffold">
                <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/70 p-4">
                  <Image
                    src="/antibody-basic-unit.svg"
                    alt="Open-source antibody basic unit figure"
                    className="zoom-graphic w-full rounded-xl object-contain"
                  />
                </div>
              </ZoomableFigure>
              <p className="text-sm leading-7 text-zinc-600">
                this image is useful here because it reminds us that rdc ligands can still be
                full antibody scaffolds, not only peptides or small molecules. that longer
                scaffold often buys residence and selectivity, but it also changes tissue
                movement and background exposure.{cite(4)}
                {cite(5)}
              </p>
              <p className="text-xs text-zinc-500">open-source image from Wikimedia Commons.{cite(5)}</p>
            </CardBody>
          </Card>

          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                ligand chemistry
              </p>
              <h2 className="site-page-heading font-semibold">
                representative ligand styles used across the rdc space
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4 md:grid-cols-3">
              <StructureCard
                title="octreotide"
                subtitle="peptide ligand example"
                src="https://pubchem.ncbi.nlm.nih.gov/compound/name/octreotide"
                pubchemQuery="octreotide"
                note="representative peptide-targeting scaffold for somatostatin-receptor radioligand therapy."
              />
              <StructureCard
                title="folic acid"
                subtitle="small-molecule targeting example"
                src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/6037"
                pubchemQuery="folic acid"
                note="a compact receptor-binding vitamin ligand that also illustrates the small-molecule end of targeted conjugate design."
              />
              <StructureCard
                title="PSMA-617"
                subtitle="PSMA small-molecule ligand example"
                src="https://pubchem.ncbi.nlm.nih.gov/compound/name/PSMA-617"
                pubchemQuery="PSMA-617"
                note="representative urea-based PSMA ligand logic behind modern prostate-focused radioligand therapy."
              />
            </CardBody>
          </Card>
        </div>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated plot
            </p>
            <h2 className="site-page-heading font-semibold">
              the ligand class changes movement, residence, and background risk
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what it is showing</p>
                <p className="mt-2">
                  this is a teaching map, not a measured dataset. it helps show why small
                  ligands move faster, antibodies stay longer, and peptides often sit
                  between those two extremes.{cite(1)}
                  {cite(2)}
                  {cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why psma looks different from antibody logic</p>
                <p className="mt-2">
                  psma radioligands work with a compact small-molecule binder, so the field
                  has to think harder about kidney and salivary uptake than a long-circulating
                  antibody program would.{cite(2)}
                  {cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why octreotide still matters</p>
                <p className="mt-2">
                  peptide ligands keep showing up because they can give very real receptor
                  biology with much faster movement than an antibody scaffold.{cite(1)}
                  {cite(3)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              ligand families
            </p>
            <h2 className="site-page-heading font-semibold">
              the main ligand classes used in rdc design
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="RDC ligand families" removeWrapper>
              <TableHeader>
                <TableColumn>family</TableColumn>
                <TableColumn>representative examples</TableColumn>
                <TableColumn>what they buy</TableColumn>
                <TableColumn>what gets harder</TableColumn>
              </TableHeader>
              <TableBody>
                {familyRows.map((row) => (
                  <TableRow key={row.family}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.family}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.examples}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.whatTheyBuy}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.watchout}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              practical takeaways
            </p>
            <h2 className="site-page-heading font-semibold">
              what the ligand usually decides before chemistry can rescue anything
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            {takeaways.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {item.body}
                  {item.refs.map((refId) => cite(refId))}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <SourceList title="verified sources" items={references} />
      </main>
    </div>
  );
}
