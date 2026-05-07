"use client";

import { useEffect, useState } from "react";
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
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const payloadFilters = [
  {
    title: "Potency",
    text:
      "Only a small amount of free drug reaches any one tumor cell, so the payload has to remain highly active at very low intracellular concentration.",
  },
  {
    title: "Membrane permeability",
    text:
      "Permeable payloads can diffuse into neighboring cells and create bystander activity; more trapped payloads stay local after release.",
  },
  {
    title: "Cell-state dependence",
    text:
      "Tubulin poisons lean more on dividing-cell biology, while DNA-damaging and topo-I payloads can retain activity in slower-cycling settings.",
  },
  {
    title: "Release compatibility",
    text:
      "A payload only works if the linker and intracellular trafficking can liberate it in a chemically active form at the right compartment.",
  },
  {
    title: "Tolerability ceiling",
    text:
      "Payload class strongly shapes the clinical toxicity pattern, from neuropathy and GI toxicity to marrow suppression and genotoxic risk.",
  },
];

const resistanceModes = [
  {
    title: "Drug efflux",
    text: "Transporters can pump released payload out of the cell before it reaches a lethal intracellular concentration.",
  },
  {
    title: "Target-pathway adaptation",
    text: "Cells can alter microtubules, DNA repair programs, or topoisomerase handling to blunt payload effect.",
  },
  {
    title: "Impaired release",
    text: "If trafficking, lysosomal delivery, or linker cleavage is poor, an excellent payload can still underperform biologically.",
  },
  {
    title: "Tumor heterogeneity",
    text: "Patchy antigen expression changes how much released payload is needed and whether bystander activity becomes helpful or risky.",
  },
];

const structureExamples: Array<{
  title: string;
  subtitle: string;
  note: string;
  category: "payload";
  family: string;
  smiles?: string;
  smilesName?: string;
}> = [
  {
    title: "MMAE",
    subtitle: "Auristatin payload",
    smiles:
      "CCC(C)C(C(CC(=O)N1CCCC1C(C(C)C(=O)NC(C)C(C2=CC=CC=C2)O)OC)OC)N(C)C(=O)C(C(C)C)NC(=O)C(C(C)C)NC",
    note: "Structure reference for MMAE.",
    category: "payload",
    family: "Microtubule inhibitors",
  },
  {
    title: "MMAF",
    subtitle: "Auristatin payload",
    smilesName: "monomethyl auristatin F",
    note: "Structure reference for MMAF.",
    category: "payload",
    family: "Microtubule inhibitors",
  },
  {
    title: "Mertansine (DM1)",
    subtitle: "Maytansinoid payload",
    smiles:
      "C[C@]1([C@@](CC(N(C(C=C2C=C3OC)=C3Cl)C)=O)([H])OC([C@H](C)N(C)C(CCS)=O)=O)[C@H]([C@@H]([C@](OC4=O)([H])C[C@]([C@](/C=C/C=C(C)/C2)([H])OC)(N4)O)C)O1",
    note: "Structure reference for DM1.",
    category: "payload",
    family: "Microtubule inhibitors",
  },
  {
    title: "DM4",
    subtitle: "Maytansinoid payload",
    smilesName: "DM4",
    note: "Structure reference for DM4.",
    category: "payload",
    family: "Microtubule inhibitors",
  },
  {
    title: "SN-38",
    subtitle: "Topoisomerase I inhibitor",
    smilesName: "SN-38",
    note: "Structure reference for SN-38.",
    category: "payload",
    family: "Topoisomerase I inhibitors",
  },
  {
    title: "Calicheamicin",
    subtitle: "DNA-damaging payload",
    smilesName: "calicheamicin",
    note: "Structure reference for calicheamicin.",
    category: "payload",
    family: "DNA-damaging and alkylating agents",
  },
  {
    title: "Duocarmycin",
    subtitle: "DNA-alkylating payload class",
    smilesName: "duocarmycin",
    note: "Representative duocarmycin-class payload.",
    category: "payload",
    family: "DNA-damaging and alkylating agents",
  },
  {
    title: "SGD-1882 (PBD dimer)",
    subtitle: "DNA crosslinking payload",
    smilesName: "SGD-1882",
    note: "Representative PBD dimer payload.",
    category: "payload",
    family: "DNA-damaging and alkylating agents",
  },
  {
    title: "Exatecan",
    subtitle: "Topoisomerase I scaffold",
    smilesName: "exatecan",
    note: "Representative Topo-I inhibitor scaffold related to newer ADC payloads.",
    category: "payload",
    family: "Topoisomerase I inhibitors",
  },
  {
    title: "Doxorubicin",
    subtitle: "Anthracycline / Topo-II-associated legacy payload idea",
    smilesName: "doxorubicin",
    note: "Legacy anthracycline example; historically important but less favored than modern ultra-potent warheads.",
    category: "payload",
    family: "Legacy and emerging experimental classes",
  },
  {
    title: "Alpha-Amanitin",
    subtitle: "RNA polymerase II inhibitor",
    smilesName: "alpha-amanitin",
    note: "Emerging transcription-inhibitor payload class.",
    category: "payload",
    family: "Transcription inhibitors",
  },
];

const groupedStructureExamples = [
  "microtubule inhibitors",
  "DNA-damaging and alkylating agents",
  "topoisomerase I inhibitors",
  "transcription inhibitors",
  "legacy and emerging experimental classes",
].map((family) => ({
  family,
  items: structureExamples.filter((item) => item.family === family),
}));

const familySummaries: Record<string, string> = {
  "microtubule inhibitors":
    "Auristatins and maytansinoids remain the classic mitotic payload families and are still central to clinical ADC history.",
  "DNA-damaging and alkylating agents":
    "These warheads push potency very high and can work even when proliferation is slower, but they usually come with tighter safety margins.",
  "topoisomerase I inhibitors":
    "Modern Topo-I payloads helped broaden ADC utility by combining strong potency with release chemistries that can support bystander effect.",
  "transcription inhibitors":
    "RNA polymerase II inhibitors are newer and mechanistically distinct, so they are watched closely as a possible expansion beyond the standard classes.",
  "legacy and emerging experimental classes":
    "Some payload ideas remain scientifically interesting but are less established in current ADC practice because potency, chemistry, or safety proved harder to balance.",
};

const payloadComparison = [
  {
    label: "Common potency expectation",
    microtubule: "very high",
    dna: "very high",
    topo1: "high",
    emerging: "varies by scaffold",
  },
  {
    label: "Bystander tendency",
    microtubule: "depends strongly on released chemistry",
    dna: "usually limited to moderate",
    topo1: "often favorable",
    emerging: "class-specific",
  },
  {
    label: "Activity in slower-cycling cells",
    microtubule: "less favored",
    dna: "often stronger",
    topo1: "intermediate to strong",
    emerging: "mechanism-specific",
  },
  {
    label: "Classic liability",
    microtubule: "neuropathy / efflux",
    dna: "genotoxic safety pressure",
    topo1: "GI / marrow toxicity",
    emerging: "development uncertainty",
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
      "Antibody–drug conjugates in cancer therapy: current landscape, challenges, and future directions (Molecular Cancer, 2025)",
    href: "https://molecular-cancer.biomedcentral.com/articles/10.1186/s12943-025-02489-2",
  },
  {
    id: 3,
    label: "NCBI policies and disclaimers (molecular data usage)",
    href: "https://www.ncbi.nlm.nih.gov/home/about/policies/",
  },
  {
    id: 4,
    label: "NCI/CADD Chemical Identifier Resolver documentation (SMILES lookup)",
    href: "https://cactus.nci.nih.gov/chemical/structure_documentation",
  },
  {
    id: 5,
    label: "GLPBIO: Monomethyl auristatin E (MMAE) — compound page with SMILES",
    href: "https://www.glpbio.com/monomethyl-auristatin-e-mmae.html",
  },
  {
    id: 6,
    label: "GLPBIO: Mertansine (DM1) — compound page with SMILES",
    href: "https://www.glpbio.com/mertansine.html",
  },
  {
    id: 7,
    label:
      "Payload diversification: a key step in the development of antibody–drug conjugates (Journal of Hematology & Oncology, 2022)",
    href: "https://jhoonline.biomedcentral.com/articles/10.1186/s13045-022-01397-y",
  },
  {
    id: 8,
    label:
      "Antibody–Drug Conjugates (ADCs): current and future biopharmaceuticals (Journal of Hematology & Oncology, 2025)",
    href: "https://jhoonline.biomedcentral.com/articles/10.1186/s13045-025-01704-3",
  },
  {
    id: 9,
    label:
      "The Evolving Landscape of Antibody-Drug Conjugates: In Depth Analysis of Recent Research Progress (Bioconjugate Chemistry, 2023)",
    href: "https://pubs.acs.org/doi/10.1021/acs.bioconjchem.3c00374",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function AdcPayloadPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart TD
    A["Payload goal"] --> B{"Need broad bystander effect?"}
    B --> Y1["YES"] --> C{"Can tolerate more off-cell diffusion?"}
    B --> N1["NO"] --> D["Prefer more trapped / local payload behavior"]
    C --> Y2["YES"] --> E["Topo-I or permeable tubulin payloads may fit"]
    C --> N2["NO"] --> F["Use caution: bystander gain may trade against safety"]
    D --> G{"Need activity in slower-cycling cells?"}
    G --> Y3["YES"] --> H["Consider DNA-damaging or topo-I classes"]
    G --> N3["NO"] --> I["Tubulin payloads can remain strong options"]
    H --> J["Then check linker compatibility, release chemistry, and tolerability"]
    I --> J
    E --> J
    F --> J

    classDef good fill:#dcfce7,stroke:#22c55e,color:#166534;
    classDef warn fill:#fef3c7,stroke:#f59e0b,color:#92400e;
    classDef yes fill:#dbeafe,stroke:#2563eb,color:#1d4ed8,font-weight:bold;
    classDef no fill:#fee2e2,stroke:#ef4444,color:#b91c1c,font-weight:bold;
    class J good;
    class F warn;
    class Y1,Y2,Y3 yes;
    class N1,N2,N3 no;`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const tryRender = async () => {
      const mermaid = (
        window as typeof window & {
          mermaid?: {
            render: (id: string, text: string) => Promise<{ svg: string }>;
            initialize: (cfg: { startOnLoad: boolean }) => void;
          };
        }
      ).mermaid;
      if (!mermaid) return false;
      mermaid.initialize({ startOnLoad: false });
      try {
        const { svg } = await mermaid.render(`payload-flow-${Date.now()}`, mermaidDiagram);
        if (!cancelled) {
          setMermaidSvg(svg);
        }
        return true;
      } catch {
        return false;
      }
    };

    if (mermaidSvg) return;
    tryRender();
    const t1 = setTimeout(() => tryRender(), 300);
    const t2 = setTimeout(() => tryRender(), 1000);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mermaidDiagram, mermaidSvg]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="payload" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/adcs" className="text-sm text-sky-700">
            adc overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
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
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            payloads
          </Chip>
          <h1 className="site-page-title font-semibold">
            payloads deliver the therapeutic punch
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            ADC payloads must be extremely potent because only a fraction of drug
            reaches each target cell. Payload chemistry also determines bystander
            activity, resistance patterns, and safety profiles.
            {cite(1)}
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              payload basics
            </p>
            <h2 className="site-page-heading font-semibold">
              what payloads actually are
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1rem] border border-sky-100 bg-sky-50/60 p-4">
              <p className="text-sm font-semibold text-zinc-900">The cytotoxic warhead</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                The payload is the small-molecule drug attached to the antibody through the linker. It is the part of the ADC that actually damages or kills the target cell after release.{cite(1)}
              </p>
            </div>
            <div className="rounded-[1rem] border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-sm font-semibold text-zinc-900">Why payloads are unusually potent</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                Only a limited amount of released drug reaches each cell, so ADC payloads usually need picomolar-to-low nanomolar activity to remain effective at those low delivered amounts.{cite(2)}
              </p>
            </div>
            <div className="rounded-[1rem] border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-sm font-semibold text-zinc-900">Why payload choice changes behavior</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                Payload class helps determine bystander effect, resistance routes, toxicity pattern, and how dependent the ADC is on rapid proliferation or efficient intracellular release.{cite(7)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              selection logic
            </p>
            <h2 className="site-page-heading font-semibold">
              how payload choices get narrowed
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4">
            <ZoomableFigure label="Payload selection logic flowchart">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div
                  className="mermaid-flow [&_svg]:h-auto [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {payloadFilters.map((item) => (
                <div key={item.title} className="rounded-[1rem] border border-white/80 bg-white/85 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">{item.text}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              payload classes
            </p>
            <h2 className="site-page-heading font-semibold">
              mechanisms, advantages, and liabilities
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <div className="grid gap-3 md:grid-cols-2">
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">Core payload families:</span> modern ADC development is still dominated by microtubule inhibitors, DNA-reactive payloads, and topoisomerase I inhibitors, with additional emerging classes now broadening the field.{cite(7)}{cite(8)}
              </p>
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">How to read this table:</span> mechanism explains what the released drug does inside the cell, while strengths and liabilities summarize why teams may prefer or avoid each class for a given ADC design.
              </p>
            </div>
            <Table
              aria-label="ADC payload classes"
              className="bg-white/60 border border-white/70 rounded-xl"
            >
              <TableHeader>
                <TableColumn>Class</TableColumn>
                <TableColumn>Mechanism</TableColumn>
                <TableColumn>Examples</TableColumn>
                <TableColumn>Strengths</TableColumn>
                <TableColumn>Liabilities</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow key="tubulin">
                  <TableCell>Auristatins / Maytansinoids</TableCell>
                  <TableCell>Microtubule disruption → mitotic arrest</TableCell>
                  <TableCell>MMAE, MMAF, DM1, DM4</TableCell>
                  <TableCell>Very potent, clinically validated</TableCell>
                  <TableCell>Peripheral neuropathy, efflux risk</TableCell>
                </TableRow>
                <TableRow key="dna">
                  <TableCell>DNA‑damaging / alkylating</TableCell>
                  <TableCell>DNA cleavage, cross‑linking, or alkylation</TableCell>
                  <TableCell>Calicheamicin, PBD dimers, duocarmycins</TableCell>
                  <TableCell>High potency, activity in slow‑dividing cells</TableCell>
                  <TableCell>Narrow safety window, genotoxicity</TableCell>
                </TableRow>
                <TableRow key="topo1">
                  <TableCell>Topoisomerase I inhibitors</TableCell>
                  <TableCell>Stabilize Topo‑I complex → DNA breaks</TableCell>
                  <TableCell>SN‑38, DXd, exatecan analogs</TableCell>
                  <TableCell>Can enable bystander diffusion</TableCell>
                  <TableCell>GI and hematologic toxicity</TableCell>
                </TableRow>
                <TableRow key="rna-pol2">
                  <TableCell>RNA polymerase II inhibitors</TableCell>
                  <TableCell>Transcriptional shutdown</TableCell>
                  <TableCell>alpha‑Amanitin</TableCell>
                  <TableCell>Mechanistically distinct emerging class</TableCell>
                  <TableCell>Still early, with narrow development constraints</TableCell>
                </TableRow>
                <TableRow key="legacy-topo2">
                  <TableCell>Legacy / emerging Topo‑II or anthracycline warheads</TableCell>
                  <TableCell>Topo‑II inhibition / DNA intercalation</TableCell>
                  <TableCell>Doxorubicin, PNU-class anthracyclines</TableCell>
                  <TableCell>Mechanism diversity beyond standard classes</TableCell>
                  <TableCell>Often limited by potency or safety in ADC format</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="grid gap-2 text-xs text-zinc-500">
              <p>
                Selection criteria often include potency (pM–nM), membrane permeability (bystander
                potential), stability, and susceptibility to efflux or resistance mechanisms.
                {cite(8)}
              </p>
              <p>
                Beyond the three dominant clinical classes, reviews also describe emerging
                transcription inhibitors, additional DNA-reactive payloads, and legacy
                anthracycline-derived warheads as part of ADC payload diversification. {cite(7)}{cite(9)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              comparison view
            </p>
            <h2 className="site-page-heading font-semibold">
              quick payload class comparison
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white/90">
              <div className="grid md:grid-cols-[220px_repeat(4,minmax(0,1fr))]">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 md:border-b-0 md:border-r">
                  feature
                </div>
                <div className="border-b border-slate-200 bg-sky-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 md:border-b-0 md:border-r">
                  microtubule
                </div>
                <div className="border-b border-slate-200 bg-rose-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 md:border-b-0 md:border-r">
                  DNA-reactive
                </div>
                <div className="border-b border-slate-200 bg-amber-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 md:border-b-0 md:border-r">
                  Topo-I
                </div>
                <div className="bg-violet-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                  emerging / legacy
                </div>
                {payloadComparison.map((row) => (
                  <div key={row.label} className="contents">
                    <div className="border-t border-slate-200 px-4 py-4 text-sm font-semibold text-zinc-900 md:border-r">
                      {row.label}
                    </div>
                    <div className="border-t border-slate-200 px-4 py-4 text-sm text-zinc-600 md:border-r">
                      {row.microtubule}
                    </div>
                    <div className="border-t border-slate-200 px-4 py-4 text-sm text-zinc-600 md:border-r">
                      {row.dna}
                    </div>
                    <div className="border-t border-slate-200 px-4 py-4 text-sm text-zinc-600 md:border-r">
                      {row.topo1}
                    </div>
                    <div className="border-t border-slate-200 px-4 py-4 text-sm text-zinc-600">
                      {row.emerging}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs leading-6 text-zinc-500">
              This comparison is directional rather than absolute: exact behavior still depends on released chemical form, linker context, and the biology of the target cell.{cite(7)}{cite(8)}
            </p>
          </CardBody>
        </Card>

        <section className="grid gap-6">
          {groupedStructureExamples.map((group) => (
            <div key={group.family} className="grid gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold text-zinc-900 font-[family-name:var(--font-space-grotesk)]">
                  {group.family}
                </h3>
                <p className="text-sm text-zinc-500">
                  {familySummaries[group.family]}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {group.items.map((item) => (
                  <StructureCard key={item.title} {...item} />
                ))}
              </div>
            </div>
          ))}
        </section>
        <span className="text-xs text-zinc-500">{cite(4)}{cite(5)}{cite(6)}</span>

        <div className="grid gap-6">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                bystander effect
              </p>
              <h2 className="site-page-heading font-semibold">
                permeable vs trapped payloads
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <ZoomableFigure label="Bystander effect: permeable versus trapped payloads">
              <svg className="h-72 w-full" viewBox="0 0 720 260" fill="none">
                <defs>
                  <marker
                    id="payload-bystander-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 z" fill="#0f172a" />
                  </marker>
                </defs>
                <text x="30" y="22" fontSize="12" fill="#0f172a">hydrophobic / membrane‑permeable</text>
                <text x="400" y="22" fontSize="12" fill="#0f172a">hydrophilic / membrane‑trapped</text>

                <rect x="20" y="40" width="320" height="180" rx="18" fill="#e0f2fe" />
                <rect x="40" y="70" width="120" height="120" rx="14" fill="#dbeafe" stroke="#94a3b8" />
                <rect x="200" y="70" width="120" height="120" rx="14" fill="#c7d2fe" stroke="#94a3b8" />
                <text x="58" y="92" fontSize="10" fill="#0f172a">target cell</text>
                <text x="214" y="92" fontSize="10" fill="#0f172a">neighbor cell</text>
                <circle cx="85" cy="110" r="8" fill="#f59e0b" />
                <circle cx="110" cy="140" r="8" fill="#f59e0b" />
                <circle cx="140" cy="170" r="8" fill="#f59e0b" />
                <circle cx="210" cy="120" r="8" fill="#f59e0b" />
                <circle cx="240" cy="150" r="8" fill="#f59e0b" />
                <circle cx="265" cy="175" r="8" fill="#f59e0b" />
                <path d="M118 140h18" stroke="#0f172a" strokeWidth="2" markerEnd="url(#payload-bystander-arrow)" />
                <path d="M148 170h60" stroke="#0f172a" strokeWidth="2" markerEnd="url(#payload-bystander-arrow)" />
                <text x="50" y="205" fontSize="11" fill="#0f172a">payload diffuses → bystander kill</text>

                <rect x="380" y="40" width="320" height="180" rx="18" fill="#e0e7ff" />
                <rect x="400" y="70" width="120" height="120" rx="14" fill="#dbeafe" stroke="#94a3b8" />
                <rect x="560" y="70" width="120" height="120" rx="14" fill="#c7d2fe" stroke="#94a3b8" />
                <text x="418" y="92" fontSize="10" fill="#0f172a">target cell</text>
                <text x="574" y="92" fontSize="10" fill="#0f172a">neighbor cell</text>
                <circle cx="450" cy="110" r="8" fill="#94a3b8" />
                <circle cx="475" cy="135" r="8" fill="#94a3b8" />
                <circle cx="455" cy="165" r="8" fill="#94a3b8" />
                <circle cx="490" cy="120" r="8" fill="#94a3b8" />
                <circle cx="505" cy="150" r="8" fill="#94a3b8" />
                <text x="410" y="205" fontSize="11" fill="#0f172a">payload trapped → no bystander</text>

                <rect x="20" y="230" width="680" height="26" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
                <text x="36" y="247" fontSize="11" fill="#475569">
                  membrane permeability and released chemical form strongly influence whether neighboring cells are exposed
                </text>
              </svg>
              </ZoomableFigure>
              <div className="grid gap-3 md:grid-cols-3">
                <p className="text-xs leading-6 text-zinc-500">
                  <span className="font-semibold text-zinc-700">What bystander effect means:</span> once the payload is released inside an antigen-positive cell, a membrane-permeable drug can diffuse out and injure neighboring cells that may express less antigen or none at all.{cite(2)}
                </p>
                <p className="text-xs leading-6 text-zinc-500">
                  <span className="font-semibold text-zinc-700">Payloads that often show stronger bystander behavior:</span> MMAE, DXd, SN-38-derived payloads, and other sufficiently permeable released warheads can spread beyond the original target cell.{cite(7)}{cite(8)}
                </p>
                <p className="text-xs leading-6 text-zinc-500">
                  <span className="font-semibold text-zinc-700">Payloads that are more limited or trapped:</span> MMAF and other more charged or hydrophilic released species tend to stay local and therefore show less bystander effect.{cite(2)}{cite(7)}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1rem] border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-sm font-semibold text-zinc-900">Advantages</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    Bystander activity can help in heterogeneous tumors where not every cell expresses the target strongly, because released payload can spill into nearby lower-antigen neighbors and widen local kill.
                  </p>
                </div>
                <div className="rounded-[1rem] border border-rose-100 bg-rose-50/60 p-4">
                  <p className="text-sm font-semibold text-zinc-900">Disadvantages</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    The same diffusion that helps inside tumors can also reduce spatial selectivity and raise safety concerns if released payload reaches nearby normal cells or escapes too broadly from the intended target zone.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              release environment
            </p>
            <h2 className="site-page-heading font-semibold">
              payloads only matter after productive release
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1rem] border border-sky-100 bg-sky-50/60 p-4">
              <p className="text-sm font-semibold text-zinc-900">Trafficking requirement</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                The ADC must reach a compartment where linker cleavage or catabolism can unmask a pharmacologically active payload species.
              </p>
            </div>
            <div className="rounded-[1rem] border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-sm font-semibold text-zinc-900">Chemical form after release</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                Charge, residual linker mass, and leaving groups can change whether the released payload stays trapped or diffuses into nearby cells.
              </p>
            </div>
            <div className="rounded-[1rem] border border-violet-100 bg-violet-50/60 p-4">
              <p className="text-sm font-semibold text-zinc-900">Not always the naked parent drug</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                In many ADCs, the biologically active released species still carries linker residue or an amino-acid remnant, so payload behavior cannot be predicted from the parent small molecule alone.{cite(1)}{cite(8)}
              </p>
            </div>
            <div className="rounded-[1rem] border border-rose-100 bg-rose-50/60 p-4">
              <p className="text-sm font-semibold text-zinc-900">System-level consequence</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                Release that is too early or too nonspecific can move the toxicity burden away from the tumor and into normal tissue exposure.{cite(2)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              payload decision matrix
            </p>
            <h2 className="site-page-heading font-semibold">
              how teams choose payloads
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>potency at low intracellular concentrations</p>
            <p>membrane permeability and desired bystander effect</p>
            <p>resistance risk (efflux, target pathway changes)</p>
            <p>stability during conjugation and storage</p>
            <p>compatibility with linker and DAR targets</p>
            <span className="text-xs text-zinc-500">{cite(1)}</span>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              resistance routes
            </p>
            <h2 className="site-page-heading font-semibold">
              where payload efficacy gets lost
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {resistanceModes.map((item) => (
              <div key={item.title} className="rounded-[1rem] border border-white/80 bg-white/85 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">{item.text}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              design considerations
            </p>
            <h2 className="site-page-heading font-semibold">
              potency, permeability, and resistance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Membrane-permeable payloads can produce bystander killing, which is
              useful for heterogeneous tumors but may raise safety concerns.
              {cite(2)}
            </p>
            <p>
              Resistance can emerge through drug efflux, target downregulation,
              or impaired internalization, motivating payload and linker tuning.
              {cite(2)}
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
