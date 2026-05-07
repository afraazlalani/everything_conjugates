"use client";

import { useEffect, useRef } from "react";
import {
  Button,
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

const references = [
  {
    id: 1,
    label:
      "Small Molecule-Drug Conjugates: A Review of Recent Advances (Cancers, 2022) - CC BY",
    href: "https://www.mdpi.com/2072-6694/14/2/391",
    note: "Review used for SMDC architecture, ligand-linker-payload framing, and the CC BY schematic shown on this page.",
  },
  {
    id: 2,
    label:
      "Small-Molecule Drug Conjugates: A Review of Recent Advances (Molecular Pharmaceutics, 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.molpharmaceut.4c00009",
    note: "Broad SMDC review used for modality-level tradeoffs, penetration logic, and payload/linker sensitivity.",
  },
  {
    id: 3,
    label:
      "Small-molecule drug conjugates: Recent advances and future prospects (Chinese Chemical Letters, 2024)",
    href: "https://www.sciencedirect.com/science/article/pii/S1001841724000747",
    note: "Used for current-platform context and why compact conjugates behave differently from ADCs.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const parts = [
  {
    title: "Targeting ligand",
    desc: "The small recognition element has to bind useful disease biology without losing its own pharmacophore when linker and payload mass are attached.",
    refs: [1, 2, 3],
    structure: {
      title: "Folic acid",
      subtitle: "Real ligand example",
      src: "https://pubchem.ncbi.nlm.nih.gov/compound/CID/6037",
      pubchemQuery: "folic acid",
      note: "A concrete small-molecule targeting ligand rather than a generic icon. folate-style ligands are part of the classic SMDC story.",
      category: undefined,
    },
  },
  {
    title: "Linker",
    desc: "The connector is balancing survival in circulation, spacing, and what chemical species actually reaches the target tissue.",
    refs: [1, 2],
    structure: {
      title: "SMCC",
      subtitle: "Real linker example",
      smilesName: "SMCC",
      pubchemQuery: "SMCC",
      note: "A real connector-style motif showing the kind of chemistry that can turn attachment and spacing into a practical linker problem.",
      category: "linker" as const,
    },
  },
  {
    title: "Payload",
    desc: "The active cargo has to match the exposure window that a compact small-molecule carrier can realistically provide.",
    refs: [1, 2],
    structure: {
      title: "MMAE",
      subtitle: "Real payload example",
      src: "https://pubchem.ncbi.nlm.nih.gov/compound/CID/11542188",
      pubchemQuery: "monomethyl auristatin E",
      note: "A real payload example, so the overview starts from actual conjugate chemistry instead of a placeholder symbol.",
      category: "payload" as const,
    },
  },
];

const whyCards = [
  {
    title: "Why people still care about SMDCs",
    body: "They can be chemically modular, penetrate tissue quickly, and fit target classes where compact ligands make more sense than large protein carriers.",
  },
  {
    title: "Why they are hard",
    body: "They see plasma, kidney handling, and normal tissues early, so every ligand, linker, and payload choice becomes exposed much faster.",
  },
  {
    title: "Where the design leverage sits",
    body: "SMDC performance often turns on the interaction between target biology, linker stability, and what payload state the construct actually delivers.",
  },
];

const landscapeRows = [
  {
    topic: "Tissue penetration",
    smdc: "often fast because the construct stays compact",
    tradeoff: "fast access can come with fast off-target distribution too",
  },
  {
    topic: "Half-life and exposure",
    smdc: "more tunable through chemistry and size",
    tradeoff: "usually shorter and more exposed than antibody carriers",
  },
  {
    topic: "Manufacturing modularity",
    smdc: "strong medicinal-chemistry style flexibility",
    tradeoff: "small changes in linker or payload can disrupt the whole profile",
  },
  {
    topic: "Target class fit",
    smdc: "can exploit receptors, transporters, and small-molecule recognition motifs",
    tradeoff: "the target needs to tolerate a real conjugate, not only the free ligand",
  },
];

export default function SmdcsPage() {
  const plotRef = useRef<HTMLDivElement | null>(null);
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

    const plotEl = plotRef.current;
    const pressureEl = pressureRef.current;
    if (!Plotly || !plotEl || !pressureEl) return;

    const data = [
      {
        type: "scatter",
        mode: "markers+text",
        x: [4.5, 3.2, 2.0],
        y: [2.1, 3.2, 4.3],
        text: ["smdcs", "small molecules", "adcs"],
        textposition: ["top center", "top center", "bottom center"],
        marker: {
          size: [34, 30, 34],
          color: ["#0ea5e9", "#8b5cf6", "#10b981"],
          line: { color: "#334155", width: 2 },
        },
        hovertemplate:
          "<b>%{text}</b><br>tissue penetration: %{x}<br>carrier shielding: %{y}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 72, r: 32, t: 28, b: 72 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: "How quickly the modality can move through tissue",
        range: [1.5, 5],
        tickvals: [2, 3, 4, 5],
        ticktext: ["slower", "mixed", "fast", "very fast"],
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      yaxis: {
        title: "How much carrier shielding it usually has",
        range: [1.5, 5],
        tickvals: [2, 3, 4, 5],
        ticktext: ["low", "mixed", "high", "very high"],
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      annotations: [
        {
          x: 4.95,
          y: 1.65,
          text: "faster, more exposed",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
          xanchor: "right",
        },
        {
          x: 1.65,
          y: 4.9,
          text: "slower, more shielded",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
          xanchor: "left",
        },
      ],
      font: {
        family: "Var(--font-manrope), sans-serif",
        color: "#334155",
      },
    };

    void Plotly.newPlot(plotEl, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    void Plotly.newPlot(
      pressureEl,
      [
        {
          type: "bar",
          name: "ligand pressure",
          x: ["target fit", "pk sensitivity", "steric tolerance", "normal-tissue risk"],
          y: [4.8, 4.1, 4.6, 4.2],
          marker: { color: "#0ea5e9" },
        },
        {
          type: "bar",
          name: "linker pressure",
          x: ["target fit", "pk sensitivity", "steric tolerance", "normal-tissue risk"],
          y: [2.6, 4.4, 3.9, 3.8],
          marker: { color: "#6366f1" },
        },
        {
          type: "bar",
          name: "payload pressure",
          x: ["target fit", "pk sensitivity", "steric tolerance", "normal-tissue risk"],
          y: [2.2, 4.8, 4.0, 4.7],
          marker: { color: "#8b5cf6" },
        },
      ],
      {
        barmode: "group",
        margin: { l: 60, r: 24, t: 28, b: 80 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        yaxis: {
          title: "Qualitative design pressure",
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
      Plotly.purge(pressureEl);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="smdc" />

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
            small molecule-drug conjugates (smdcs)
          </Chip>
          <h1 className="site-page-title font-semibold">
            compact ligands with tunable pharmacokinetics
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            SMDCs use small-molecule ligands to deliver payloads with compact size, rapid
            tissue penetration, and adjustable pharmacokinetics. they sit in a useful middle
            ground between bare small molecules and large antibody carriers, which is why so
            much of the design tension lives in ligand tolerance, linker behavior, and
            exposure control.{cite(1)}
            {cite(2)}
            {cite(3)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href="/smdcs/ligand" radius="full" className="bg-sky-600 text-white">
              ligand page
            </Button>
            <Button
              as={Link}
              href="/smdcs/linker"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              linker page
            </Button>
            <Button
              as={Link}
              href="/smdcs/payload"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              payload page
            </Button>
          </div>
        </motion.section>

        <section className="grid gap-6 md:grid-cols-3">
          {parts.map((item) => (
            <Card key={item.title} className="border border-white/80 bg-white/70">
              <CardBody className="flex flex-col gap-5 p-6">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                  {item.desc}
                  {item.refs.map((refId) => cite(refId))}
                </p>
                <div className="rounded-[1.25rem] border border-white/80 bg-white/80 p-3">
                  <StructureCard
                    title={item.structure.title}
                    subtitle={item.structure.subtitle}
                    src={("src" in item.structure && item.structure.src) || undefined}
                    smilesName={("smilesName" in item.structure && item.structure.smilesName) || undefined}
                    pubchemQuery={item.structure.pubchemQuery}
                    note={item.structure.note}
                    category={item.structure.category}
                    className="border-0 bg-transparent shadow-none"
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              architecture
            </p>
            <h2 className="site-page-heading font-semibold">
              how an smdc is put together
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="SMDC architecture schematic">
              <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/60 p-3">
                <Image
                  src="/images/ccby/smdc-mdpi-fig1.jpg"
                  alt="Small molecule drug conjugate schematic (CC BY)"
                  className="zoom-graphic w-full rounded-xl object-contain"
                />
              </div>
            </ZoomableFigure>
            <p className="text-sm leading-7 text-zinc-600">
              this open-source figure is useful because it shows the basic SMDC logic very
              honestly: a small targeting moiety, a linker that often has to solve release or
              spacing, and a payload whose profile can dominate the whole construct once the
              carrier gets into tissue.{cite(1)}
            </p>
            <p className="text-xs text-zinc-500">cc-by figure from MDPI Cancers.{cite(1)}</p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              why this class exists
            </p>
            <h2 className="site-page-heading font-semibold">
              what SMDCs are trying to keep, and what they give up
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            {whyCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{card.body}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated comparison
            </p>
            <h2 className="site-page-heading font-semibold">
              where smdcs often sit between small molecules and adcs
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[25rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">how to read it</p>
                <p className="mt-2">
                  farther right means better tissue movement. higher means more carrier mass
                  or shielding. smdcs are interesting because they can move faster than
                  antibodies while still carrying modular payload chemistry.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what that means in practice</p>
                <p className="mt-2">
                  the platform can reach targets quickly, but it also loses some of the buffer
                  that large carriers provide against plasma exposure and normal-tissue
                  distribution.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why chemistry matters so much</p>
                <p className="mt-2">
                  because the construct is small, ligand tolerance, linker behavior, and
                  payload polarity all become visible earlier and more sharply.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative chemistry
            </p>
            <h2 className="site-page-heading font-semibold">
              three stand-in pieces that show the build logic
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StructureCard
              title="folic acid"
              subtitle="representative ligand logic"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/6037"
              pubchemQuery="folic acid"
              note="stand-in for small targeting ligands that bind receptor biology directly."
            />
            <StructureCard
              title="acetazolamide"
              subtitle="synthetic receptor-ligand example"
              smilesName="acetazolamide"
              pubchemQuery="acetazolamide"
              note="represents compact synthetic binders used in CAIX-style small-molecule targeting."
            />
            <StructureCard
              title="val-cit"
              subtitle="representative linker trigger"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/9921644"
              pubchemQuery="L-Valyl-L-citrulline"
              note="stand-in for trigger-bearing linker logic when intracellular processing matters."
              category="linker"
            />
            <StructureCard
              title="SMCC"
              subtitle="stable connector example"
              smilesName="SMCC"
              pubchemQuery="SMCC"
              note="stand-in for stable connector chemistry when the linker is doing more spacing and attachment work than triggered release."
              category="linker"
            />
            <StructureCard
              title="MMAE"
              subtitle="representative payload"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/11542188"
              pubchemQuery="monomethyl auristatin E"
              note="stand-in for the high-potency payload class often discussed in conjugate design."
              category="payload"
            />
            <StructureCard
              title="DOTA"
              subtitle="radiometal-chelator payload system"
              smilesName="DOTA"
              pubchemQuery="DOTA"
              note="represents the chelator half of radioligand-style SMDCs, where the functional payload is the metal-loaded chelate complex."
              category="payload"
            />
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated pressure map
            </p>
            <h2 className="site-page-heading font-semibold">
              which part of an smdc usually causes the next problem
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={pressureRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">ligand usually breaks first on biology</p>
                <p className="mt-2">
                  if the address label is wrong, the whole construct gets exposed to normal tissue long before linker or payload cleverness can save it.
                  {cite(2)}
                  {cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">linker usually breaks first on chemistry</p>
                <p className="mt-2">
                  compact constructs see plasma and filtration early, so linker behavior often decides whether the active species reaches tissue intact.
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">payload usually breaks first on tolerability</p>
                <p className="mt-2">
                  once the warhead is too hydrophobic or too dangerous for the exposure window, the rest of the construct starts carrying impossible burden.
                  {cite(1)}
                  {cite(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              platform reality
            </p>
            <h2 className="site-page-heading font-semibold">
              where SMDCs can look strong, and where they break
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="SMDC strengths and liabilities" removeWrapper>
              <TableHeader>
                <TableColumn>design topic</TableColumn>
                <TableColumn>what can look better</TableColumn>
                <TableColumn>what still turns into the problem</TableColumn>
              </TableHeader>
              <TableBody>
                {landscapeRows.map((row) => (
                  <TableRow key={row.topic}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.topic}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.smdc}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.tradeoff}</TableCell>
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
