"use client";

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
} from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LabeledStructureCard } from "@/components/LabeledStructureCard";
import { StructureCard } from "@/components/StructureCard";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const components = [
  {
    title: "monoclonal antibody (mAb)",
    desc: "selects the target antigen and drives uptake into cells.",
  },
  {
    title: "linker",
    desc: "controls stability in blood and timing of payload release.",
  },
  {
    title: "payload",
    desc: "potent cytotoxins or other agents that kill target cells.",
  },
];

const designLevers = [
  {
    title: "target biology",
    detail:
      "Antigen density and heterogeneity determine how many ADCs bind per cell and whether antigen‑low regions are missed. Normal‑tissue expression sets the safety ceiling by defining off‑tumor binding risk.",
  },
  {
    title: "internalization and trafficking",
    detail:
      "Fast endocytosis and efficient lysosomal routing increase the fraction of ADCs that reach proteases and release payload. Receptor recycling or non‑lysosomal routing can sharply reduce intracellular drug delivery.",
  },
  {
    title: "linker stability",
    detail:
      "Cleavable linkers favor rapid intracellular release, while non‑cleavable linkers maximize plasma stability. The choice affects off‑target exposure, catabolite identity, and bystander potential.",
  },
  {
    title: "payload class",
    detail:
      "Payload potency, membrane permeability, and mechanism of action drive efficacy, bystander effect, and resistance pathways. Tubulin, DNA‑damaging, and Topo‑I agents each bring distinct toxicity profiles.",
  },
  {
    title: "DAR and heterogeneity",
    detail:
      "Higher DAR species can increase potency but also hydrophobicity, aggregation, and clearance. A narrow DAR distribution improves predictability of PK/PD and safety.",
  },
  {
    title: "conjugation chemistry",
    detail:
      "Lysine/cysteine methods are robust but heterogeneous, while site‑specific strategies produce defined species with improved stability and often better PK behavior.",
  },
  {
    title: "conjugation site",
    detail:
      "Where the payload attaches can alter Fc function, stability, and exposure. Some sites tolerate higher DAR without aggregation or impaired antigen binding.",
  },
  {
    title: "hydrophobicity & aggregation",
    detail:
      "Hydrophobic payloads can drive self‑association and faster clearance; hydrophilic spacers or optimized DAR help maintain solubility and exposure.",
  },
  {
    title: "tumor penetration",
    detail:
      "High‑affinity binding and fast internalization can trap ADCs near vessels (binding‑site barrier). Tuning affinity and bystander effect improves depth of penetration in solid tumors.",
  },
];

const analytics = [
  "DAR distribution and drug‑load species (HIC, LC‑MS, CE‑SDS)",
  "conjugation site mapping and micro‑heterogeneity profiling",
  "aggregation, fragmentation, and thermal stability (SEC‑MALS, DSC)",
  "free payload, residual linker, and catabolite monitoring",
  "potency, binding affinity, internalization, and trafficking assays",
  "in vitro serum stability and deconjugation rates",
  "in vivo PK/PD and tissue distribution (multiple analytes)",
  "charge variants and glycosylation impacts on Fc function",
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
    label:
      "Antibody-drug conjugates: a biological missile for targeted cancer therapy (Signal Transduction and Targeted Therapy, 2022)",
    href: "https://www.nature.com/articles/s41392-022-00947-7",
  },
  {
    id: 4,
    label: "ADCdb: Antibody–Drug Conjugate Database (Nucleic Acids Research, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/37831118/",
  },
  {
    id: 5,
    label: "ADCdb database",
    href: "https://adcdb.org/",
  },
  {
    id: 6,
    label: "RCSB PDB usage policy (CC0 for structure images)",
    href: "https://www.rcsb.org/pages/usage-policy",
  },
  {
    id: 10,
    label: "NCI/CADD Chemical Identifier Resolver documentation (SMILES lookup)",
    href: "https://cactus.nci.nih.gov/chemical/structure_documentation",
  },
  {
    id: 11,
    label:
      "Antibody–Drug Conjugates (ADCs): current and future biopharmaceuticals (Journal of Hematology & Oncology, 2025)",
    href: "https://jhoonline.biomedcentral.com/articles/10.1186/s13045-025-01704-3",
  },
  {
    id: 12,
    label:
      "Overview of antibody-drug conjugates nonclinical and clinical toxicities and related contributing factors (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article/8/2/124/8085092",
  },
  {
    id: 13,
    label:
      "Effects of Drug–Antibody Ratio on Pharmacokinetics, Biodistribution, Efficacy, and Tolerability (Bioconjugate Chemistry, 2017)",
    href: "https://pubs.acs.org/doi/abs/10.1021/acs.bioconjchem.7b00062",
  },
  {
    id: 14,
    label: "GLPBIO: Monomethyl auristatin E (MMAE) — compound page with SMILES",
    href: "https://www.glpbio.com/monomethyl-auristatin-e-mmae.html",
  },
  {
    id: 15,
    label: "GLPBIO: Mertansine (DM1) — compound page with SMILES",
    href: "https://www.glpbio.com/mertansine.html",
  },
  {
    id: 16,
    label:
      "A rapid on-line method for mass spectrometric confirmation of a cysteine-conjugated ADC structure (MAbs, 2015) — HIC chromatogram figure, CC BY 3.0",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4966495/",
  },
  {
    id: 17,
    label:
      "A High-Throughput MEMS-Based Differential Scanning Calorimeter for Direct Thermal Characterization of Antibodies (Biosensors, 2022) — DSC curves, CC BY 4.0",
    href: "https://www.mdpi.com/2079-6374/12/6/422",
  },
  {
    id: 18,
    label:
      "Hydrophilic Auristatin Glycoside Payload Enables Improved Antibody-Drug Conjugate Efficacy and Biocompatibility (Antibodies, 2018) — HIC and in-vitro figures, CC BY 4.0",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6698876/",
  },
  {
    id: 19,
    label:
      "Characterization of Antibody–Antigen Interactions Using Biolayer Interferometry (STAR Protocols, 2021) — BLI/Octet schematic, CC BY-NC-ND 4.0",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8449132/",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const adcVisualLibrary: Array<{
  title: string;
  subtitle: string;
  note: string;
  category: "payload" | "linker";
  smiles?: string;
  smilesName?: string;
}> = [
  {
    title: "MMAE",
    subtitle: "auristatin payload",
    smiles:
      "CCC(C)C(C(CC(=O)N1CCCC1C(C(C)C(=O)NC(C)C(C2=CC=CC=C2)O)OC)OC)N(C)C(=O)C(C(C)C)NC(=O)C(C(C)C)NC",
    note: "Representative auristatin payload structure.",
    category: "payload",
  },
  {
    title: "DM1 (mertansine)",
    subtitle: "maytansinoid payload",
    smiles:
      "C[C@]1([C@@](CC(N(C(C=C2C=C3OC)=C3Cl)C)=O)([H])OC([C@H](C)N(C)C(CCS)=O)=O)[C@H]([C@@H]([C@](OC4=O)([H])C[C@]([C@](/C=C/C=C(C)/C2)([H])OC)(N4)O)C)O1",
    note: "Representative maytansinoid payload structure.",
    category: "payload",
  },
  {
    title: "SN-38",
    subtitle: "topoisomerase I payload",
    smilesName: "SN-38",
    note: "Representative topo I inhibitor payload.",
    category: "payload",
  },
  {
    title: "Val-Cit",
    subtitle: "protease-cleavable linker",
    smilesName: "L-Valyl-L-citrulline",
    note: "Common cathepsin-cleavable motif.",
    category: "linker",
  },
  {
    title: "SMCC",
    subtitle: "non-cleavable linker",
    smilesName: "SMCC",
    note: "Thioether linker reagent.",
    category: "linker",
  },
  {
    title: "Hydrazone",
    subtitle: "acid-labile motif",
    smilesName: "benzaldehyde hydrazone",
    note: "Acid-sensitive linker class.",
    category: "linker",
  },
];

export default function AdcPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart LR
  subgraph Steps["Trafficking steps (what happens)"]
    A["1. Bind antigen<br/>(surface binding to target)"] --> B["2. Internalize<br/>(endocytosis into vesicles)"] --> C["3. Early endosome<br/>(sorting & trafficking)"] --> D["4. Lysosome<br/>(acidic protease-rich)"] --> E["5. Linker cleavage<br/>(enzymes / pH / redox)"] --> F["6. Payload release<br/>(free drug inside cell)"] --> G["7. Cell death / bystander<br/>(local kill ± diffusion)"]
  end
  subgraph Fail["Failure checkpoints (what can go wrong)"]
    F1["Low antigen / poor binding<br/>→ no entry"]:::fail
    F2["Slow uptake / recycling<br/>→ low lysosome delivery"]:::warn
    F3["Linker instability<br/>→ off‑target release"]:::info
    F4["Efflux / resistance<br/>→ reduced potency"]:::info2
  end
  A -.-> F1
  B -.-> F2
  E -.-> F3
  G -.-> F4

  classDef fail fill:#fee2e2,stroke:#ef4444,stroke-width:1,color:#7f1d1d;
  classDef warn fill:#fde68a,stroke:#f59e0b,stroke-width:1,color:#78350f;
  classDef info fill:#bfdbfe,stroke:#3b82f6,stroke-width:1,color:#1e3a8a;
  classDef info2 fill:#c7d2fe,stroke:#6366f1,stroke-width:1,color:#312e81;`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const tryRender = async () => {
      const mermaid = (window as typeof window & { mermaid?: { render: (id: string, text: string) => Promise<{ svg: string }>; initialize: (cfg: { startOnLoad: boolean }) => void } }).mermaid;
      if (!mermaid) return false;
      mermaid.initialize({ startOnLoad: false });
      try {
        const { svg } = await mermaid.render(`adc-traffic-${Date.now()}`, mermaidDiagram);
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
      <BackgroundMotif variant="adc" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="text-sm text-sky-700">
            back to home
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
            antibody-drug conjugates (adcs)
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            a full-spectrum guide to adc design and biology
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            ADCs are modular therapeutics built from a monoclonal antibody, a
            chemical linker, and a potent payload. Their clinical behavior depends
            on how these parts are tuned together.
            {cite(1)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href="/adcs/mab" radius="full" className="bg-sky-600 text-white">
              mAb page
            </Button>
            <Button
              as={Link}
              href="/adcs/linker"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              linker page
            </Button>
            <Button
              as={Link}
              href="/adcs/payload"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              payload page
            </Button>
          </div>
        </motion.section>

        <section className="grid gap-6 md:grid-cols-3">
          {components.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80 h-full">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600">
                  {item.desc}
                  {cite(1)}
                </p>
              </CardBody>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3 items-stretch">
          <Link href="/adcs/mab" className="no-underline block w-full h-full">
            <LabeledStructureCard
              title="IgG antibody structure"
              subtitle="RCSB PDB 1IGT assembly image"
              src="https://cdn.rcsb.org/images/structures/ig/1igt/1igt_assembly-1.jpeg"
              note="RCSB PDB assembly image shown without overlay labels so the structure stays readable."
              className="h-full"
            />
            <span className="text-xs text-zinc-500">{cite(6)}</span>
          </Link>
          <Link href="/adcs/linker" className="no-underline block w-full h-full">
            <StructureCard
              title="Linker class (cleavable)"
              subtitle="representative protease-cleavable motif"
              smilesName="L-Valyl-L-citrulline"
              note="Representative structure for a cleavable linker class."
              category="linker"
              className="h-full"
            />
            <span className="text-xs text-zinc-500">{cite(10)}</span>
          </Link>
          <Link href="/adcs/payload" className="no-underline block w-full h-full">
            <StructureCard
              title="Payload class (tubulin inhibitor)"
              subtitle="representative auristatin motif"
              smiles="CCC(C)C(C(CC(=O)N1CCCC1C(C(C)C(=O)NC(C)C(C2=CC=CC=C2)O)OC)OC)N(C)C(=O)C(C(C)C)NC(=O)C(C(C)C)NC"
              note="Representative structure for a tubulin-inhibitor payload class."
              category="payload"
              className="h-full"
            />
            <span className="text-xs text-zinc-500">{cite(10)}{cite(14)}</span>
          </Link>
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              mechanism
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how adcs work in cells
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <p>
              ADCs bind tumor-associated antigens, internalize through
              endocytosis, traffic to lysosomes, and release payloads inside the
              cell.
              {cite(3)}
            </p>
            <p>
              Internalization can proceed through clathrin- or caveolin-mediated
              pathways, and efficient lysosomal routing plus protease activity
              are critical for payload release.
              {cite(1)}
              {cite(11)}
            </p>
            <p>
              Membrane-permeable payloads can diffuse into nearby cells, creating
              a bystander effect in heterogeneous tumors.
              {cite(2)}
            </p>
            <p>
              Cleavable linkers release free drug in the lysosome or tumor
              microenvironment, whereas non-cleavable linkers typically yield
              a charged amino acid–linker–payload catabolite that stays inside
              the target cell.
              {cite(1)}
            </p>
            <p>
              Key determinants include antigen density, internalization rate,
              endosomal trafficking, linker cleavage chemistry, and payload
              permeability. These steps collectively shape efficacy and safety.
              {cite(1)}
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1rem] border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-900">surface recognition</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  The antibody has to find enough accessible antigen on tumor cells to drive productive entry.
                </p>
              </div>
              <div className="rounded-[1rem] border border-violet-100 bg-violet-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-900">intracellular processing</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  Endosomal routing, lysosomal exposure, and linker chemistry determine whether active drug is actually released.
                </p>
              </div>
              <div className="rounded-[1rem] border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-900">selective damage</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  Payload permeability and tumor heterogeneity decide whether killing stays local or extends through bystander effect.
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                "antigen binding and clustering at the cell surface",
                "internalization via clathrin or caveolin pathways",
                "endosome-to-lysosome trafficking and protease exposure",
                "recycling vs lysosomal routing (affects payload delivery)",
                "payload release and diffusion or intracellular trapping",
                "DNA damage or microtubule disruption leading to apoptosis",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <section className="grid gap-6">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                intracellular route
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                adc trafficking & failure checkpoints
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <ZoomableFigure label="ADC trafficking and failure checkpoints">
                <div className="rounded-2xl border border-white/70 bg-white/60 p-4">
                  <div
                    className="mermaid-flow"
                    aria-label="ADC trafficking flowchart"
                    dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                  />
                </div>
              </ZoomableFigure>
              <p className="text-xs text-zinc-500">
                After binding the surface antigen, the ADC is internalized, trafficked
                through early endosomes to lysosomes, and processed by proteases or linker
                cleavage chemistry to release the active payload inside the target cell.
                {cite(1)}
              </p>
              <div className="grid gap-2 text-xs text-zinc-500">
                <p>
                  Step 1 (bind antigen): the antibody recognizes a tumor‑associated
                  antigen on the cell surface; low antigen density or poor accessibility
                  can block entry. {cite(1)}{cite(11)}
                </p>
                <p>
                  Step 2 (internalize): receptor‑mediated endocytosis brings the ADC into
                  vesicles; slow uptake or rapid recycling reduces delivery to lysosomes.
                  {cite(1)}{cite(11)}
                </p>
                <p>
                  Step 3 (early endosome): sorting decides whether the ADC proceeds to
                  lysosomes or recycles back to the surface, affecting payload delivery.
                  {cite(1)}
                </p>
                <p>
                  Step 4 (lysosome): acidic, protease‑rich compartments process the ADC;
                  inadequate lysosomal trafficking or protease activity can blunt release.
                  {cite(1)}{cite(11)}
                </p>
                <p>
                  Step 5 (linker cleavage): cleavable linkers respond to proteases, pH,
                  or redox conditions; instability risks off‑target release. {cite(1)}{cite(11)}
                </p>
                <p>
                  Step 6 (payload release): free drug is liberated inside the cell;
                  efflux pumps or rapid detoxification can reduce intracellular exposure.
                  {cite(2)}{cite(11)}
                </p>
                <p>
                  Step 7 (cell death / bystander): cytotoxic payload triggers apoptosis;
                  membrane‑permeable payloads can diffuse to neighbors, while hydrophilic
                  payloads stay local. {cite(1)}{cite(2)}
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                Receptor recycling, lysosomal pH, and protease abundance can shift how
                much payload is actually released versus recycled to the surface. {cite(11)}
              </p>
              <p className="text-xs text-zinc-500">
                Why it matters: trafficking efficiency determines how much payload is
                released intracellularly. Poor internalization or recycling can blunt
                efficacy and shift the PK/PD profile. {cite(1)}
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                bystander
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                diffusion vs trapping
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <ZoomableFigure label="Bystander diffusion versus trapping">
              <svg className="h-72 w-full" viewBox="0 0 720 260" fill="none">
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
                <path d="M118 140h18" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow-by)" />
                <path d="M148 170h60" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow-by)" />
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
                <circle cx="40" cy="243" r="6" fill="#f59e0b" />
                <text x="52" y="247" fontSize="10" fill="#0f172a">diffusing payload</text>
                <circle cx="200" cy="243" r="6" fill="#94a3b8" />
                <text x="212" y="247" fontSize="10" fill="#0f172a">trapped payload</text>
                <rect x="340" y="238" width="16" height="10" rx="4" fill="#dbeafe" stroke="#94a3b8" />
                <text x="362" y="247" fontSize="10" fill="#0f172a">target cell</text>
                <rect x="470" y="238" width="16" height="10" rx="4" fill="#c7d2fe" stroke="#94a3b8" />
                <text x="492" y="247" fontSize="10" fill="#0f172a">neighbor cell</text>

                <defs>
                  <marker id="arrow-by" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#0f172a" />
                  </marker>
                </defs>
              </svg>
              </ZoomableFigure>
              <p className="text-xs text-zinc-500">
                Mechanism: after lysosomal release, membrane‑permeable payloads can cross
                into nearby cells (bystander killing), while charged/hydrophilic payloads
                stay inside the original target cell and show little bystander effect. {cite(1)}
              </p>
              <p className="text-xs text-zinc-500">
                Determinants include payload charge/logP, linker cleavage chemistry, and
                antigen heterogeneity across the tumor. {cite(11)}
              </p>
              <p className="text-xs text-zinc-500">
                Advantages: helps treat heterogeneous tumors with mixed antigen expression
                and can improve depth of response in antigen‑low regions. {cite(1)}
              </p>
              <p className="text-xs text-zinc-500">
                Disadvantages: broader diffusion can raise off‑tumor toxicity risk and
                reduce the safety window if payload spreads beyond the tumor. {cite(1)}
              </p>
            </CardBody>
          </Card>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              visual adc atlas
            </h3>
            <span className="text-xs text-zinc-500">core structures and motifs</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {adcVisualLibrary.map((item) => (
              <StructureCard key={item.title} {...item} />
            ))}
          </div>
          <span className="text-xs text-zinc-500">{cite(10)}{cite(14)}{cite(15)}</span>
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              engineering determinants
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              adc design drivers
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            {designLevers.map((item) => (
              <div key={item.title} className="grid gap-1 rounded-xl border border-white/70 bg-white/60 p-3">
                <span className="text-sm font-semibold text-zinc-900">{item.title}</span>
                <span className="text-xs text-zinc-600">{item.detail}</span>
              </div>
            ))}
            <span className="text-xs text-zinc-500">{cite(1)}{cite(11)}{cite(13)}</span>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                conjugation
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                chemistry strategies
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <p>
                Traditional approaches include lysine or cysteine conjugation, which
                can create heterogeneous DAR distributions.
                {cite(1)}
              </p>
              <p>
                Site-specific strategies (engineered cysteines, enzymatic methods,
                glycan remodeling) improve uniformity and stability.
                {cite(1)}
              </p>
              <p>
                Cleavable linkers (e.g., protease-sensitive, acid-labile, disulfide)
                enable payload release, while non-cleavable thioether linkers rely on
                lysosomal degradation to generate active catabolites.
                {cite(1)}
                {cite(11)}
              </p>
              <p>
                Chemistry choice affects DAR distribution, aggregation risk, and the
                balance between plasma stability and tumor release.
                {cite(1)}
                {cite(13)}
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                pharmacology
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                PK/PD and biodistribution
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <p>
                ADC PK/PD is governed by multiple analytes (total antibody,
                conjugated antibody, released payload) that can diverge over time.
                {cite(2)}
              </p>
              <p>
                Linker stability, payload hydrophobicity, and DAR distribution
                influence clearance, tissue distribution, and exposure at the
                target site.
                {cite(2)}
              </p>
              <p>
                Higher DAR species often clear faster and can increase uptake in
                liver and reticuloendothelial tissues, shifting both efficacy and
                tolerability.
                {cite(13)}
              </p>
              <p>
                Deconjugation, catabolism, and target-mediated drug disposition
                can all shift the exposure profile compared with the parent mAb.
                {cite(2)}
              </p>
            </CardBody>
          </Card>
        </div>

        <section className="grid gap-6">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                conjugation reactions
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                representative chemistry schemes
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4 text-sm text-zinc-600 md:grid-cols-2">
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">NHS ester → lysine</p>
                <ZoomableFigure label="NHS ester to lysine conjugation scheme">
                <svg className="mt-3 h-24 w-full" viewBox="0 0 340 90" fill="none">
                  <rect x="10" y="20" width="90" height="50" rx="10" fill="#e0f2fe" />
                  <rect x="240" y="20" width="90" height="50" rx="10" fill="#e0f2fe" />
                  <text x="22" y="50" fontSize="12" fill="#0f172a">NHS ester</text>
                  <text x="252" y="50" fontSize="12" fill="#0f172a">amide</text>
                  <path d="M120 45h40" stroke="#0f172a" strokeWidth="2" />
                  <text x="165" y="50" fontSize="12" fill="#0f172a">+ Lys</text>
                  <path d="M210 45h20" stroke="#0f172a" strokeWidth="2" />
                </svg>
                </ZoomableFigure>
                <p className="mt-2 text-xs text-zinc-500">Common lysine conjugation route.</p>
                <p className="text-xs text-zinc-500">{cite(1)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">maleimide → cysteine</p>
                <ZoomableFigure label="Maleimide to cysteine conjugation scheme">
                <svg className="mt-3 h-24 w-full" viewBox="0 0 340 90" fill="none">
                  <rect x="10" y="20" width="100" height="50" rx="10" fill="#e0e7ff" />
                  <rect x="240" y="20" width="90" height="50" rx="10" fill="#e0e7ff" />
                  <text x="18" y="50" fontSize="12" fill="#0f172a">maleimide</text>
                  <text x="252" y="50" fontSize="12" fill="#0f172a">thioether</text>
                  <path d="M120 45h40" stroke="#0f172a" strokeWidth="2" />
                  <text x="165" y="50" fontSize="12" fill="#0f172a">+ Cys</text>
                  <path d="M210 45h20" stroke="#0f172a" strokeWidth="2" />
                </svg>
                </ZoomableFigure>
                <p className="mt-2 text-xs text-zinc-500">Classic cysteine conjugation route.</p>
                <p className="text-xs text-zinc-500">{cite(1)}</p>
              </div>
            </CardBody>
          </Card>
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              failure intermediates
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              where adcs can break down
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>target not accessible → poor binding or antigen heterogeneity</p>
            <p>slow internalization or receptor recycling → low lysosomal delivery</p>
            <p>inefficient trafficking → limited protease exposure</p>
            <p>linker instability → off-target release or low tumor exposure</p>
            <p>payload efflux or detoxification → reduced intracellular potency</p>
            <p>limited tumor penetration → exposure gaps in solid tumors</p>
            <p>toxicity limits → dose reduction before efficacy threshold</p>
            <span className="text-xs text-zinc-500">{cite(2)}{cite(11)}{cite(12)}</span>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                resistance
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                common failure modes
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <p>
                Resistance can arise from antigen loss, reduced internalization,
                impaired lysosomal processing, or drug efflux mechanisms.
                {cite(2)}
                {cite(11)}
              </p>
              <p>
                Additional pathways include altered intracellular trafficking,
                lysosomal pH changes, and upregulated DNA damage repair or
                microtubule dynamics, depending on payload class.
                {cite(11)}
              </p>
              <p>
                Payload switching and linker optimization are common response
                strategies.
                {cite(2)}
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                safety
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                toxicity drivers
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <p>
                Off-tumor antigen expression, premature payload release, and
                high DAR can increase systemic toxicity.
                {cite(2)}
                {cite(12)}
                {cite(13)}
              </p>
              <p>
                Compared with traditional chemotherapy, ADCs can deliver higher
                local payload concentrations but still show class-specific
                toxicities (for example ocular, hematologic, or neuropathic)
                depending on payload and linker design.
                {cite(2)}
                {cite(12)}
              </p>
              <p>
                Bystander diffusion can improve efficacy in antigen-low regions
                but may also broaden exposure to normal tissues if diffusion is
                too extensive.
                {cite(11)}
              </p>
              <p>
                The therapeutic index improves when target selection, linker
                stability, and payload choice are aligned with disease biology.
                {cite(2)}
                {cite(11)}
              </p>
            </CardBody>
          </Card>
        </div>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              analytics and manufacturing
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              quality and characterization
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <p className="text-sm text-zinc-600">
              ADCs require multi-attribute characterization across antibody,
              conjugate, and payload analytes to ensure batch consistency and
              clinically relevant exposure.
              {cite(11)}
            </p>
            <div className="grid items-stretch gap-4 md:grid-cols-2">
              <div className="flex h-full flex-col rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">HPLC / SEC</p>
                <ZoomableFigure label="Analytical SEC chromatogram">
                  <div className="zoom-frame mt-3 flex h-[18rem] items-center overflow-hidden rounded-md border border-slate-200 bg-white p-3">
                    <Image
                      alt="Analytical SEC chromatogram showing aggregation profile"
                      src="/images/custom/adc-sec-hplc-redraw.png"
                      className="zoom-graphic h-full w-full object-contain float-soft"
                    />
                  </div>
                </ZoomableFigure>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">What it shows:</span> a dominant monomer peak plus
                      earlier-eluting aggregate shoulders or peaks. Peak area and retention shifts help teams track
                      size change, self-association, and column behavior.{cite(11)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Why it matters:</span> aggregation can reduce apparent
                      potency, increase clearance, raise immunogenicity risk, and complicate dose-exposure behavior.
                      It is also a core stability readout under stress conditions.{cite(11)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Practical readout:</span> teams watch monomer purity,
                      aggregate growth, and retention-time drift when comparing batches, storage conditions, or new
                      linker-payload variants.{cite(11)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex h-full flex-col rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">LC‑MS (DAR deconvolution)</p>
                <ZoomableFigure label="LC-MS DAR deconvolution">
                  <div className="zoom-frame mt-3 flex h-[18rem] items-center overflow-hidden rounded-md border border-slate-200 bg-white p-3">
                    <Image
                      alt="LC-MS deconvoluted intact masses for light and heavy chains"
                      src="/images/custom/adc-lcms-light-heavy-redraw.png"
                      className="zoom-graphic h-full w-full object-contain float-soft"
                    />
                  </div>
                </ZoomableFigure>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">What it shows:</span> deconvoluted intact-mass shifts on
                      light and heavy chains that map to drug-load species and confirm conjugation.{cite(1)}{cite(13)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Why it matters:</span> LC-MS verifies DAR and shows
                      chain-level heterogeneity, which is harder to pin down confidently with hydrophobicity-based methods
                      alone.{cite(1)}{cite(13)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Practical readout:</span> teams usually reduce hinge
                      disulfides, often deglycosylate heavy chains, assign chain-specific drug loads, and then calculate
                      average DAR from the resolved species pattern.{cite(11)}{cite(13)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid items-stretch gap-4 md:grid-cols-3">
              <div className="flex h-full flex-col rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">HIC</p>
                <ZoomableFigure label="Generalized hydrophobic interaction chromatography readout">
                <div className="zoom-frame mt-3 flex h-[18rem] items-center overflow-hidden rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                  <svg
                    viewBox="0 0 700 360"
                    className="zoom-graphic h-full w-full"
                    role="img"
                    aria-label="Generalized hydrophobic interaction chromatography figure showing earlier versus later elution with increasing hydrophobicity and DAR"
                  >
                    <rect x="10" y="10" width="680" height="340" rx="18" fill="#f8fbff" stroke="#dbe7f5" />
                    <text x="28" y="38" fontSize="16" fill="#0f172a" fontWeight="700">generalized HIC readout</text>
                    <text x="28" y="56" fontSize="11" fill="#64748b">more hydrophobic or higher-DAR species usually elute later</text>

                    <rect x="34" y="78" width="298" height="180" rx="14" fill="#ffffff" stroke="#d7e2f0" />
                    <line x1="64" y1="228" x2="308" y2="228" stroke="#475569" strokeWidth="1.4" />
                    <line x1="64" y1="102" x2="64" y2="228" stroke="#475569" strokeWidth="1.4" />
                    <text x="162" y="252" fontSize="10" fill="#475569">retention time</text>
                    <g transform="translate(24,196) rotate(-90)">
                      <text fontSize="10" fill="#475569">signal</text>
                    </g>

                    <path d="M 72 226 C 96 226, 104 224, 114 206 C 122 188, 126 144, 130 110 C 134 148, 138 190, 146 208 C 154 222, 164 226, 180 226" fill="none" stroke="#2563eb" strokeWidth="2.8" />
                    <path d="M 72 226 C 136 226, 154 224, 166 204 C 176 188, 180 148, 184 120 C 188 154, 194 194, 204 210 C 214 222, 228 226, 248 226" fill="none" stroke="#16a34a" strokeWidth="2.8" />
                    <path d="M 72 226 C 186 226, 206 224, 220 200 C 232 178, 238 136, 244 104 C 248 142, 256 188, 268 208 C 280 222, 294 226, 310 226" fill="none" stroke="#b45309" strokeWidth="2.8" />

                    <g fill="#334155" fontSize="10">
                      <text x="114" y="94" textAnchor="middle">lower hydrophobicity</text>
                      <text x="184" y="106" textAnchor="middle">intermediate</text>
                      <text x="244" y="88" textAnchor="middle">higher hydrophobicity</text>
                    </g>

                    <g fill="#64748b" fontSize="9">
                      <text x="84" y="272">earlier elution</text>
                      <text x="236" y="272">later elution</text>
                    </g>

                    <rect x="362" y="78" width="304" height="180" rx="14" fill="#ffffff" stroke="#d7e2f0" />
                    <text x="382" y="104" fontSize="12" fill="#334155" fontWeight="600">DAR distribution pattern</text>

                    <line x1="392" y1="228" x2="640" y2="228" stroke="#475569" strokeWidth="1.4" />
                    <line x1="392" y1="118" x2="392" y2="228" stroke="#475569" strokeWidth="1.4" />
                    <text x="470" y="248" fontSize="10" fill="#475569">earlier</text>
                    <text x="588" y="248" fontSize="10" fill="#475569">later</text>
                    <text x="472" y="264" fontSize="10" fill="#475569">retention time</text>
                    <g transform="translate(372,198) rotate(-90)">
                      <text fontSize="10" fill="#475569">signal</text>
                    </g>

                    <path d="M 398 226 C 412 226, 420 220, 426 178 C 430 144, 432 122, 434 112 C 436 124, 440 154, 446 186 C 452 214, 460 226, 472 226" fill="none" stroke="#94a3b8" strokeWidth="2.1" />
                    <path d="M 450 226 C 464 226, 472 220, 478 186 C 482 158, 486 134, 490 126 C 494 138, 498 166, 504 194 C 510 216, 518 226, 530 226" fill="none" stroke="#60a5fa" strokeWidth="2.1" />
                    <path d="M 504 226 C 518 226, 526 220, 532 192 C 538 164, 542 138, 546 132 C 550 144, 556 172, 564 198 C 572 218, 580 226, 594 226" fill="none" stroke="#2563eb" strokeWidth="2.1" />
                    <path d="M 560 226 C 574 226, 582 220, 590 198 C 598 174, 604 150, 610 146 C 614 156, 620 182, 628 204 C 634 220, 640 226, 648 226" fill="none" stroke="#b45309" strokeWidth="2.1" />

                    <g fill="#334155" fontSize="9">
                      <text x="430" y="102" textAnchor="middle">DAR 0-1</text>
                      <text x="488" y="116" textAnchor="middle">DAR 2-3</text>
                      <text x="548" y="122" textAnchor="middle">DAR 4-5</text>
                      <text x="608" y="136" textAnchor="middle">DAR 6-8</text>
                    </g>

                    <g fill="#64748b" fontSize="9">
                      <text x="382" y="286">higher DAR often shifts the profile rightward and can broaden the distribution.</text>
                    </g>

                    <rect x="34" y="286" width="632" height="38" rx="10" fill="#ffffff" stroke="#dbe7f5" />
                    <text x="50" y="308" fontSize="10" fill="#64748b">
                      figure idea: HIC separates species by hydrophobicity, so unconjugated or lower-DAR material appears earlier, while stickier higher-DAR species move right.
                    </text>
                  </svg>
                </div>
                </ZoomableFigure>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">What it shows:</span> HIC separates ADC
                      species by hydrophobicity, so lower-DAR material usually elutes earlier while
                      heavier or stickier species shift later.{cite(11)}{cite(18)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Why it matters:</span> a right-shifted or
                      broadened profile can signal rising hydrophobicity, aggregation pressure, faster
                      clearance, and harder downstream handling.{cite(13)}{cite(18)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Practical readout:</span> HIC is fast and
                      intuitive, but teams usually pair it with LC-MS when they need final DAR assignments.{cite(11)}{cite(13)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex h-full flex-col rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">BLI / Octet</p>
                <ZoomableFigure label="Representative BLI or Octet assay workflow">
                <div className="zoom-frame mt-3 flex h-[18rem] items-center overflow-hidden rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                  <svg
                    viewBox="0 0 640 520"
                    className="zoom-graphic h-full w-full"
                    role="img"
                    aria-label="BLI workflow and sensorgram showing baseline, loading, equilibration, association, and dissociation"
                  >
                    <rect x="10" y="10" width="620" height="500" rx="20" fill="#f8fbff" stroke="#dbe7f5" />
                    <text x="28" y="36" fontSize="16" fill="#0f172a" fontWeight="700">representative BLI assay workflow + sensorgram</text>
                    <text x="28" y="54" fontSize="11" fill="#64748b">phase-by-phase view of sensor preparation, analyte binding, and dissociation readout</text>

                    <line x1="128" y1="72" x2="128" y2="486" stroke="#d6dee9" strokeDasharray="5 5" />
                    <line x1="246" y1="72" x2="246" y2="486" stroke="#d6dee9" strokeDasharray="5 5" />
                    <line x1="364" y1="72" x2="364" y2="486" stroke="#d6dee9" strokeDasharray="5 5" />
                    <line x1="492" y1="72" x2="492" y2="486" stroke="#d6dee9" strokeDasharray="5 5" />

                    <g fill="#0f172a" fontSize="10" fontWeight="600">
                      <text x="40" y="78">1. equilibration</text>
                      <text x="164" y="78">2. loading</text>
                      <text x="270" y="78">3. equilibration 2</text>
                      <text x="398" y="78">4. association</text>
                      <text x="528" y="78">5. dissociation</text>
                    </g>
                    <g fill="#475569" fontSize="9">
                      <text x="80" y="90" textAnchor="middle">sensor only</text>
                      <text x="80" y="102" textAnchor="middle">in buffer</text>

                      <text x="192" y="90" textAnchor="middle">ligand is</text>
                      <text x="192" y="102" textAnchor="middle">captured</text>

                      <text x="310" y="90" textAnchor="middle">ligand-only</text>
                      <text x="310" y="102" textAnchor="middle">baseline</text>

                      <text x="432" y="90" textAnchor="middle">analyte</text>
                      <text x="432" y="102" textAnchor="middle">binds ligand</text>

                      <text x="560" y="90" textAnchor="middle">analyte</text>
                      <text x="560" y="102" textAnchor="middle">dissociates</text>
                    </g>

                    <g>
                      <rect x="34" y="104" width="80" height="94" rx="10" fill="#ffffff" stroke="#cbd5e1" />
                      <rect x="152" y="104" width="80" height="94" rx="10" fill="#ffffff" stroke="#cbd5e1" />
                      <rect x="270" y="104" width="80" height="94" rx="10" fill="#ffffff" stroke="#cbd5e1" />
                      <rect x="388" y="104" width="88" height="94" rx="10" fill="#ffffff" stroke="#cbd5e1" />
                      <rect x="516" y="104" width="88" height="94" rx="10" fill="#ffffff" stroke="#cbd5e1" />

                      <path d="M 52 124 Q 74 116 96 124 L 96 170 Q 74 176 52 170 Z" fill="#d4d4d8" stroke="#a1a1aa" />
                      <path d="M 170 124 Q 192 116 214 124 L 214 170 Q 192 176 170 170 Z" fill="#d4d4d8" stroke="#a1a1aa" />
                      <path d="M 288 124 Q 310 116 332 124 L 332 170 Q 310 176 288 170 Z" fill="#d4d4d8" stroke="#a1a1aa" />
                      <path d="M 406 124 Q 430 116 454 124 L 454 170 Q 430 176 406 170 Z" fill="#d4d4d8" stroke="#a1a1aa" />
                      <path d="M 534 124 Q 558 116 582 124 L 582 170 Q 558 176 534 170 Z" fill="#d4d4d8" stroke="#a1a1aa" />

                      <circle cx="60" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="80" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="100" cy="170" r="4" fill="#f59e0b" />

                      <circle cx="178" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="198" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="218" cy="170" r="4" fill="#f59e0b" />
                      <path d="M 174 174 C 170 184, 170 196, 178 204 C 186 212, 186 224, 180 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 194 174 C 190 184, 190 196, 198 204 C 206 212, 206 224, 200 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 214 174 C 210 184, 210 196, 218 204 C 226 212, 226 224, 220 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />

                      <circle cx="296" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="316" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="336" cy="170" r="4" fill="#f59e0b" />
                      <path d="M 292 174 C 288 184, 288 196, 296 204 C 304 212, 304 224, 298 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 312 174 C 308 184, 308 196, 316 204 C 324 212, 324 224, 318 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 332 174 C 328 184, 328 196, 336 204 C 344 212, 344 224, 338 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />

                      <circle cx="414" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="434" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="454" cy="170" r="4" fill="#f59e0b" />
                      <path d="M 410 174 C 406 184, 406 196, 414 204 C 422 212, 422 224, 416 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 430 174 C 426 184, 426 196, 434 204 C 442 212, 442 224, 436 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 450 174 C 446 184, 446 196, 454 204 C 462 212, 462 224, 456 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 394 228 l 6 -10 l 6 10 M 420 242 l 6 -10 l 6 10 M 446 232 l 6 -10 l 6 10 M 468 246 l 6 -10 l 6 10" fill="none" stroke="#b91c1c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

                      <circle cx="542" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="562" cy="170" r="4" fill="#f59e0b" />
                      <circle cx="582" cy="170" r="4" fill="#f59e0b" />
                      <path d="M 538 174 C 534 184, 534 196, 542 204 C 550 212, 550 224, 544 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 558 174 C 554 184, 554 196, 562 204 C 570 212, 570 224, 564 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 578 174 C 574 184, 574 196, 582 204 C 590 212, 590 224, 584 232" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" />
                      <path d="M 520 234 l 6 -10 l 6 10 M 546 246 l 6 -10 l 6 10 M 592 238 l 6 -10 l 6 10" fill="none" stroke="#b91c1c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

                    </g>

                    <line x1="50" y1="458" x2="594" y2="458" stroke="#475569" strokeWidth="1.5" />
                    <line x1="50" y1="350" x2="50" y2="458" stroke="#475569" strokeWidth="1.5" />
                    <text x="300" y="492" fontSize="11" fill="#475569">time</text>
                    <g transform="translate(22,404) rotate(-90)">
                      <text fontSize="11" fill="#475569" textAnchor="middle">
                        binding response
                      </text>
                    </g>

                    <path
                      d="M 50 426 L 128 426 C 150 426, 172 410, 188 406 C 208 402, 228 402, 246 402 C 260 402, 280 402, 302 402 C 324 402, 344 402, 364 402 C 390 402, 408 378, 426 364 C 444 350, 466 344, 492 344 C 500 344, 506 354, 514 382 C 520 402, 530 416, 546 424 C 564 430, 586 432, 610 432"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M 50 420 L 128 420 C 150 420, 172 404, 188 400 C 208 396, 228 396, 246 396 C 260 396, 280 396, 302 396 C 324 396, 344 396, 364 396 C 390 396, 408 368, 426 352 C 444 334, 466 326, 492 326 C 500 326, 506 338, 514 364 C 520 384, 530 398, 546 406 C 564 412, 586 414, 610 414"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M 50 414 L 128 414 C 150 414, 172 396, 188 392 C 208 388, 228 388, 246 388 C 260 388, 280 388, 302 388 C 324 388, 344 388, 364 388 C 390 388, 408 354, 426 332 C 444 312, 466 304, 492 304 C 500 304, 506 318, 514 346 C 520 366, 530 382, 546 392 C 564 400, 586 404, 610 406"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="1.9"
                    />
                    <path
                      d="M 50 408 L 128 408 C 150 408, 172 386, 188 382 C 208 376, 228 376, 246 376 C 260 376, 280 376, 302 376 C 324 376, 344 376, 364 376 C 390 376, 408 338, 426 312 C 444 292, 466 282, 492 282 C 500 282, 506 296, 514 326 C 520 350, 530 368, 546 380 C 564 390, 586 396, 610 400"
                      fill="none"
                      stroke="#9333ea"
                      strokeWidth="2"
                    />
                    <path
                      d="M 50 402 L 128 402 C 150 402, 172 378, 188 374 C 208 368, 228 368, 246 368 C 260 368, 280 368, 302 368 C 324 368, 344 368, 364 368 C 390 368, 408 328, 426 298 C 444 276, 466 264, 492 264 C 500 264, 506 280, 514 314 C 520 340, 530 360, 546 374 C 564 386, 586 394, 610 398"
                      fill="none"
                      stroke="#b45309"
                      strokeWidth="2.1"
                    />

                    <g fill="#64748b" fontSize="10">
                      <text x="74" y="446">baseline</text>
                      <text x="170" y="446">loading</text>
                      <text x="278" y="446">baseline 2</text>
                      <text x="398" y="446">association</text>
                      <text x="522" y="446">dissociation</text>
                    </g>

                    <rect x="16" y="240" width="160" height="42" rx="10" fill="#ffffff" stroke="#dbe7f5" />
                    <circle cx="32" cy="255" r="5" fill="#f59e0b" />
                    <text x="42" y="259" fontSize="9" fill="#334155">attachment site</text>
                    <line x1="32" y1="271" x2="44" y2="271" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                    <text x="50" y="275" fontSize="9" fill="#334155">ligand</text>
                    <path d="M 98 276 l 5 -9 l 5 9" fill="none" stroke="#b91c1c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="112" y="275" fontSize="9" fill="#334155">analyte</text>

                    <g fill="#64748b" fontSize="8">
                      <text x="64" y="480">conc:</text>
                      <line x1="96" y1="477" x2="108" y2="477" stroke="#2563eb" strokeWidth="1.8" />
                      <text x="112" y="480">0.25</text>
                      <line x1="144" y1="477" x2="156" y2="477" stroke="#16a34a" strokeWidth="1.8" />
                      <text x="160" y="480">0.5</text>
                      <line x1="186" y1="477" x2="198" y2="477" stroke="#eab308" strokeWidth="1.8" />
                      <text x="202" y="480">1.0</text>

                      <line x1="96" y1="492" x2="108" y2="492" stroke="#9333ea" strokeWidth="1.8" />
                      <text x="112" y="495">2.0</text>
                      <line x1="144" y1="492" x2="156" y2="492" stroke="#b45309" strokeWidth="1.8" />
                      <text x="160" y="495">4.0 nM</text>
                    </g>

                    <text x="388" y="492" fontSize="10" fill="#64748b">association → k<tspan baselineShift="-3" fontSize="8">a</tspan></text>
                    <text x="508" y="492" fontSize="10" fill="#64748b">dissociation → k<tspan baselineShift="-3" fontSize="8">dis</tspan></text>
                  </svg>
                </div>
                </ZoomableFigure>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">What it shows:</span> BLI/Octet follows
                      association and dissociation in real time so teams can see whether conjugation
                      preserved binding quality after payload attachment.{cite(11)}{cite(19)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Why it matters:</span> an ADC can look
                      chemically clean but still lose function if conjugation perturbs the binding
                      interface, Fc geometry, or local flexibility.{cite(11)}{cite(19)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Practical readout:</span> the real question
                      is often whether `kon`, `koff`, or apparent `KD` changed after conjugation, not only
                      whether some binding signal is still present.{cite(19)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex h-full flex-col rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">in-vitro assays</p>
                <ZoomableFigure label="Generalized in-vitro assay readouts">
                <div className="zoom-frame mt-3 flex h-[18rem] items-center overflow-hidden rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                  <svg
                    viewBox="0 0 700 430"
                    className="zoom-graphic h-full w-full"
                    role="img"
                    aria-label="Generalized in-vitro assay figure showing antigen-high, antigen-low, and bystander co-culture dose response curves"
                  >
                    <rect x="10" y="10" width="680" height="410" rx="18" fill="#f8fbff" stroke="#dbe7f5" />
                    <text x="30" y="38" fontSize="16" fill="#0f172a" fontWeight="700">generalized in-vitro assay readouts</text>
                    <text x="30" y="57" fontSize="11" fill="#64748b">dose-response, antigen dependence, and bystander-style co-culture behavior</text>

                    <rect x="30" y="82" width="200" height="150" rx="14" fill="#ffffff" stroke="#d7e2f0" />
                    <rect x="250" y="82" width="200" height="150" rx="14" fill="#ffffff" stroke="#d7e2f0" />
                    <rect x="470" y="82" width="200" height="150" rx="14" fill="#ffffff" stroke="#d7e2f0" />

                    <g fill="#334155" fontSize="12" fontWeight="600">
                      <text x="48" y="105">a. antigen-high target cells</text>
                      <text x="268" y="105">b. antigen-low target cells</text>
                      <text x="488" y="105">c. co-culture / bystander format</text>
                    </g>

                    <g stroke="#475569" strokeWidth="1.2">
                      <line x1="58" y1="205" x2="208" y2="205" />
                      <line x1="58" y1="118" x2="58" y2="205" />
                      <line x1="278" y1="205" x2="428" y2="205" />
                      <line x1="278" y1="118" x2="278" y2="205" />
                      <line x1="498" y1="205" x2="648" y2="205" />
                      <line x1="498" y1="118" x2="498" y2="205" />
                    </g>

                    <g fill="#94a3b8" fontSize="8">
                      <text x="76" y="220">low dose</text>
                      <text x="156" y="220">high dose</text>
                      <text x="296" y="220">low dose</text>
                      <text x="376" y="220">high dose</text>
                      <text x="516" y="220">low dose</text>
                      <text x="596" y="220">high dose</text>
                    </g>

                    <g fill="#64748b" fontSize="8">
                      <text x="38" y="205">0</text>
                      <text x="32" y="162">50</text>
                      <text x="26" y="122">100</text>
                      <text x="258" y="205">0</text>
                      <text x="252" y="162">50</text>
                      <text x="246" y="122">100</text>
                      <text x="478" y="205">0</text>
                      <text x="472" y="162">50</text>
                      <text x="466" y="122">100</text>
                    </g>

                    <g transform="translate(22,186) rotate(-90)">
                      <text fontSize="9" fill="#64748b">cell viability (%)</text>
                    </g>
                    <g transform="translate(242,186) rotate(-90)">
                      <text fontSize="9" fill="#64748b">cell viability (%)</text>
                    </g>
                    <g transform="translate(462,186) rotate(-90)">
                      <text fontSize="9" fill="#64748b">cell viability (%)</text>
                    </g>

                    <path d="M 58 132 C 86 132, 104 140, 120 154 C 136 168, 150 186, 170 194 C 184 199, 196 201, 208 202" fill="none" stroke="#2563eb" strokeWidth="2.6" />
                    <path d="M 58 126 C 92 126, 116 130, 136 144 C 154 156, 172 176, 194 188 C 200 192, 204 196, 208 198" fill="none" stroke="#b45309" strokeWidth="2.6" />

                    <path d="M 278 150 C 308 150, 330 154, 348 162 C 366 170, 384 182, 408 192 C 416 196, 422 199, 428 200" fill="none" stroke="#2563eb" strokeWidth="2.6" />
                    <path d="M 278 136 C 314 136, 344 140, 370 150 C 392 160, 410 176, 428 188" fill="none" stroke="#b45309" strokeWidth="2.6" />

                    <path d="M 498 144 C 528 144, 546 150, 562 162 C 578 176, 592 192, 610 199 C 624 204, 636 205, 648 205" fill="none" stroke="#2563eb" strokeWidth="2.6" />
                    <path d="M 498 132 C 534 132, 560 136, 582 148 C 602 160, 620 176, 636 192 C 642 198, 646 201, 648 202" fill="none" stroke="#b45309" strokeWidth="2.6" />
                    <path d="M 498 158 C 520 158, 538 160, 554 168 C 570 178, 586 188, 604 194 C 620 200, 634 202, 648 203" fill="none" stroke="#7c3aed" strokeWidth="2.6" />

                    <rect x="518" y="250" width="150" height="56" rx="10" fill="#ffffff" stroke="#dbe7f5" />
                    <line x1="532" y1="266" x2="548" y2="266" stroke="#2563eb" strokeWidth="2.6" />
                    <text x="556" y="270" fontSize="10" fill="#334155">targeted conjugate</text>
                    <line x1="532" y1="282" x2="548" y2="282" stroke="#b45309" strokeWidth="2.6" />
                    <text x="556" y="286" fontSize="10" fill="#334155">free payload / control</text>
                    <line x1="532" y1="298" x2="548" y2="298" stroke="#7c3aed" strokeWidth="2.6" />
                    <text x="556" y="302" fontSize="10" fill="#334155">bystander format</text>

                    <rect x="30" y="250" width="458" height="86" rx="12" fill="#ffffff" stroke="#dbe7f5" />
                    <text x="46" y="272" fontSize="11" fill="#334155" fontWeight="600">what these assay panels usually test</text>
                    <g fill="#64748b" fontSize="10">
                      <text x="46" y="294">• antigen-high cells: expected strongest target-dependent potency</text>
                      <text x="46" y="311">• antigen-low cells: weaker response unless target expression and trafficking are still sufficient</text>
                      <text x="46" y="328">• co-culture / bystander conditions: asks whether released payload affects neighboring cells</text>
                    </g>

                    <text x="46" y="370" fontSize="10" fill="#64748b">generalized schematic, not a target-specific dataset</text>
                  </svg>
                </div>
                </ZoomableFigure>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">What it shows:</span> these panels compare
                      dose response across antigen-high, antigen-low, and bystander-style settings to
                      separate target dependence from broader payload-mediated killing.{cite(11)}{cite(18)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Why it matters:</span> they reveal whether
                      a well-characterized conjugate is actually producing the biology you want, including
                      low-expression coverage and bystander behavior.{cite(2)}{cite(11)}{cite(18)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs leading-6 text-zinc-500">
                      <span className="font-semibold underline">Practical readout:</span> the strongest assay
                      sets include antigen-negative, naked-antibody, and free-payload controls, plus more
                      realistic 3D models when penetration and heterogeneity matter.{cite(11)}{cite(18)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <p className="text-sm text-zinc-600">
                Functional assays: binding (flow/SPR), internalization (live‑cell imaging or flow),
                and potency (cell‑kill or target‑pathway assays) confirm that conjugation did not
                compromise target engagement and activity. {cite(1)}{cite(11)}
              </p>
              <p className="text-sm text-zinc-600">
                Stability testing: in‑vitro serum stability and deconjugation rate assays track
                how fast payload is lost in circulation, while in‑vivo PK/PD evaluates intact ADC,
                total antibody, and released payload exposure. {cite(2)}{cite(11)}
              </p>
              <p className="text-sm text-zinc-600">
                Manufacturing controls target lot‑to‑lot reproducibility, reaction yield, and
                stability during storage/transport. Orthogonal methods triangulate critical
                quality attributes to de‑risk clinical translation. {cite(11)}
              </p>
            </div>

            <div className="grid gap-2">
              {analytics.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-zinc-500">{cite(1)}{cite(11)}{cite(13)}</span>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-sky-600 via-sky-500 to-indigo-500 text-white border-none">
          <CardBody className="flex flex-col gap-4 py-8">
            <h3 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              clinical landscape
            </h3>
            <p className="text-white/85 text-sm max-w-2xl">
              The ADC field has rapidly expanded, with approvals across solid
              tumors and hematologic malignancies and an accelerating clinical
              pipeline of next-generation constructs.
              {cite(2)}
            </p>
          </CardBody>
        </Card>

        <section className="grid gap-3">
          <h3 className="text-xl font-semibold font-[family-name:var(--font-space-grotesk)]">
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
