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
import { RdcSectionTabs } from "@/components/RdcSectionTabs";

const references = [
  {
    id: 1,
    label: "LUTATHERA (lutetium Lu 177 dotatate) prescribing information (FDA)",
    href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/208700s000lbl.pdf",
    note: "used for DOTA-linked therapeutic radioligand context.",
  },
  {
    id: 2,
    label: "PLUVICTO (lutetium Lu 177 vipivotide tetraxetan) prescribing information (FDA)",
    href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/215833s000lbl.pdf",
    note: "used for therapeutic chelator-plus-ligand design in approved PSMA radioligand therapy.",
  },
  {
    id: 3,
    label: "Lutetium Lu 177 Vipivotide Tetraxetan: First Approval (Drugs, 2022)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9099330/",
    note: "used for radionuclide-chelator matching and clinical radioligand context.",
  },
  {
    id: 4,
    label: "Chelators and their metal complexes in medicine (J Chem Soc Rev, 2015)",
    href: "https://pubmed.ncbi.nlm.nih.gov/25867774/",
    note: "used for chelator-class background and why macrocyclic vs acyclic scaffolds behave differently.",
  },
  {
    id: 5,
    label: "Bifunctional chelators for radiometals (J Med Chem, 2020)",
    href: "https://pubmed.ncbi.nlm.nih.gov/32877260/",
    note: "used for DOTA / NOTA / DTPA comparison logic and isotope-fit tradeoffs.",
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
    chelator: "DOTA-family macrocycles",
    isotopeFit: "Lu-177, Y-90 and other therapeutic metals where strong long-lived binding matters",
    whatItBuys: "high thermodynamic and kinetic stability in clinically important therapy settings",
    watchout: "can ask for harsher labeling conditions and adds real bulk to the construct",
  },
  {
    chelator: "NOTA-family macrocycles",
    isotopeFit: "Ga-68 and some Cu-class diagnostic logic",
    whatItBuys: "excellent fit for smaller radiometals and strong imaging-oriented chelation behavior",
    watchout: "not the universal answer for larger therapeutic isotopes",
  },
  {
    chelator: "DTPA-like acyclic chelators",
    isotopeFit: "historically important indium / yttrium-style logic and faster labeling routes",
    whatItBuys: "simpler coordination chemistry and useful kit-style practicality in some settings",
    watchout: "usually less kinetically inert than the stronger macrocyclic therapy standards",
  },
];

const notes = [
  {
    title: "the chelator is part of the payload",
    body: "with rdcs, the radionuclide cannot be separated from the chelator discussion because unstable metal handling turns into off-target radiation fast.",
    refs: [1, 2, 3, 5],
  },
  {
    title: "metal fit beats generic stability talk",
    body: "the right question is not only “is this a good chelator?” but “is this the right chelator for this isotope, labeling workflow, and ligand scaffold?”",
    refs: [3, 4, 5],
  },
  {
    title: "buildability still matters",
    body: "a chelator can be chemically excellent and still create trouble if labeling conditions, size, or linker geometry fight the ligand.",
    refs: [4, 5],
  },
];

export default function RdcChelatorPage() {
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
          x: [4.8, 3.8, 2.8],
          y: [3.2, 4.4, 2.2],
          text: ["DOTA", "NOTA", "DTPA"],
          textposition: ["bottom center", "top center", "bottom center"],
          marker: {
            size: [36, 34, 34],
            color: ["#6366f1", "#0ea5e9", "#f97316"],
            line: { color: "#334155", width: 2 },
          },
          hovertemplate:
            "<b>%{text}</b><br>therapy-metal fit: %{x}<br>labeling convenience: %{y}<extra></extra>",
        },
      ],
      {
        margin: { l: 72, r: 24, t: 28, b: 72 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        xaxis: {
          title: "how strong the chelator fit is for therapy-oriented radiometals",
          range: [2.2, 5.1],
          tickvals: [2.5, 3.5, 4.5],
          ticktext: ["lower", "mid", "higher"],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        yaxis: {
          title: "how easy the coordination / labeling workflow often feels",
          range: [1.8, 5],
          tickvals: [2, 3, 4, 5],
          ticktext: ["harder", "mixed", "easier", "much easier"],
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
            chelator
          </Chip>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold sm:text-6xl">
            chelators decide whether the metal behaves like a payload or a liability
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            a chelator is not filler chemistry on an rdc. it is the metal-holding core that
            decides whether the isotope stays attached through labeling, circulation, target
            binding, and decay. that is why chelator choice shows up directly in efficacy,
            dosimetry, and safety.{cite(1)}
            {cite(2)}
            {cite(3)}
            {cite(4)}
            {cite(5)}
          </p>
          <RdcSectionTabs active="chelator" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative chelators
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              the three chelator families that explain most of the rdc conversation
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="DOTA"
              subtitle="macrocyclic therapy workhorse"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/name/DOTA"
              pubchemQuery="DOTA"
              note="strong therapy-oriented chelator logic that shows up in approved Lu-177 radioligands."
              category="linker"
            />
            <StructureCard
              title="NOTA"
              subtitle="compact macrocycle for smaller radiometals"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/name/1%2C4%2C7-triazacyclononane-1%2C4%2C7-triacetic%20acid"
              pubchemQuery="1,4,7-triazacyclononane-1,4,7-triacetic acid"
              note="representative chelator logic when the metal fit favors a smaller macrocycle and strong imaging-style coordination."
              category="linker"
            />
            <StructureCard
              title="DTPA"
              subtitle="acyclic chelator class"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/name/diethylenetriaminepentaacetic%20acid"
              pubchemQuery="diethylenetriaminepentaacetic acid"
              note="represents the more acyclic end of radiometal coordination chemistry, where build convenience can be better but kinetic inertness is often lower."
              category="linker"
            />
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated plot
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              chelator choice is usually a trade between isotope fit and build convenience
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
                  farther right means stronger fit for therapy-style radiometals. higher means
                  the coordination chemistry and labeling workflow are often easier to execute.
                  this is a teaching map, not a measured dataset.{cite(4)}
                  {cite(5)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why dota keeps showing up</p>
                <p className="mt-2">
                  DOTA keeps winning in therapy settings because the field values strong
                  metal retention even when labeling can be more demanding.{cite(1)}
                  {cite(2)}
                  {cite(5)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why nota and dtpa still matter</p>
                <p className="mt-2">
                  different metals and workflows pull chemists toward different chelators, so
                  “best chelator” only makes sense after the isotope and platform are fixed.
                  {cite(4)}
                  {cite(5)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              chelator families
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what each chelator family is usually trying to optimize
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="RDC chelator families" removeWrapper>
              <TableHeader>
                <TableColumn>family</TableColumn>
                <TableColumn>best isotope fit</TableColumn>
                <TableColumn>what it buys</TableColumn>
                <TableColumn>watchout</TableColumn>
              </TableHeader>
              <TableBody>
                {familyRows.map((row) => (
                  <TableRow key={row.chelator}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.chelator}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.isotopeFit}</TableCell>
                    <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.whatItBuys}</TableCell>
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
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what chelator choice changes before dose ever reaches tumor
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            {notes.map((item) => (
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
