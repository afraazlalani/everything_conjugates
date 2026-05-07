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
import { EnzymaticSectionTabs } from "@/components/EnzymaticSectionTabs";
import { StructureCard } from "@/components/StructureCard";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const methods = [
  {
    slug: "transglutaminase",
    title: "Transglutaminase",
    summary:
      "enzyme-assisted amide formation at reactive glutamines, often after controlled antibody preparation.",
    bestFor:
      "Teams that want a defined enzymatic coupling route without rewriting the whole antibody architecture.",
  },
  {
    slug: "sortase",
    title: "Sortase A",
    summary:
      "LPXTG-tag recognition followed by ligation to oligoglycine-bearing partners at a defined site.",
    bestFor:
      "Programs that can tolerate a short recognition tag and want clean ligation chemistry at one chosen position.",
  },
  {
    slug: "glycan-remodeling",
    title: "Glycan remodeling",
    summary:
      "enzymatic trimming and rebuilding of the conserved Fc glycan to install a click-ready handle.",
    bestFor:
      "Fc-based antibodies where teams want site control through the native glycan rather than the polypeptide backbone.",
  },
  {
    slug: "glycoconnect",
    title: "GlycoConnect",
    summary:
      "a glycan-centered platform workflow that turns Fc glycan engineering into a reproducible conjugation route.",
    bestFor:
      "Homogeneous ADC-style manufacturing strategies that want a processable glycan-first platform.",
  },
];

const comparisonRows = [
  {
    method: "transglutaminase",
    why: "defined amide coupling at selected glutamine sites",
    strengths: "good site control, mild conditions, no cysteine engineering required",
    tradeoffs: "enzyme access and local protein context still control yield",
  },
  {
    method: "sortase a",
    why: "tag-directed ligation at one programmed sequence motif",
    strengths: "very explicit site definition and modular partner coupling",
    tradeoffs: "needs sequence tags and can add process complexity",
  },
  {
    method: "glycan remodeling",
    why: "uses the native Fc glycan as the installation point",
    strengths: "avoids direct backbone mutation and can preserve the main antibody sequence",
    tradeoffs: "depends on glycan processing quality and glycoanalytics",
  },
  {
    method: "glycoconnect",
    why: "turns glycan editing into a broader conjugation platform",
    strengths: "homogeneous products and strong manufacturing logic",
    tradeoffs: "platform-specific workflow and more specialized process development",
  },
];

const chemistryComparisonRows = [
  {
    chemistry: "lysine acylation",
    siteControl: "low",
    homogeneity: "broad distribution of positional isomers and DAR species",
    operationalStyle: "simple and scalable",
    bestUse:
      "when robustness and broad compatibility matter more than exact site definition",
  },
  {
    chemistry: "native cysteine / interchain disulfide reduction",
    siteControl: "medium",
    homogeneity: "better than lysine, but still a DAR distribution",
    operationalStyle: "widely used clinical workflow",
    bestUse:
      "when teams want higher efficiency than lysine without moving to a fully engineered platform",
  },
  {
    chemistry: "engineered site-specific routes",
    siteControl: "high",
    homogeneity: "tightest positional control",
    operationalStyle: "requires engineering and extra development work",
    bestUse:
      "when site choice itself is a major lever for PK, stability, or safety",
  },
  {
    chemistry: "enzymatic / glycan",
    siteControl: "high",
    homogeneity: "narrow DAR and cleaner product definition",
    operationalStyle: "process-heavy but highly controlled",
    bestUse:
      "when teams want site-specific conjugation through enzyme recognition or Fc glycan editing rather than broad residue reactivity",
  },
];

const motifCards = [
  {
    title: "Amine-bearing linker end",
    subtitle: "Common transglutaminase coupling partner logic",
    smiles: "NCCCO",
    note: "Enzyme-mediated glutamine coupling often hands off to a primary-amine-bearing linker or handle.",
    category: "linker" as const,
  },
  {
    title: "Oligoglycine acceptor",
    subtitle: "Sortase nucleophile partner",
    smiles: "NCC(=O)NCC(=O)NCC(=O)O",
    note: "Sortase ligation uses an oligoglycine-bearing partner to capture the tagged protein intermediate.",
    category: "linker" as const,
  },
  {
    title: "Azide handle",
    subtitle: "Glycan-remodeling click entry point",
    smiles: "N=[N+]=[N-]",
    note: "Glycan editing workflows often install an azide-like click handle before downstream ligation.",
    category: "linker" as const,
  },
];

const landscapeNotes = [
  {
    title: "Lysine",
    note: "Easy to run at scale, but broad residue reactivity means weaker positional control.",
    tone: "slate",
    index: "1",
  },
  {
    title: "Native cysteine",
    note: "More controlled than lysine, but still a distribution rather than one fully defined site.",
    tone: "zinc",
    index: "2",
  },
  {
    title: "Engineered site-specific",
    note: "Very high control, but it asks for protein engineering and extra development work.",
    tone: "indigo",
    index: "3",
  },
  {
    title: "Transglutaminase",
    note: "Enzyme recognition improves site definition without forcing a full engineered-cysteine platform.",
    tone: "sky",
    index: "4",
  },
  {
    title: "Sortase A",
    note: "Very explicit ligation logic, but only if the construct can tolerate a recognition tag.",
    tone: "violet",
    index: "5",
  },
  {
    title: "Glycan remodeling",
    note: "High control through the Fc glycan, with more dependence on glycoanalytics and process quality.",
    tone: "emerald",
    index: "6",
  },
  {
    title: "GlycoConnect",
    note: "The most platform-like option here: very controlled, but also one of the most workflow-heavy.",
    tone: "amber",
    index: "7",
  },
];

const references = [
  {
    id: 1,
    label:
      "Antibody-drug conjugates: recent advances in conjugation and linker chemistries (Protein & Cell, 2018)",
    href: "https://pubmed.ncbi.nlm.nih.gov/27743348/",
  },
  {
    id: 2,
    label:
      "Linker in antibody–drug conjugates: a review of linker chemistry (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article/7/3/tbae020/7717690",
  },
  {
    id: 3,
    label:
      "Transglutaminase-mediated antibody conjugation (Bioconjugate Chemistry, 2024)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11227664/",
  },
  {
    id: 4,
    label:
      "Glycan remodeling for site-specific Fc conjugation (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article-abstract/7/3/233/7710329",
  },
  {
    id: 5,
    label:
      "Improved Sortase A variants for site-specific antibody conjugation (Sci. Reports, 2016)",
    href: "https://www.nature.com/articles/srep31899",
  },
  {
    id: 6,
    label:
      "Glycoconjugation using mutant GalT and bioorthogonal click chemistry (PMC, 2015)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4606561/",
  },
  {
    id: 7,
    label:
      "GlycoConnect for homogeneous ADCs and improved stability (PMC, 2024)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11612762/",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function EnzymaticChemistryPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");
  const plotRef = useRef<HTMLDivElement | null>(null);

  const mermaidDiagram = `flowchart LR
    A["antibody or Fc scaffold"] --> B{"where do we install control?"}
    B --> C["transglutaminase\\nreactive glutamine site"]
    B --> D["sortase a\\nLPXTG tag + oligoglycine"]
    B --> E["glycan remodeling\\nedit conserved Fc glycan"]
    B --> F["glycoconnect\\nplatformized glycan workflow"]
    C --> G["defined handle placement"]
    D --> G
    E --> G
    F --> G
    G --> H["cleaner DAR / positional control\\nand easier structure-activity readout"]
  `;

  useEffect(() => {
    const renderMermaid = async () => {
      const mermaid = (
        window as typeof window & {
          mermaid?: {
            initialize: (cfg: Record<string, unknown>) => void;
            render: (id: string, text: string) => Promise<{ svg: string }>;
          };
        }
      ).mermaid;

      if (!mermaid) return;

      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        securityLevel: "loose",
        flowchart: {
          curve: "basis",
          nodeSpacing: 40,
          rankSpacing: 60,
          padding: 20,
          useMaxWidth: true,
          htmlLabels: true,
        },
        themeVariables: {
          fontFamily: "var(--font-manrope), sans-serif",
          fontSize: "20px",
          primaryColor: "#f8fbff",
          primaryBorderColor: "#bae6fd",
          primaryTextColor: "#0f172a",
          lineColor: "#0f172a",
          secondaryColor: "#eef2ff",
          tertiaryColor: "#f0fdf4",
        },
      });

      const { svg } = await mermaid.render(`enzymatic-flow-${Date.now()}`, mermaidDiagram);
      setMermaidSvg(svg);
    };

    if (!mermaidSvg) {
      void renderMermaid();
    }
  }, [mermaidDiagram, mermaidSvg]);

  useEffect(() => {
    const plotEl = plotRef.current;
    if (!plotEl) return;

    const Plotly = (
      window as typeof window & {
        Plotly?: {
          newPlot: (
            element: HTMLElement,
            data: Array<Record<string, unknown>>,
            layout: Record<string, unknown>,
            config?: Record<string, unknown>,
          ) => Promise<unknown> | unknown;
          purge: (element: HTMLElement) => void;
          Plots?: { resize: (element: HTMLElement) => void };
        };
      }
    ).Plotly;

    if (!Plotly) return;

    const plotData = [
      {
        type: "scatter",
        mode: "markers+text",
        name: "residue-driven routes",
        x: [1.2, 2.6, 4.5],
        y: [1.0, 1.8, 3.8],
        text: ["1", "2", "3"],
        textposition: "middle center",
        textfont: { size: 12, color: "#0f172a" },
        marker: {
          size: [28, 30, 32],
          color: ["#94a3b8", "#71717a", "#6366f1"],
          line: { color: "#475569", width: 1.5 },
        },
        hovertemplate:
          "<b>%{customdata}</b><br>site control: %{x}<br>workflow burden: %{y}<extra></extra>",
        customdata: ["lysine", "native cysteine", "engineered site-specific"],
      },
      {
        type: "scatter",
        mode: "markers+text",
        name: "enzymatic / glycan routes",
        x: [4.2, 4.7, 4.4, 4.8],
        y: [2.8, 3.1, 3.5, 4.2],
        text: ["4", "5", "6", "7"],
        textposition: "middle center",
        textfont: { size: 12, color: "#0f172a" },
        marker: {
          size: [30, 30, 31, 33],
          color: ["#38bdf8", "#8b5cf6", "#22c55e", "#f59e0b"],
          line: { color: "#0f172a", width: 1.5 },
        },
        hovertemplate:
          "<b>%{customdata}</b><br>site control: %{x}<br>workflow burden: %{y}<extra></extra>",
        customdata: ["transglutaminase", "sortase a", "glycan remodeling", "glycoconnect"],
      },
    ];

    const plotLayout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(255,255,255,0.85)",
      margin: { l: 72, r: 24, t: 24, b: 72 },
      xaxis: {
        title: { text: "site control", standoff: 12 },
        range: [0.5, 5.2],
        gridcolor: "#dbeafe",
        zeroline: false,
        tickmode: "array",
        tickvals: [1, 2, 3, 4, 5],
        ticktext: ["low", "", "mid", "", "high"],
      },
      yaxis: {
        title: { text: "workflow burden", standoff: 12 },
        range: [0.5, 4.8],
        gridcolor: "#dbeafe",
        zeroline: false,
        tickmode: "array",
        tickvals: [1, 2, 3, 4],
        ticktext: ["low", "", "", "high"],
      },
      showlegend: false,
      annotations: [],
      font: {
        family: "Var(--font-manrope), sans-serif",
        color: "#334155",
        size: 14,
      },
    };

    void Plotly.newPlot(plotEl, plotData, plotLayout, {
      displayModeBar: false,
      responsive: true,
    });

    const onResize = () => {
      Plotly.Plots?.resize(plotEl);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      Plotly.purge(plotEl);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="main" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <div className="h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_20px_2px_rgba(14,165,233,0.6)]" />
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)] text-zinc-900"
          >
            Everything Conjugates
          </Link>
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/" className="text-sm text-sky-700">
            home
          </Link>
          <Link href="/#conjugation-chemistry" className="text-sm text-sky-700">
            conjugation chemistry
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            enzymatic / glycan
          </Chip>
          <h1 className="site-page-title font-semibold">
            enzymatic and glycan-based conjugation
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            This chemistry family uses enzymes or glycan-processing workflows to place
            conjugation handles at defined sites. teams use it when random lysine or
            cysteine coupling is too heterogeneous and when a narrower DAR profile,
            cleaner analytics, or a more controlled attachment position matters.
            {cite(1)}
            {cite(2)}
            {cite(4)}
          </p>
          <EnzymaticSectionTabs active="overview" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              overview
            </p>
            <h2 className="site-page-heading font-semibold">
              what this chemistry family is trying to solve
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600 md:grid-cols-2">
            <p>
              Enzymatic and glycan-based methods are site-selective attachment
              strategies. instead of reacting broadly across many residues, they rely
              on sequence recognition or Fc-glycan editing to create one controlled
              installation point. that usually means tighter product definition and
              better batch consistency.{cite(2)}{cite(4)}
            </p>
            <p>
              They are used when homogeneity is worth extra process engineering:
              highly potent ADCs, programs sensitive to site-dependent activity, or
              manufacturing strategies that need clearer structure-activity
              relationships than random conjugation can provide.{cite(1)}{cite(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              control map
            </p>
            <h2 className="site-page-heading font-semibold">
              where enzymatic and glycan chemistry introduce control
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Enzymatic and glycan conjugation control map">
              <div
                className="mermaid-flow min-h-[24rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
              />
            </ZoomableFigure>
            <div className="grid gap-3 md:grid-cols-3 text-sm text-zinc-600">
              <div className="rounded-xl border border-sky-100 bg-white/70 p-4">
                <p className="font-semibold text-zinc-900">protein-side recognition</p>
                <p className="mt-2">
                  transglutaminase and sortase create control by reading a chosen
                  protein feature, either an accessible glutamine context or a short
                  recognition tag.{cite(3)}{cite(5)}
                </p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-white/70 p-4">
                <p className="font-semibold text-zinc-900">glycan-side recognition</p>
                <p className="mt-2">
                  glycan routes shift the installation site away from amino-acid
                  side chains and onto the conserved Fc glycan scaffold.{cite(4)}{cite(6)}
                </p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-white/70 p-4">
                <p className="font-semibold text-zinc-900">why it matters</p>
                <p className="mt-2">
                  once the handle goes in at one controlled spot, analytics,
                  comparability, and DAR interpretation usually get much cleaner.
                  {cite(1)}{cite(2)}{cite(7)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {methods.map((method) => (
            <Link
              key={method.slug}
              href={`/chemistry/enzymatic/${method.slug}`}
              className="group block no-underline"
            >
              <Card className="h-full border border-white/80 bg-white/70 transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-sky-200 group-hover:bg-white/85">
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="rounded-[1rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-4">
                    <p className="text-lg font-semibold text-zinc-900 font-[family-name:var(--font-space-grotesk)]">
                      {method.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">
                      {method.summary}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      best fit
                    </p>
                    <p className="text-sm leading-7 text-zinc-600">{method.bestFor}</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              interactive comparison
            </p>
            <h2 className="site-page-heading font-semibold">
              where these chemistries sit on the control-versus-complexity map
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            <p className="rounded-xl border border-sky-100 bg-white/70 p-4">
              this map compares two things at once: how tightly each chemistry controls
              <em> where</em> conjugation happens, and how much extra process work that
              control usually costs.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/70 bg-white/70 p-4">
                <p className="font-semibold text-zinc-900">why teams look at this tradeoff</p>
                <p className="mt-2">
                  chemistry choice is rarely only about yield. it also changes how
                  interpretable the ADC becomes, how clean the DAR profile is, and how
                  much manufacturing effort a team has to accept to get that control.
                  {cite(1)}{cite(2)}{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/70 p-4">
                <p className="font-semibold text-zinc-900">how to use the map</p>
                <p className="mt-2">
                  use it as a framing tool, not a scoring rubric. if a program needs
                  stronger site control than lysine or native cysteine can offer, this
                  plot helps show which higher-control routes may be worth the added
                  process complexity.
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-xl border border-white/70 bg-white/70 p-4">
                <div className="relative">
                  <div
                    ref={plotRef}
                    className="h-[24rem]"
                  />
                  <span className="pointer-events-none absolute bottom-2 left-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                    easier, less controlled
                  </span>
                  <span className="pointer-events-none absolute right-2 top-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                    more controlled, more work
                  </span>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {landscapeNotes.map((item) => {
                  const tones: Record<
                    string,
                    { box: string; badge: string; text: string }
                  > = {
                    slate: {
                      box: "border-slate-200 bg-slate-50",
                      badge: "bg-slate-500 text-white",
                      text: "text-slate-700",
                    },
                    zinc: {
                      box: "border-zinc-200 bg-zinc-50",
                      badge: "bg-zinc-500 text-white",
                      text: "text-zinc-700",
                    },
                    indigo: {
                      box: "border-indigo-200 bg-indigo-50",
                      badge: "bg-indigo-500 text-white",
                      text: "text-indigo-700",
                    },
                    sky: {
                      box: "border-sky-200 bg-sky-50",
                      badge: "bg-sky-500 text-white",
                      text: "text-sky-700",
                    },
                    violet: {
                      box: "border-violet-200 bg-violet-50",
                      badge: "bg-violet-500 text-white",
                      text: "text-violet-700",
                    },
                    emerald: {
                      box: "border-emerald-200 bg-emerald-50",
                      badge: "bg-emerald-500 text-white",
                      text: "text-emerald-700",
                    },
                    amber: {
                      box: "border-amber-200 bg-amber-50",
                      badge: "bg-amber-500 text-white",
                      text: "text-amber-700",
                    },
                  };
                  const tone = tones[item.tone];
                  return (
                    <div
                      key={item.title}
                      className={`rounded-xl border p-3 ${tone.box}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${tone.badge}`}
                        >
                          {item.index}
                        </span>
                        <p className="font-semibold text-zinc-900">{item.title}</p>
                      </div>
                      <p className={`mt-2 text-sm leading-6 ${tone.text}`}>{item.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
              <p className="font-semibold text-zinc-900">main takeaway</p>
              <p className="mt-2">
                enzymatic and glycan routes usually earn their place when site
                definition itself becomes a product-quality lever. they are rarely the
                lightest workflow, but they can make downstream analytics, comparability,
                and structure-activity learning much cleaner.
                {cite(2)}{cite(4)}{cite(7)}
              </p>
            </div>
            <p>
              this is a qualitative design map, not a measured dataset. the main
              takeaway is that enzymatic and glycan routes usually sit to the right
              of lysine and native cysteine because they deliver more positional
              control, but they also sit higher because that control usually comes
              with more workflow and analytics overhead.{cite(1)}{cite(2)}{cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              chemistry motifs
            </p>
            <h2 className="site-page-heading font-semibold">
              representative handles that show up around this chemistry family
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            {motifCards.map((item) => (
              <StructureCard key={item.title} {...item} className="h-full" />
            ))}
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              why teams use it
            </p>
            <h2 className="site-page-heading font-semibold">
              main advantages over less controlled chemistries
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600 md:grid-cols-2">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">what gets better</p>
              <p className="mt-2">
                narrower DAR distribution, cleaner positional control, stronger
                reproducibility, and easier interpretation of how site choice changes
                efficacy, PK, or safety.{cite(2)}{cite(4)}{cite(7)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">what gets harder</p>
              <p className="mt-2">
                enzyme sourcing, extra process steps, glycoanalytics, and the need to
                validate that the chosen site still preserves antigen binding, Fc
                biology, and manufacturability.{cite(1)}{cite(2)}{cite(4)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              comparison
            </p>
            <h2 className="site-page-heading font-semibold">
              how the four methods differ
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="comparison of enzymatic and glycan-based conjugation methods"
              className="rounded-xl border border-white/70 bg-white/60"
            >
              <TableHeader>
                <TableColumn>Method</TableColumn>
                <TableColumn>Why teams choose it</TableColumn>
                <TableColumn>Strengths</TableColumn>
                <TableColumn>Tradeoffs</TableColumn>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.method}>
                    <TableCell>{row.method}</TableCell>
                    <TableCell>{row.why}</TableCell>
                    <TableCell>{row.strengths}</TableCell>
                    <TableCell>{row.tradeoffs}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-zinc-500">
              no one route is universally best. the right choice depends on whether the
              program can tolerate sequence tags, wants to stay on the Fc glycan, or
              needs a platform process that consistently delivers homogeneous products.
              {cite(3)}{cite(4)}{cite(5)}{cite(7)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              chemistry landscape
            </p>
            <h2 className="site-page-heading font-semibold">
              how this family compares with lysine, cysteine, and other controlled routes
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="comparison of enzymatic chemistry against other conjugation chemistries"
              className="rounded-xl border border-white/70 bg-white/60"
            >
              <TableHeader>
                <TableColumn>Chemistry</TableColumn>
                <TableColumn>Site control</TableColumn>
                <TableColumn>Homogeneity</TableColumn>
                <TableColumn>Operational style</TableColumn>
                <TableColumn>Best use case</TableColumn>
              </TableHeader>
              <TableBody>
                {chemistryComparisonRows.map((row) => (
                  <TableRow key={row.chemistry}>
                    <TableCell>{row.chemistry}</TableCell>
                    <TableCell>{row.siteControl}</TableCell>
                    <TableCell>{row.homogeneity}</TableCell>
                    <TableCell>{row.operationalStyle}</TableCell>
                    <TableCell>{row.bestUse}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-zinc-500">
              short version: lysine is easier but less defined, native cysteine is a
              strong middle ground, engineered site-specific routes give maximum
              positional control, and enzymatic or glycan methods are attractive when
              teams want that higher control without relying only on residue-level
              engineering.{cite(1)}{cite(2)}{cite(3)}{cite(4)}{cite(5)}
            </p>
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
