"use client";

import { useEffect, useRef, useState } from "react";
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
import { StructureCard } from "@/components/StructureCard";
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
  {
    id: 5,
    label:
      "Peptide-drug conjugates for targeted cancer therapy (Beilstein J. Org. Chem., 2018)",
    href: "https://www.beilstein-journals.org/bjoc/articles/14/80",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const chapterCards = [
  {
    title: "Peptides",
    href: "/pdcs/peptide",
    text: "linear ligands, cpp-style entry peptides, and why affinity alone does not guarantee productive delivery.",
  },
  {
    title: "Linker",
    href: "/pdcs/linker",
    text: "release triggers, self-immolative spacers, and why short carriers make linker behavior matter even more.",
  },
  {
    title: "Payload",
    href: "/pdcs/payload",
    text: "cytotoxic, imaging, and immune payload logic, plus what payload properties fit peptide delivery best.",
  },
];

const compareRows = [
  {
    question: "Carrier size",
    pdc: "short peptide carriers are compact and can penetrate tissue quickly",
    adc: "antibody carriers are much larger and usually penetrate more slowly",
  },
  {
    question: "Half-life",
    pdc: "often shorter unless stabilized by cyclization, albumin binders, or other PK tricks",
    adc: "usually longer because FcRn recycling helps keep antibodies in circulation",
  },
  {
    question: "Targeting logic",
    pdc: "depends on peptide affinity, receptor density, protease stability, and rapid distribution",
    adc: "depends on antigen selectivity, internalization, and antibody developability",
  },
  {
    question: "Where PDCs can win",
    pdc: "fast penetration, modular synthesis, and access to receptor motifs that fit peptides well",
    adc: "longer exposure, established manufacturing, and broad oncology precedent",
  },
];

const bottleneckCards = [
  {
    title: "Protease stability",
    text: "a peptide can bind beautifully in vitro and still get trimmed too fast in plasma or tissue unless the sequence is hardened.",
  },
  {
    title: "Renal clearance",
    text: "small carriers leave the body fast, so pdc programs often add cyclization, lipids, peg, or albumin-binding logic to buy exposure.",
  },
  {
    title: "Productive uptake",
    text: "binding is not enough; the conjugate still has to reach the compartment where the linker can release or the payload can act.",
  },
  {
    title: "Payload fit",
    text: "not every warhead that works on an adc makes sense on a peptide, because pdc copy number and pk look different.",
  },
];

const useCaseCards = [
  {
    title: "Fast tissue access",
    text: "when the value of the carrier is getting in and out of tissue faster than an antibody can, peptides can make more sense than larger biologics.",
  },
  {
    title: "Modular synthesis",
    text: "peptide sequence, linker, and payload can often be iterated quickly, which helps when teams are still searching for the right carrier logic.",
  },
  {
    title: "Compact theranostics",
    text: "small carriers can pair well with imaging or radionuclide concepts where fast target access and cleaner timing windows matter.",
  },
];

export default function PdcsPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");
  const plotRef = useRef<HTMLDivElement | null>(null);
  const mermaidDiagram = `flowchart LR
    A["targeting peptide<br/>receptor binding or tissue homing"] --> B["linker<br/>stay intact or release on cue"]
    B --> C["payload<br/>cytotoxic, imaging, or immune signal"]

    A --- D["1. bind and bias uptake"]
    B --- E["2. survive long enough"]
    B --- F["3. release or stay intact"]
    C --- G["4. act in the right compartment"]

    classDef sky fill:#e0f2fe,stroke:#38bdf8,color:#0f172a,stroke-width:2px;
    classDef indigo fill:#eef2ff,stroke:#818cf8,color:#312e81,stroke-width:2px;
    classDef violet fill:#f5f3ff,stroke:#8b5cf6,color:#6d28d9,stroke-width:2px;
    classDef slate fill:#ffffff,stroke:#cbd5e1,color:#334155,stroke-width:1.5px;

    class A sky;
    class B indigo;
    class C violet;
    class D,E,F,G slate;`;

  useEffect(() => {
    const renderDiagram = async () => {
      const mermaid = (
        window as typeof window & {
          mermaid?: {
            initialize: (cfg: {
              startOnLoad: boolean;
              theme?: string;
              securityLevel?: string;
              flowchart?: { htmlLabels?: boolean; curve?: string; nodeSpacing?: number; rankSpacing?: number };
            }) => void;
            render: (id: string, text: string) => Promise<{ svg: string }>;
          };
        }
      ).mermaid;

      if (!mermaid) return false;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "loose",
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          nodeSpacing: 48,
          rankSpacing: 66,
        },
      });

      try {
        const { svg } = await mermaid.render(`pdc-architecture-${Date.now()}`, mermaidDiagram);
        setMermaidSvg(svg);
        return true;
      } catch {
        return false;
      }
    };

    if (mermaidSvg) return;
    let cancelled = false;
    const tryRender = async () => {
      for (let attempt = 0; attempt < 8 && !cancelled; attempt += 1) {
        const ok = await renderDiagram();
        if (ok) return;
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
    };

    void tryRender();

    return () => {
      cancelled = true;
    };
  }, [mermaidDiagram, mermaidSvg]);

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
        type: "scatter",
        mode: "markers+text",
        name: "modalities",
        x: [4.5, 1.8, 3.5],
        y: [2.3, 4.6, 1.9],
        text: ["pdc", "adc", "small-molecule"],
        textposition: ["top center", "top center", "bottom center"],
        marker: {
          size: [26, 30, 22],
          color: ["#0ea5e9", "#8b5cf6", "#22c55e"],
          line: { color: "#334155", width: 1.5 },
        },
        hovertemplate:
          "%{text}<br>tissue access: %{x}<br>circulation persistence: %{y}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 56, r: 20, t: 24, b: 56 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: { text: "tissue access and speed", font: { size: 16, color: "#334155" } },
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
        range: [1, 5],
        tickvals: [1, 3, 5],
        ticktext: ["lower", "mid", "higher"],
      },
      yaxis: {
        title: { text: "circulation persistence", font: { size: 16, color: "#334155" } },
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
        range: [1, 5],
        tickvals: [1, 3, 5],
        ticktext: ["lower", "mid", "higher"],
      },
      font: { family: "Var(--font-manrope), sans-serif", color: "#0f172a" },
      showlegend: false,
      annotations: [
        {
          x: 1.05,
          y: 4.9,
          xref: "paper",
          yref: "paper",
          text: "harder to penetrate, longer-lived",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
          xanchor: "right",
        },
        {
          x: 0.02,
          y: -0.2,
          xref: "paper",
          yref: "paper",
          text: "faster to access tissue, but often shorter-lived",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
          xanchor: "left",
        },
      ],
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
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="text-sm text-sky-700">
            back to home
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
            peptide-drug conjugates (pdcs)
          </Chip>
          <h1 className="site-page-title font-semibold">
            what pdcs are, why they matter, and where they fit
          </h1>
          <p className="max-w-4xl text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            pdcs join a targeting peptide, a linker, and a drug or imaging payload into
            one compact conjugate. they matter because peptides can move through tissue
            faster than antibodies, can be synthesized modularly, and can access receptor
            motifs that are awkward for larger biologics, but they also pay a real price
            in stability and exposure.{cite(1)}{cite(2)}{cite(3)}{cite(4)}
          </p>
          <PdcSectionTabs active="overview" />
        </motion.section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {chapterCards.map((card) => (
            <Link key={card.title} href={card.href} className="block">
              <Card className="h-full border border-white/80 bg-white/70 transition hover:border-sky-200 hover:bg-white/85">
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="rounded-2xl border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#f1f7ff_100%)] p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm uppercase tracking-[0.22em] text-sky-500">
                        chapter
                      </span>
                      <span className="text-2xl text-sky-600">↗</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-base leading-8 text-zinc-600">{card.text}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              architecture
            </p>
            <h2 className="site-page-heading font-semibold">
              how a pdc is put together
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <ZoomableFigure label="pdc architecture and delivery logic">
              <div className="zoom-frame rounded-2xl border border-white/70 bg-white/85 p-6">
                <div
                  className="mermaid-flow min-h-[24rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what is different from adc logic</p>
                <p className="mt-2">
                  the peptide is usually not giving you Fc-driven half-life or a huge
                  carrier scaffold, so pdc performance is much more sensitive to local
                  proteolysis, renal loss, and how fast the target tissue is reached.
                  {cite(1)}{cite(2)}{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why this class is rising</p>
                <p className="mt-2">
                  pdcs are attractive where fast penetration, modular synthesis, and
                  receptor-directed precision matter more than long antibody-like
                  exposure. that makes them interesting in oncology, imaging, and some
                  non-oncology targeted programs.{cite(1)}{cite(3)}{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what they are used for</p>
                <p className="mt-2">
                  most programs still center on targeted delivery of cytotoxics or
                  radionuclide/imaging payloads, but the platform also opens the door to
                  inflammatory and theranostic payloads that pair better with a compact
                  carrier.{cite(1)}{cite(2)}{cite(5)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              modality map
            </p>
            <h2 className="site-page-heading font-semibold">
              where pdcs usually sit between adcs and small molecules
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[22rem] w-full" />
            </div>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">how to read it</p>
                <p className="mt-2">
                  this is a qualitative map, not a measured dataset. it is there to show
                  the usual tradeoff: pdcs can move faster through tissue than adcs, but
                  they usually give up a lot of built-in exposure.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why pdcs are interesting</p>
                <p className="mt-2">
                  they often live in the middle zone where teams want more targeting than a
                  naked small molecule can give, but a smaller carrier than a full antibody.
                  {cite(1)}{cite(2)}{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what still has to be earned</p>
                <p className="mt-2">
                  the peptide still has to bind in real tissue, survive long enough, and
                  route the conjugate to the place where the payload actually becomes useful.
                  {cite(1)}{cite(3)}{cite(5)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              comparison
            </p>
            <h2 className="site-page-heading font-semibold">
              where pdcs sit versus adcs
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="pdc versus adc comparison"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>question</TableColumn>
                <TableColumn>pdc</TableColumn>
                <TableColumn>adc</TableColumn>
              </TableHeader>
              <TableBody>
                {compareRows.map((row) => (
                  <TableRow key={row.question}>
                    <TableCell className="font-semibold text-zinc-900">{row.question}</TableCell>
                    <TableCell>{row.pdc}</TableCell>
                    <TableCell>{row.adc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              chemistry preview
            </p>
            <h2 className="site-page-heading font-semibold">
              representative pdc building blocks you will keep seeing
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StructureCard
                title="Arg-Glu-Asp"
                subtitle="representative targeting motif"
                src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/471573"
                pubchemQuery="Arg-Glu-Asp"
                note="one simple stand-in for peptide-side recognition logic: short sequence motifs are often where the targeting story starts."
              />
              <StructureCard
                title="Val-Cit"
                subtitle="representative cleavable linker"
                src="https://pubchem.ncbi.nlm.nih.gov/compound/name/L-Valyl-L-citrulline"
                pubchemQuery="L-Valyl-L-citrulline"
                note="a common reminder that pdc linkers still have to solve stability-versus-release, not only attachment."
                category="linker"
              />
              <StructureCard
                title="MMAE"
                subtitle="representative payload"
                src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/11542188"
                pubchemQuery="monomethyl auristatin E"
                note="one classic high-potency payload example. pdcs do use payloads like this, but the peptide carrier changes the exposure logic around them."
                category="payload"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {useCaseCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
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
              bottlenecks
            </p>
            <h2 className="site-page-heading font-semibold">
              why pdcs are needed and why they are hard
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {bottleneckCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">{card.title}</p>
                <p className="mt-2">{card.text}</p>
              </div>
            ))}
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
