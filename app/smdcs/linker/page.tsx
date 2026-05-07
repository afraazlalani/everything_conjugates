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
    label: "Small Molecule-Drug Conjugates: Opportunities for the Development of Targeted Anticancer Drugs (Pharmaceutics, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38396351/",
    note: "Good broad review of SMDC architecture, linker families, and payload-release logic.",
  },
  {
    id: 2,
    label: "Amanitin-Based Fc-Small Molecule Drug Conjugates with Minimal Premature Release and Increased Plasma Stability (2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/41841414/",
    note: "Useful when discussing why some small-format targeted conjugates lean toward non-cleavable or more stable linker logic.",
  },
  {
    id: 3,
    label: "Mono-amino acid linkers enable highly potent small molecule-drug conjugates by conditional release (2024)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11163218/",
    note: "Important SMDC paper showing why simpler cleavable linkers matter in compact ligand systems.",
  },
  {
    id: 4,
    label: "Vintafolide: a novel targeted therapy for the treatment of folate receptor expressing tumors (2015)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4480526/",
    note: "Classic folate-targeted SMDC context for disulfide-containing release logic.",
  },
  {
    id: 5,
    label: "Folate-vinca alkaloid conjugates for cancer therapy (2014)",
    href: "https://pubmed.ncbi.nlm.nih.gov/24564229/",
    note: "Primary-source context for folate-vinca SMDC architecture and release strategy.",
  },
  {
    id: 6,
    label: "Synthesis and Evaluation of a Non-Peptide Small-Molecule Drug Conjugate with Val-Ala linker logic (2022)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9035832/",
    note: "Useful for small-format protease-cleavable linker examples beyond classic Val-Cit.",
  },
  {
    id: 7,
    label: "The Importance of Linker Chemistry in Targeted Drug Delivery (2021)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7817242/",
    note: "Good review for ester, carbonate, carbamate, and self-immolative logic.",
  },
  {
    id: 8,
    label: "Lutetium Lu 177 Vipivotide Tetraxetan: First Approval (2022)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9099330/",
    note: "Useful when explaining chelator-spacer systems in radioligand-style small-molecule targeting.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const familyCards = [
  {
    title: "Cleavable linkers",
    body: "These are built to break under a trigger like reduction, lysosomal proteases, or acidity so the payload can be released in or near the target cell in a more active form.",
    refs: [1, 3],
  },
  {
    title: "Non-cleavable linkers",
    body: "These usually favor plasma stability and lower premature release, but they make the active species more dependent on intracellular processing or on an intact functional construct.",
    refs: [1, 2],
  },
];

const linkerRows = [
  {
    family: "Disulfide / self-immolative disulfide",
    trigger: "Reducing intracellular environment",
    upside: "Compact release logic with strong historical SMDC precedent in folate-style systems",
    risk: "Too much lability can leak payload before the construct reaches the target biology",
    fit: "internalizing SMDCs where reductive release is part of the design story",
  },
  {
    family: "Val-cit / peptide-cleavable",
    trigger: "Lysosomal proteases such as cathepsin-biased environments",
    upside: "Strong intracellular release track record and good compatibility with self-immolative spacers",
    risk: "Bulk and species-specific instability can matter more in small ligands than in antibodies",
    fit: "internalizing targets that truly reach protease-rich compartments",
  },
  {
    family: "Val-ala / related peptide-cleavable",
    trigger: "Protease-dependent intracellular cleavage",
    upside: "Can tune cleavage behavior differently from val-cit while keeping the same general release logic",
    risk: "Still requires the right uptake route and can still add synthetic or steric burden",
    fit: "small-format builds optimizing the balance between stability and lysosomal release",
  },
  {
    family: "Simplified mono-amino-acid cleavable",
    trigger: "Endosome / lysosome-responsive cleavage with smaller motifs",
    upside: "Reduces linker bulk and synthetic overhead in a modality that is very sensitive to every extra atom",
    risk: "Still needs validation because simple does not automatically mean broadly stable",
    fit: "newer SMDC builds trying to preserve compactness while keeping triggered release",
  },
  {
    family: "Acid-labile hydrazone",
    trigger: "Acidifying compartments or acidic microenvironments",
    upside: "Chemically intuitive trigger when pH is the intended gate",
    risk: "Selectivity can be soft and premature hydrolysis can punish circulation stability",
    fit: "older or narrower designs where acid lability matches the biological plan",
  },
  {
    family: "Non-cleavable / stable connector",
    trigger: "Usually none; intact delivery or later degradation logic",
    upside: "Maximizes plasma stability and can reduce premature payload release",
    risk: "The active species may no longer be the free parent payload",
    fit: "programs where premature release is more dangerous than slower intracellular activation",
  },
  {
    family: "Chelator-spacer systems",
    trigger: "Usually none; the intact metal-chelate is the payload system",
    upside: "Ideal for radioligand-style SMDCs where the linker also tunes spacing and pharmacokinetics",
    risk: "The chemistry has to preserve both target binding and metal-chelate stability",
    fit: "PSMA-style or other radiometal-targeted small-molecule constructs",
  },
  {
    family: "Peg / spacer-heavy modules",
    trigger: "Usually none by itself",
    upside: "Improves spacing, hydrophilicity, and steric separation",
    risk: "Too much spacer can dilute permeability or weaken the compact advantage of SMDCs",
    fit: "crowded constructs where ligand and payload need breathing room",
  },
];

const placementRows = [
  {
    site: "ligand-facing junction",
    why: "keeps the targeting pharmacophore pointed at the receptor while separating the payload mass from the binding motif",
    watchout: "Too much crowding here can weaken affinity fast in small ligands",
  },
  {
    site: "central spacer region",
    why: "gives room to tune distance, polarity, and release chemistry without rewriting the ligand or payload core",
    watchout: "Bulky central linkers can erase the size advantage that makes SMDCs attractive",
  },
  {
    site: "payload-facing trigger",
    why: "lets the released species be tuned closer to the business end of the construct",
    watchout: "The thing that gets released may be linker-payload, not always naked drug",
  },
];

const releaseCards = [
  {
    title: "Stay intact long enough",
    body: "SMDCs usually do not have antibody-like shielding, so the linker often sees plasma, kidney filtration, and extracellular enzymes much earlier.",
  },
  {
    title: "Release in the right place",
    body: "Good linker logic is tied to the uptake route. if the ligand does not truly internalize, a triggered linker may never see the compartment it was designed for.",
  },
  {
    title: "Protect the ligand too",
    body: "In compact conjugates, linker choices can hit affinity, permeability, and clearance at the same time. the linker is not only a release switch.",
  },
];

const bondClassCards = [
  {
    title: "Carbamate",
    subtitle: "Amine-bearing payload attachment logic",
    smiles: "COC(=O)NC",
    note: "Carbamates are often chosen when the payload has an amine and the design wants more hydrolytic stability than a simple ester.",
  },
  {
    title: "Carbonate",
    subtitle: "Alcohol-bearing payload attachment logic",
    smiles: "COC(=O)OC",
    note: "Carbonates can work well for alcohol-containing payloads, but they usually need careful stability tuning in compact constructs.",
  },
  {
    title: "Ester",
    subtitle: "Simple but more hydrolysis-prone bond class",
    smiles: "CC(=O)OC",
    note: "Esters are synthetically easy and sometimes useful, but they are usually the first class teams worry about if premature hydrolysis is already a risk.",
  },
  {
    title: "Thioether",
    subtitle: "Stable non-cleavable connector logic",
    smiles: "CSCC",
    note: "Thioether-style stable connections matter when the whole point is to stay intact and avoid early payload loss.",
  },
];

const chemistrySources = [
  ...references.map(({ label, href, note }) => ({ label, href, note })),
];

export default function SmdcLinkerPage() {
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

    const data = [
      {
        type: "scatter",
        mode: "markers+text",
        x: [1.7, 2.5, 3.1, 4.2, 4.5],
        y: [4.2, 3.4, 4.4, 1.6, 1.3],
        text: ["hydrazone", "disulfide", "val-cit", "triazole", "peg spacer"],
        textposition: ["top center", "top center", "top center", "top center", "bottom center"],
        marker: {
          size: 26,
          color: ["#f59e0b", "#8b5cf6", "#06b6d4", "#2563eb", "#10b981"],
          line: { color: "#334155", width: 2 },
        },
        hovertemplate:
          "<b>%{text}</b><br>stability: %{x}<br>release dependence: %{y}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 72, r: 32, t: 28, b: 70 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: "Plasma / extracellular stability",
        range: [1, 5],
        tickvals: [1, 2, 3, 4, 5],
        ticktext: ["lower", "guarded", "balanced", "high", "very high"],
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      yaxis: {
        title: "Dependence on triggered release",
        range: [1, 5],
        tickvals: [1, 2, 3, 4, 5],
        ticktext: ["low", "limited", "mixed", "high", "very high"],
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      annotations: [
        {
          x: 1.05,
          y: 4.9,
          text: "more release-sensitive",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
          xanchor: "left",
        },
        {
          x: 4.95,
          y: 1.05,
          text: "more intact / connector-like",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
          xanchor: "right",
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

    return () => {
      Plotly.purge(plotEl);
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
            linker
          </Chip>
          <h1 className="site-page-title font-semibold">
            the linker decides whether an smdc behaves cleanly or falls apart early
          </h1>
          <p className="max-w-4xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            in small molecule-drug conjugates, the linker is doing more than release. it has
            to preserve ligand binding, survive circulation long enough, and decide what
            chemical species actually reaches the target site.{cite(1)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              as={Link}
              href="/smdcs/ligand"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              ligand page
            </Button>
            <Button as={Link} href="/smdcs/linker" radius="full" className="bg-sky-600 text-white">
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
              broad families
            </p>
            <h2 className="site-page-heading font-semibold">
              most SMDC linkers still fall into cleavable versus non-cleavable logic
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2">
            {familyCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-5">
                <p className="text-xl font-semibold text-zinc-900">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {card.body}
                  {card.refs.map((refId) => (
                    <span key={`${card.title}-${refId}`}>{cite(refId)}</span>
                  ))}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              bond classes
            </p>
            <h2 className="site-page-heading font-semibold">
              the attachment bond still decides what chemistry survives
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {bondClassCards.map((card) => (
              <StructureCard
                key={card.title}
                title={card.title}
                subtitle={card.subtitle}
                smiles={card.smiles}
                note={card.note}
                category="linker"
                className="h-full"
              />
            ))}
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              connector logic
            </p>
            <h2 className="site-page-heading font-semibold">
              what the linker is actually solving
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="SMDC linker architecture logic">
              <div className="zoom-frame rounded-[1.5rem] border border-sky-100 bg-[linear-gradient(180deg,#f9fcff_0%,#f4f8ff_100%)] p-6 md:p-8">
                <div className="zoom-graphic flex flex-col gap-6">
                  <div className="grid gap-4 md:grid-cols-[1.15fr_auto_0.85fr_auto_1.1fr] md:items-center">
                    <div className="rounded-[1.75rem] border-[3px] border-sky-400 bg-sky-100/80 p-6 text-center">
                      <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-sky-800">
                        targeting ligand
                      </p>
                      <p className="mt-2 text-base text-slate-600">
                        receptor or transporter recognition
                      </p>
                    </div>
                    <div className="flex justify-center text-5xl font-semibold text-slate-800">→</div>
                    <div className="rounded-[1.75rem] border-[3px] border-indigo-400 bg-indigo-100/80 p-6 text-center">
                      <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-indigo-700">
                        linker
                      </p>
                      <p className="mt-2 text-base text-slate-600">
                        spacing, stability, trigger, polarity
                      </p>
                    </div>
                    <div className="flex justify-center text-5xl font-semibold text-slate-800">→</div>
                    <div className="rounded-[1.75rem] border-[3px] border-violet-500 bg-violet-100/70 p-6 text-center">
                      <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-violet-700">
                        payload
                      </p>
                      <p className="mt-2 text-base text-slate-600">
                        cytotoxic, imaging, or immune-active cargo
                      </p>
                    </div>
                  </div>

                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    "1. keep the ligand binding",
                    "2. survive plasma and renal exposure",
                    "3. release at the right trigger, or stay intact on purpose",
                      "4. deliver the intended chemical species to tissue",
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
              {releaseCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-zinc-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{card.body}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-5 text-sm leading-7 text-zinc-600">
              in smdcs, the linker is often also a spacer and a pharmacokinetic tuning element,
              not only a release switch. that is a bigger deal here than in adcs because small
              ligands tolerate extra bulk and polarity poorly.{cite(1)}{cite(3)}{cite(7)}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated comparison
            </p>
            <h2 className="site-page-heading font-semibold">
              where common SMDC linker families usually sit
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
                  farther right means the linker more often behaves like a stable connector.
                  higher means the design is leaning harder on a trigger to create the active
                  species at the target site.{cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why this matters more in smdcs</p>
                <p className="mt-2">
                  compact conjugates usually expose the linker earlier to plasma, filtration,
                  and extracellular biology, so stability and release can fail sooner than in
                  shielded antibody systems.{cite(1)}{cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">design shortcut</p>
                <p className="mt-2">
                  if your ligand barely internalizes, a trigger-heavy linker may never see its
                  intended compartment. in that case, an intact-delivery or alternate-release
                  strategy is usually safer.{cite(1)}{cite(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative motifs
            </p>
            <h2 className="site-page-heading font-semibold">
              real linker pieces teams actually think about
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StructureCard
              title="val-cit"
              subtitle="protease-cleavable trigger with classic PABC-style logic"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/9921644"
              pubchemQuery="L-Valyl-L-citrulline"
              note="representative lysosomal trigger when internalization and protease access are part of the design. val-cit-pabc remains one of the most influential triggered-release motifs in targeted conjugates, even if teams now sometimes simplify it for SMDC use."
              category="linker"
            />
            <StructureCard
              title="val-ala"
              subtitle="alternative protease-cleavable motif"
              smiles="CC(C)[C@H](NC(=O)[C@H](N)C(=O)O)C(=O)N[C@@H](C)C(=O)O"
              pubchemQuery="L-valyl-L-alanine"
              note="another intracellular protease-sensitive motif used when teams want a different stability-versus-cleavage balance than val-cit."
              category="linker"
            />
            <StructureCard
              title="hydrazone"
              subtitle="acid-labile logic"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/9561072"
              pubchemQuery="benzaldehyde hydrazone"
              note="representative pH-sensitive linker logic for acidifying compartments."
              category="linker"
            />
            <StructureCard
              title="disulfide"
              subtitle="reductive-release motif"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/95116"
              pubchemQuery="dipropyl disulfide"
              note="stand-in for reducible linker logic in intracellular redox environments, including the classic folate-vinca style systems built around disulfide release."
              category="linker"
            />
            <StructureCard
              title="asn-style single amino acid"
              subtitle="simplified cleavable linker idea"
              smiles="NC(CC(=O)O)C(=O)O"
              pubchemQuery="asparagine"
              note="single-amino-acid cleavable logic became interesting in newer SMDC work because smaller linkers can preserve compactness and simplify synthesis."
              category="linker"
            />
            <StructureCard
              title="triazole"
              subtitle="click-stable connector"
              smiles="N1N=CC=C1"
              pubchemQuery="1,2,3-triazole"
              note="stable clicked connection often used when assembly modularity matters more than triggered cleavage."
              category="linker"
            />
            <StructureCard
              title="DOTA"
              subtitle="chelator-spacer logic for radioligands"
              smilesName="DOTA"
              note="in radioligand-type SMDCs, the linker region often includes a chelator-spacer system rather than a classic cleavable payload-release module."
              category="linker"
            />
            <StructureCard
              title="peg-like spacer"
              subtitle="solubility and spacing motif"
              smiles="OCCOCCOCCO"
              pubchemQuery="triethylene glycol"
              note="representative spacer logic for solubility tuning and steric separation."
              category="linker"
            />
          </CardBody>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                family comparison
              </p>
              <h2 className="site-page-heading font-semibold">
                what each linker family is trying to optimize
              </h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <Table aria-label="SMDC linker family comparison" removeWrapper>
                <TableHeader>
                  <TableColumn>family</TableColumn>
                  <TableColumn>trigger</TableColumn>
                  <TableColumn>upside</TableColumn>
                  <TableColumn>main risk</TableColumn>
                </TableHeader>
                <TableBody>
                  {linkerRows.map((row) => (
                    <TableRow key={row.family}>
                      <TableCell className="align-top font-semibold text-zinc-900">{row.family}</TableCell>
                      <TableCell className="align-top text-sm text-zinc-600">{row.trigger}</TableCell>
                      <TableCell className="align-top text-sm text-zinc-600">{row.upside}</TableCell>
                      <TableCell className="align-top text-sm text-zinc-600">{row.risk}</TableCell>
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
              <h2 className="site-page-heading font-semibold">
                where linker choices usually show up
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              {placementRows.map((row) => (
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
              medicinal chemistry reality
            </p>
            <h2 className="site-page-heading font-semibold">
              the linker is also deciding PK, sterics, and what exact drug species appears
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="font-semibold text-zinc-900">free drug versus linker-drug fragment</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                if the linker does not regenerate the native payload cleanly, potency can shift because the
                real active species is now a drug-linker remnant rather than the parent compound.{cite(3)}{cite(7)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="font-semibold text-zinc-900">bulk matters more in smdcs</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                unlike antibodies, small ligands have very little room to hide bulky spacers or trigger modules,
                which is why simplified mono-amino-acid linkers became such an interesting direction.{cite(3)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="font-semibold text-zinc-900">esters, carbonates, and carbamates still matter</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                even when they are not the headline trigger, these bond types still decide how the payload is
                attached and what metabolite is produced after cleavage or hydrolysis.{cite(7)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="font-semibold text-zinc-900">radioligands are a special linker case</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                in radioligand-style SMDCs, the linker can be more of a structural and PK module wrapped around
                a stable chelator-metal system than a classical release switch.{cite(8)}
              </p>
            </div>
          </CardBody>
        </Card>

        <SourceList
          title="verified sources"
          items={chemistrySources.map((item, index) => ({
            ...item,
            label: `${index + 1}. ${item.label}`,
          }))}
        />
      </main>
    </div>
  );
}
