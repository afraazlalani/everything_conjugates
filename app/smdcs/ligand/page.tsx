"use client";

import { useEffect, useRef } from "react";
import {
  Button,
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
import { ZoomableFigure } from "@/components/ZoomableFigure";

const references = [
  {
    id: 1,
    label: "Small-Molecule Drug Conjugates: A Review of Recent Advances (Molecular Pharmaceutics, 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.molpharmaceut.4c00009",
    note: "broad SMDC review covering ligand classes, uptake logic, linker design, and payload strategies.",
  },
  {
    id: 2,
    label: "Small-molecule drug conjugates: Recent advances and future prospects (Chinese Chemical Letters, 2024)",
    href: "https://www.sciencedirect.com/science/article/pii/S1001841724000747",
    note: "useful for target-selection tradeoffs and the current SMDC landscape.",
  },
  {
    id: 3,
    label: "Small Molecule-Drug Conjugates: A Review of Recent Advances (Cancers, 2022) — CC BY",
    href: "https://www.mdpi.com/2072-6694/14/2/391",
    note: "good overview of ligand families and why compact conjugates behave differently from larger carriers.",
  },
  {
    id: 4,
    label: "Folate Receptor Alpha—A Novel Approach to Cancer Therapy (IJMS, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38256120/",
    note: "useful for FR-alpha biology, tumor distribution, and normal-tissue context.",
  },
  {
    id: 5,
    label: "A PSMA-targeted doxorubicin small-molecule drug conjugate (Bioorg Med Chem Lett, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38521177/",
    note: "direct SMDC example showing PSMA-targeted small-molecule conjugate logic.",
  },
  {
    id: 6,
    label: "Review on the Increasing Role for PSMA-Based Radioligand Therapy in Prostate Cancer (Cancers, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/39061160/",
    note: "useful for PSMA internalization and radioligand-style small-molecule targeting context.",
  },
  {
    id: 7,
    label: "Small molecule- and peptide-drug conjugates addressing integrins (J Pept Sci, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38382900/",
    note: "good review for integrin-targeted SMDC and peptide-conjugate overlap.",
  },
  {
    id: 8,
    label: "A small-molecule drug conjugate for the treatment of carbonic anhydrase IX expressing tumors (Angew Chem, 2014)",
    href: "https://pubmed.ncbi.nlm.nih.gov/24623670/",
    note: "landmark CAIX-targeted small-molecule drug conjugate example using acetazolamide logic.",
  },
  {
    id: 9,
    label: "A Comparative Analysis of Fibroblast Activation Protein-Targeted Small Molecule-Drug, Antibody-Drug, and Peptide-Drug Conjugates (Bioconjug Chem, 2023)",
    href: "https://pubmed.ncbi.nlm.nih.gov/37399501/",
    note: "direct comparative source for FAP-targeted SMDCs versus other targeting formats.",
  },
  {
    id: 10,
    label: "L-Type amino acid transporter 1 as a target for drug delivery (Pharm Res, 2020)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7203094/",
    note: "helpful for transporter-targeting logic; more delivery-platform than established oncology-SMDC standard.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const ligandRows = [
  {
    family: "folate-receptor ligands",
    target: "folate receptor alpha, and in some settings folate receptor beta",
    upside: "small, high-affinity vitamin-derived scaffold with one of the oldest real SMDC validation stories",
    watchout: "kidney handling and receptor heterogeneity can still narrow the exposure window",
    fit: "oncology programs using folate receptor biology for selective delivery",
  },
  {
    family: "psma-targeting ligands",
    target: "prostate-specific membrane antigen",
    upside: "one of the clearest modern examples of tight target biology plus strong uptake logic",
    watchout: "kidney and salivary exposure often remain part of the design problem",
    fit: "prostate-focused radioligand and SMDC programs",
  },
  {
    family: "short peptide or peptidomimetic ligands",
    target: "integrins, somatostatin receptors, and related receptor biology",
    upside: "highly designable binders that can still stay fairly compact compared with antibodies",
    watchout: "proteolysis, short half-life, and receptor-distribution complexity can all show up quickly",
    fit: "programs sitting near the SMDC-PDC boundary where a short receptor-binding motif is still the best address label",
  },
  {
    family: "synthetic receptor ligands",
    target: "CAIX, FAP, and other medicinal-chemistry-defined receptor pockets",
    upside: "fully synthetic scaffolds can be tuned hard for affinity, handle placement, and stability",
    watchout: "the pharmacophore can be fragile once linker and payload mass get installed",
    fit: "programs using compact synthetic binders instead of vitamin or peptide recognition",
  },
  {
    family: "transporter-oriented ligands",
    target: "transporters or metabolite-recognition systems",
    upside: "compact design and potentially fast uptake",
    watchout: "broad normal-tissue biology can narrow the therapeutic window quickly",
    fit: "non-oncology or metabolism-linked delivery ideas where transport biology is the anchor",
  },
];

const designCards = [
  {
    title: "affinity is not the whole story",
    body: "a ligand can bind beautifully and still fail if it does not trigger enough uptake or if the target route never exposes the linker to the intended compartment.",
  },
  {
    title: "small size changes the game",
    body: "smdcs penetrate tissues fast, but they also see circulation, kidney handling, and extracellular exposure earlier than larger conjugates.",
  },
  {
    title: "where the target lives matters",
    body: "surface density, recycling behavior, and healthy-tissue background often matter more for smdcs because there is less carrier mass to hide behind.",
  },
];

const attachmentRows = [
  {
    site: "distal from the binding pharmacophore",
    why: "keeps the recognition face cleaner so the ligand can still dock the receptor pocket the way it was designed to.",
    watchout: "in very compact ligands, even a distant handle can still change conformation or polarity.",
  },
  {
    site: "through a tolerated substituent",
    why: "lets chemists attach linker mass at a position the SAR already says is more permissive.",
    watchout: "the tolerated position for medicinal chemistry is not always the tolerated position for a full conjugate.",
  },
  {
    site: "through a dedicated spacer",
    why: "adds room between the targeting motif and payload-bearing part of the construct.",
    watchout: "too much spacer can erase permeability and compactness benefits.",
  },
];

const comparisonRows = [
  {
    topic: "carrier size",
    smdc: "very compact, so penetration can be fast and chemistry can stay modular",
    tradeoff: "the same compactness means less shielding from plasma, kidney, and normal-tissue exposure",
  },
  {
    topic: "target engagement logic",
    smdc: "small ligands can fit receptor pockets or transporter biology that do not suit larger proteins",
    tradeoff: "small changes near the pharmacophore can crash affinity quickly",
  },
  {
    topic: "manufacturing flexibility",
    smdc: "small-molecule synthesis and handle installation can be highly modular",
    tradeoff: "every linker or payload change can feed back into permeability and binding much earlier",
  },
  {
    topic: "biodistribution",
    smdc: "fast tissue access can be a real advantage when the target biology is right",
    tradeoff: "fast access can also mean fast off-target distribution if the ligand selectivity story is weak",
  },
];

const emergingLigandCards = [
  {
    title: "dual-targeting ideas",
    body: "two recognition elements can improve selectivity or retention, but they also push the construct away from the clean compactness that makes SMDCs attractive in the first place.",
  },
  {
    title: "multivalent ligands",
    body: "repeating the same binder can buy avidity when one copy is not enough, but it can also raise size, polarity, and synthesis burden fast.",
  },
  {
    title: "environment-responsive ligands",
    body: "these are still more exploratory, but the core idea is to hide or activate binding only under tumor-linked conditions such as local enzymes or acidity.",
  },
];

const failureModes = [
  {
    title: "good affinity, weak uptake",
    body: "a ligand can bind strongly but still fail the program if the receptor does not internalize enough or does not route the conjugate toward the right compartment.",
  },
  {
    title: "great target, poor tolerated handle",
    body: "sometimes the medicinal-chemistry series has a useful binder, but there is no clean spot to install linker mass without damaging the pharmacophore.",
  },
  {
    title: "tumor binding plus normal-tissue biology",
    body: "small ligands often see healthy tissue faster too, so transporter expression, kidney handling, or receptor background can compress the window quickly.",
  },
  {
    title: "ligand wins, whole construct loses",
    body: "the free ligand can look excellent while the conjugate fails because the linker and payload changed polarity, shape, clearance, or steric access too much.",
  },
];

const targetCheckpointRows = [
  {
    question: "is the target actually accessible from blood or interstitium?",
    why: "small ligands move fast, but they still need the receptor or transporter to be physically reachable on the disease-side cells or microenvironment.",
  },
  {
    question: "does binding lead to useful retention or uptake?",
    why: "for some SMDCs, internalization helps. for others, surface retention or local release can still matter. the point is that the biology has to support the linker-payload plan.",
  },
  {
    question: "what healthy tissues share that biology?",
    why: "kidney, salivary gland, liver, and other normal tissues can see small ligands early, so background target expression becomes a much sharper problem.",
  },
  {
    question: "can the ligand tolerate a real conjugation handle?",
    why: "a good free ligand series is not automatically a good conjugate series. the attachment site has to survive linker and payload mass without collapsing the pharmacophore.",
  },
];

const ligandRealityCards = [
  {
    title: "fast penetration can be real",
    body: "compact ligands can move through tissue faster than bulky carriers, which is a big reason SMDC programs stay attractive when diffusion and deep access matter.",
  },
  {
    title: "fast clearance can be just as real",
    body: "the same compactness often means more renal handling and shorter exposure, so the ligand has to buy enough target bias before the construct disappears.",
  },
  {
    title: "some targets favor small carriers",
    body: "receptor pockets, transporter systems, and metabolite-like recognition motifs can suit small ligands better than large protein carriers in certain programs.",
  },
  {
    title: "chemistry tolerance becomes make-or-break",
    body: "with small ligands, every added atom can matter. linker placement and payload mass can shift affinity, permeability, and tissue distribution all at once.",
  },
];

const ligandClasses = [
  {
    title: "folate / vitamin-based ligands",
    target: "folate receptor alpha biology",
    why: "folate is still the most classic SMDC address label because it is small, chemically tractable, and tied to a clinically explored receptor-biology story.",
    caveat: "kidney handling and receptor heterogeneity still matter, so clean receptor expression alone is not the whole answer.",
    refs: [1, 3, 4],
  },
  {
    title: "PSMA ligands",
    target: "prostate-specific membrane antigen",
    why: "psma is one of the strongest modern examples of what small targeting ligands can do, especially in radioligand-style systems and newer non-radioactive smdc builds.",
    caveat: "salivary and kidney uptake remain central design constraints even when the target specificity is strong.",
    refs: [5, 6],
  },
  {
    title: "integrin-binding ligands",
    target: "integrins such as alpha-v-beta-3",
    why: "integrin biology gives access to tumor vasculature, angiogenic compartments, and adhesion-linked targeting ideas. in practice this often overlaps with peptidic or peptidomimetic design.",
    caveat: "the biology can be distributed across tumor and stroma, so selectivity is not always as clean as a single antigen system.",
    refs: [7],
  },
  {
    title: "synthetic receptor ligands",
    target: "caix, fap, and other medicinal-chemistry-defined targets",
    why: "these are attractive because the ligand can be fully synthetic and tuned hard by medicinal chemistry while still staying compact.",
    caveat: "they ask more from SAR work, because every extra atom from linker or payload can still crash the pharmacophore.",
    refs: [8, 9],
  },
  {
    title: "transporter-directed ligands",
    target: "lat1 and related transport biology",
    why: "these exploit metabolic dependencies and transport routes rather than strict receptor overexpression, which can open delivery concepts beyond the standard receptor map.",
    caveat: "this is more exploratory for SMDC oncology than folate or psma, and normal-tissue uptake risk is usually higher.",
    refs: [10],
  },
];

const tradeoffRows = [
  {
    topic: "size versus penetration",
    meaning: "smaller ligands usually penetrate tissue better, but larger or more elaborate ligands can sometimes buy stronger selectivity or slower clearance.",
  },
  {
    topic: "affinity versus distribution",
    meaning: "very high affinity can help target capture, but it can also exaggerate local binding-site barriers or trap the construct in accessible normal tissues.",
  },
  {
    topic: "internalization versus surface retention",
    meaning: "cytotoxic release plans usually need productive uptake, while imaging or extracellularly acting logic can still work with strong surface retention alone.",
  },
  {
    topic: "hydrophilicity versus PK control",
    meaning: "the ligand itself can shift kidney handling, plasma protein binding, and nonspecific distribution before the linker or payload even has a chance to help.",
  },
];

const ligandSources = [
  ...references,
];

export default function SmdcLigandPage() {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const tradeoffRef = useRef<HTMLDivElement | null>(null);

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
    const tradeoffEl = tradeoffRef.current;
    if (!Plotly || !plotEl || !tradeoffEl) return;

    const data = [
      {
        type: "scatter",
        mode: "markers+text",
        x: [4.2, 4.8, 3.4, 3.9, 2.7],
        y: [3.8, 4.4, 3.2, 3.0, 2.8],
        text: ["folate", "psma", "peptide / peptidomimetic", "synthetic receptor", "transporter"],
        textposition: ["top center", "top center", "bottom center", "top center", "bottom center"],
        marker: {
          size: 28,
          color: ["#0ea5e9", "#8b5cf6", "#10b981", "#f97316", "#f59e0b"],
          line: { color: "#334155", width: 2 },
        },
        hovertemplate:
          "<b>%{text}</b><br>target selectivity: %{x}<br>uptake leverage: %{y}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 72, r: 32, t: 28, b: 72 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: "how selective the target biology usually feels",
        range: [2, 5],
        tickvals: [2, 3, 4, 5],
        ticktext: ["broader", "mixed", "strong", "very strong"],
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      yaxis: {
        title: "how much the ligand can bias uptake",
        range: [2, 5],
        tickvals: [2, 3, 4, 5],
        ticktext: ["modest", "useful", "high", "very high"],
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      annotations: [
        {
          x: 2.02,
          y: 4.9,
          text: "more uptake-biased",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
          xanchor: "left",
        },
        {
          x: 4.98,
          y: 2.05,
          text: "more selective target biology",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
          xanchor: "right",
        },
      ],
      font: {
        family: "var(--font-manrope), sans-serif",
        color: "#334155",
      },
    };

    void Plotly.newPlot(plotEl, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    void Plotly.newPlot(
      tradeoffEl,
      [
        {
          type: "bar",
          name: "selectivity ceiling",
          x: ["folate", "psma", "peptide / peptidomimetic", "synthetic receptor", "transporter"],
          y: [4.2, 4.8, 3.5, 3.9, 2.7],
          marker: { color: "#0ea5e9" },
        },
        {
          type: "bar",
          name: "normal-tissue risk",
          x: ["folate", "psma", "peptide / peptidomimetic", "synthetic receptor", "transporter"],
          y: [3.3, 3.8, 3.2, 3.0, 4.3],
          marker: { color: "#f97316" },
        },
        {
          type: "bar",
          name: "conjugation fragility",
          x: ["folate", "psma", "peptide / peptidomimetic", "synthetic receptor", "transporter"],
          y: [2.6, 3.0, 3.8, 4.1, 3.2],
          marker: { color: "#8b5cf6" },
        },
      ],
      {
        barmode: "group",
        margin: { l: 60, r: 24, t: 28, b: 110 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        yaxis: {
          title: "qualitative pressure",
          range: [0, 5.2],
          tickvals: [1, 2, 3, 4, 5],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        xaxis: { tickangle: -12 },
        legend: { orientation: "h", y: 1.16, x: 0 },
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
      Plotly.purge(tradeoffEl);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="smdc" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/smdcs" className="text-sm text-sky-700">
            smdc overview
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
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            targeting ligand
          </Chip>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold sm:text-5xl">
            the ligand decides whether the whole SMDC gets an address or just more exposure
          </h1>
          <p className="max-w-4xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            SMDC ligands have to do two jobs at once: stay small enough to keep the
            compact-conjugate advantage, while still binding a target biology that can
            actually bias uptake and payload exposure in a useful way.
            {cite(1)}
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

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              ligand logic
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what a good SMDC ligand actually has to do
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="SMDC ligand delivery logic">
              <div className="zoom-frame rounded-[1.5rem] border border-sky-100 bg-[linear-gradient(180deg,#f9fcff_0%,#f4f8ff_100%)] p-6 md:p-8">
                <div className="zoom-graphic flex flex-col gap-6">
                  <div className="grid gap-4 md:grid-cols-[1.1fr_auto_1fr_auto_1fr] md:items-center">
                    <div className="rounded-[1.75rem] border-[3px] border-sky-400 bg-sky-100/80 p-6 text-center">
                      <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-sky-800">
                        ligand motif
                      </p>
                      <p className="mt-2 text-base text-slate-600">
                        folate, psma-style, integrin, transporter-linked
                      </p>
                    </div>
                    <div className="flex justify-center text-5xl font-semibold text-slate-800">→</div>
                    <div className="rounded-[1.75rem] border-[3px] border-indigo-400 bg-indigo-100/80 p-6 text-center">
                      <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-indigo-700">
                        target biology
                      </p>
                      <p className="mt-2 text-base text-slate-600">
                        receptor density, recycling, tissue background
                      </p>
                    </div>
                    <div className="flex justify-center text-5xl font-semibold text-slate-800">→</div>
                    <div className="rounded-[1.75rem] border-[3px] border-violet-500 bg-violet-100/70 p-6 text-center">
                      <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-violet-700">
                        delivery outcome
                      </p>
                      <p className="mt-2 text-base text-slate-600">
                        biased uptake, exposure window, and payload access
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    {[
                      "1. bind the intended biology",
                      "2. keep normal-tissue background manageable",
                      "3. preserve permeability and compact size",
                      "4. support the linker and payload instead of fighting them",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-center text-sm font-medium text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ZoomableFigure>

            <div className="grid gap-4 md:grid-cols-3">
              {designCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-zinc-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{card.body}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated trade-off map
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              where each ligand family usually starts costing you something
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={tradeoffRef} className="min-h-[26rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what to look for</p>
                <p className="mt-2">
                  blue is the upside ceiling, orange is the normal-tissue exposure problem, and purple is how easy it is to wreck the ligand once linker and payload mass get attached.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why folate and psma stay popular</p>
                <p className="mt-2">
                  they combine compact chemistry with unusually explicit target biology, which is why so many other ligand ideas still get compared back to them.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why exploratory buckets stay tricky</p>
                <p className="mt-2">
                  transporter-directed and newer dual-responsive concepts can be exciting, but they usually bring more background biology and less clean clinical precedent.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated comparison
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              where common ligand families tend to sit
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
                  farther right means the target story is usually more selective. higher means
                  the ligand more strongly helps bias uptake rather than only binding.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why this is useful</p>
                <p className="mt-2">
                  it helps separate targets that only look nice on paper from ligand systems
                  that actually help a compact conjugate reach the right compartment.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">design reality</p>
                <p className="mt-2">
                  a ligand can win on affinity and still lose the program if conjugation makes
                  it too bulky, too polar, or too exposed to normal tissues.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              ligand classes
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              the main targeting families that actually show up in SMDC work
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ligandClasses.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/70 bg-white/80 p-5">
                <p className="font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-400">target biology</p>
                <p className="mt-1 text-sm leading-7 text-zinc-600">{item.target}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-400">why teams use it</p>
                <p className="mt-1 text-sm leading-7 text-zinc-600">
                  {item.why}
                  {item.refs.map((ref) => cite(ref))}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-400">main watchout</p>
                <p className="mt-1 text-sm leading-7 text-zinc-600">{item.caveat}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              target-selection reality
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              the questions a ligand page has to answer before the chemistry even starts
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-5">
              <Table aria-label="SMDC ligand target checkpoint table" removeWrapper>
                <TableHeader>
                  <TableColumn>checkpoint</TableColumn>
                  <TableColumn>why it matters</TableColumn>
                </TableHeader>
                <TableBody>
                  {targetCheckpointRows.map((row) => (
                    <TableRow key={row.question}>
                      <TableCell className="align-top font-semibold text-zinc-900">{row.question}</TableCell>
                      <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.why}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              {ligandRealityCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-zinc-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{card.body}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative ligands
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              a few target-recognition scaffolds teams actually use
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="folic acid"
              subtitle="folate receptor ligand"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/6037"
              pubchemQuery="folic acid"
              note="representative folate-receptor recognition scaffold used across targeted delivery concepts."
              className="h-full"
            />
            <StructureCard
              title="acetazolamide"
              subtitle="CAIX-directed synthetic ligand example"
              smilesName="acetazolamide"
              pubchemQuery="acetazolamide"
              note="representative compact synthetic ligand used as the anchor for carbonic anhydrase IX-targeted conjugate work."
              className="h-full"
            />
            <StructureCard
              title="L-leucine"
              subtitle="nutrient-mimic / transporter-facing example"
              smilesName="L-leucine"
              pubchemQuery="L-leucine"
              note="stand-in for transporter-directed ligand thinking, where uptake can come from nutrient-recognition biology rather than a classic receptor pocket."
              className="h-full"
            />
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              key trade-offs
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              the balancing acts that usually decide whether the ligand helps or hurts
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-5">
              <Table aria-label="SMDC ligand tradeoff table" removeWrapper>
                <TableHeader>
                  <TableColumn>trade-off</TableColumn>
                  <TableColumn>why it matters in SMDCs</TableColumn>
                </TableHeader>
                <TableBody>
                  {tradeoffRows.map((row) => (
                    <TableRow key={row.topic}>
                      <TableCell className="align-top font-semibold text-zinc-900">{row.topic}</TableCell>
                      <TableCell className="align-top text-sm leading-7 text-zinc-600">{row.meaning}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-4">
              {emergingLigandCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-zinc-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{card.body}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              why this route can win
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what small-molecule ligands buy you, and what they immediately cost
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="SMDC ligand advantages and tradeoffs" removeWrapper>
              <TableHeader>
                <TableColumn>design topic</TableColumn>
                <TableColumn>what can be better</TableColumn>
                <TableColumn>what becomes fragile</TableColumn>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
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

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                family comparison
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
                how the main ligand families differ
              </h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <Table aria-label="SMDC ligand family comparison" removeWrapper>
                <TableHeader>
                  <TableColumn>family</TableColumn>
                  <TableColumn>target biology</TableColumn>
                  <TableColumn>upside</TableColumn>
                  <TableColumn>watchout</TableColumn>
                </TableHeader>
                <TableBody>
                  {ligandRows.map((row) => (
                    <TableRow key={row.family}>
                      <TableCell className="align-top font-semibold text-zinc-900">{row.family}</TableCell>
                      <TableCell className="align-top text-sm text-zinc-600">{row.target}</TableCell>
                      <TableCell className="align-top text-sm text-zinc-600">{row.upside}</TableCell>
                      <TableCell className="align-top text-sm text-zinc-600">{row.watchout}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                attachment logic
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
                where chemists try to leave the pharmacophore alone
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              {attachmentRows.map((row) => (
                <div key={row.site} className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-zinc-900">{row.site}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{row.why}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-400">watchout</p>
                  <p className="mt-1 text-sm leading-7 text-zinc-600">{row.watchout}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              failure map
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              where ligand-led SMDC programs usually stumble
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2">
            {failureModes.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative ligand chemistry
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              real targeting motifs instead of generic icons
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="folic acid"
              subtitle="vitamin-derived targeting ligand"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/6037"
              pubchemQuery="folic acid"
              note="classic FR-targeting ligand used to show what a compact receptor-binding address label really looks like in SMDC chemistry."
            />
            <StructureCard
              title="acetazolamide"
              subtitle="CAIX-targeting small-molecule ligand"
              smilesName="acetazolamide"
              pubchemQuery="acetazolamide"
              note="representative synthetic receptor-binding ligand from the CAIX-targeted SMDC literature."
            />
            <StructureCard
              title="PSMA-617 motif"
              subtitle="urea-based PSMA ligand logic"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/138833474"
              pubchemQuery="PSMA-617"
              note="representative PSMA-binding scaffold showing the small-molecule ligand style behind modern prostate-targeted radioligand and SMDC design."
            />
          </CardBody>
        </Card>

        <SourceList title="verified sources" items={ligandSources} />
      </main>
    </div>
  );
}
