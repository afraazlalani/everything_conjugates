"use client";

import Image from "next/image";
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
} from "@heroui/react";
import { motion } from "framer-motion";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { OligoSectionTabs } from "@/components/OligoSectionTabs";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const architecture = [
  {
    title: "Targeting module",
    text:
      "The targeting part can be an antibody, Fab, peptide, aptamer, or receptor-directed ligand. Its job is to bias uptake into the right tissue or cell type rather than to deliver cytotoxic killing.",
  },
  {
    title: "Linker or spacer",
    text:
      "The connector has to survive circulation, preserve oligo function, and sometimes help with valency, shielding, or endosomal release rather than just carrying a toxic warhead.",
  },
  {
    title: "Oligonucleotide effector",
    text:
      "The cargo is the therapeutic logic itself: siRNA for RNAi, PMO for steric splice switching, ASO for RNase H or steric antisense effects, and other exploratory nucleic-acid formats.",
  },
];

const chapterLinks = [
  {
    title: "mAb / targeting module",
    text: "how antibodies, fabs, ligands, and peptides are used to steer oligo uptake into the right cells",
    href: "/oligo/mab",
    accent: "sky",
  },
  {
    title: "Linker / spacer",
    text: "how the connector changes stability, spacing, release, valency, and endosomal-trafficking behavior",
    href: "/oligo/linker",
    accent: "amber",
  },
  {
    title: "Oligo",
    text: "the oligonucleotide cargo branch covering siRNA, PMO, ASO, and how each scaffold changes mechanism and chemistry",
    href: "/oligo/oligo",
    accent: "violet",
  },
];

type ChapterAccent = (typeof chapterLinks)[number]["accent"];

const bottlenecks = [
  {
    title: "Receptor engagement",
    text: "Cell-surface recognition still matters, but uptake only helps if the conjugate reaches an intracellular compartment where the oligo can act.",
  },
  {
    title: "Endosomal escape",
    text: "Unlike ADCs, oligo conjugates do not win just by entering the cell. A large fraction can remain trapped in endosomes unless the system escapes into cytosol or reaches the nucleus productively.",
  },
  {
    title: "Subcellular destination",
    text: "siRNA needs cytosolic RISC loading, while many ASO and PMO splice-switching strategies need access to pre-mRNA in the nucleus.",
  },
  {
    title: "Backbone compatibility",
    text: "Backbone, sugar, and end-group chemistry control nuclease resistance, protein binding, affinity, toxicity, and whether conjugation hurts or helps performance.",
  },
];

const whyAocRows = [
  {
    title: "What an AOC is",
    text: "An antibody- or ligand-oligonucleotide conjugate joins a targeting module, a linker, and a gene-modulating oligo so the construct can bias delivery into a chosen cell population instead of relying on naked oligo distribution alone.",
  },
  {
    title: "Why the field wants it",
    text: "Many oligos have strong sequence logic but still struggle with tissue selectivity, extrahepatic delivery, or productive intracellular routing. AOCs try to solve that delivery problem without giving up programmable RNA biology.",
  },
  {
    title: "Why it is gaining traction",
    text: "The modality is getting more attention because oligo chemistry, conjugation methods, and receptor-targeting strategies have all matured enough to test whether selective extrahepatic delivery can be made practical.",
  },
  {
    title: "What success actually means",
    text: "A good AOC does more than bind a receptor. it has to survive in circulation, land in the right tissue, enter cells through a productive route, and still let the oligo reach the cytosol or nucleus in an active form.",
  },
];

const useCaseRows = [
  {
    title: "Extrahepatic delivery ambition",
    text: "AOCs are especially attractive when the biology is compelling but naked oligo distribution is too weak or too nonspecific outside privileged tissues like liver.",
  },
  {
    title: "Cell-selective gene modulation",
    text: "Because the oligo carries sequence-level logic, the targeting module can add a second layer of selectivity by deciding which cells even get a realistic chance to see active cargo.",
  },
  {
    title: "Non-cytotoxic intervention",
    text: "Unlike classic ADCs, the goal is usually not to poison the target cell. the point is to change RNA output inside that cell through knockdown, splice correction, or steric antisense control.",
  },
  {
    title: "Modular tuning",
    text: "AOCs are modular in a useful way: targeting module, linker geometry, and oligo chemistry can each change exposure, routing, and mechanism without forcing the whole program into small-molecule warhead logic.",
  },
];

const technicalRows = [
  {
    title: "Conjugation site and stoichiometry",
    text: "How many oligos are attached, and where, can change exposure, receptor clustering, manufacturability, and biological output. unlike naked oligos, architecture becomes part of potency.",
  },
  {
    title: "Active species problem",
    text: "Developers have to decide whether the intact conjugate, a processed catabolite, or a released free oligo is the molecule that really drives activity in tissue.",
  },
  {
    title: "Trafficking is the real bottleneck",
    text: "For many AOCs, the dominant failure mode is not poor binding. it is getting trapped in endosomes or routed to a compartment where the oligo cannot perform its mechanism.",
  },
  {
    title: "Bioanalysis is harder than for naked oligos",
    text: "Teams have to track antibody side, conjugated oligo side, free oligo catabolites, and tissue PK/PD together, because exposure can drift long before the biology makes sense.",
  },
];

const references = [
  {
    id: 1,
    label:
      "Chemistry, Structure, and Function of Approved Oligonucleotide Therapeutics (Nucleic Acids Research, 2023)",
    href: "https://academic.oup.com/nar/article/51/6/2529/7047002",
  },
  {
    id: 2,
    label:
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of siRNA Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00802",
  },
  {
    id: 3,
    label:
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of PMO Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00803",
  },
  {
    id: 4,
    label:
      "GalNAc-siRNA Conjugates: Leading the Way for Delivery of RNAi Therapeutics (Mol Ther, 2018)",
    href: "https://pubmed.ncbi.nlm.nih.gov/29792572/",
  },
  {
    id: 5,
    label:
      "Characterizing the effect of GalNAc and phosphorothioate backbone on binding of antisense oligonucleotides to the asialoglycoprotein receptor (NAR, 2017)",
    href: "https://pubmed.ncbi.nlm.nih.gov/28158620/",
  },
  {
    id: 6,
    label:
      "Antibody-Oligonucleotide Conjugates as Therapeutic, Imaging, and Detection Agents (Bioconjugate Chemistry, 2019)",
    href: "https://pubmed.ncbi.nlm.nih.gov/31339691/",
  },
  {
    id: 7,
    label:
      "Advances in the pharmaceutical development of antibody-oligonucleotide conjugates (Eur J Pharm Sci, 2025)",
    href: "https://pubmed.ncbi.nlm.nih.gov/41022318/",
  },
  {
    id: 8,
    label:
      "Bioanalytical approaches to support the development of antibody-oligonucleotide conjugate (AOC) therapeutic proteins (Xenobiotica, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38607350/",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function OligoPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const renderChapterGraphic = (accent: ChapterAccent) => {
    if (accent === "sky") {
      return (
        <div className="h-40 w-full rounded-[1.15rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)] p-4">
          <div className="flex h-full items-center justify-center overflow-hidden rounded-[0.95rem] border border-sky-100 bg-white/85 p-3">
            <Image
              src="https://commons.wikimedia.org/wiki/Special:FilePath/Engineered%20monoclonal%20antibodies.svg"
              alt="Open-source schematic of engineered antibody targeting formats including Fab, scFv, and single-domain antibody modalities"
              width={720}
              height={360}
              unoptimized
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      );
    }

    if (accent === "amber") {
      return (
        <div className="h-40 w-full rounded-[1.15rem] border border-amber-100 bg-[linear-gradient(135deg,#fffdf7_0%,#f8fbff_100%)] p-4">
          <div className="grid h-full grid-cols-[1.2fr,0.8fr] gap-3 rounded-[0.95rem] border border-amber-100 bg-white/85 p-3">
            <div className="overflow-hidden rounded-[0.8rem] border border-slate-100 bg-white p-2">
              <svg className="h-full w-full" viewBox="0 0 260 120" fill="none">
                <rect x="12" y="34" width="74" height="48" rx="20" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="3" />
                <rect x="106" y="48" width="38" height="20" rx="10" fill="#fff7ed" stroke="#f59e0b" strokeWidth="3" />
                <path d="M86 58H106" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
                <path d="M144 58H166" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
                <rect x="166" y="38" width="78" height="40" rx="20" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="3" />
                <path d="M214 58c8-10 18-10 28 0" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
                <circle cx="214" cy="58" r="5" fill="#8b5cf6" />
                <text x="26" y="63" fontSize="12" fontWeight="700" fill="#0369a1">targeting</text>
                <text x="111" y="61" fontSize="10" fontWeight="700" fill="#b45309">linker</text>
                <text x="184" y="63" fontSize="12" fontWeight="700" fill="#6b21a8">oligo</text>
              </svg>
            </div>
            <div className="overflow-hidden rounded-[0.8rem] border border-slate-100 bg-white p-2">
              <Image
                src="https://commons.wikimedia.org/wiki/Special:FilePath/Acyl_hydrazone_linker.svg"
                alt="Open-source example of a cleavable acyl hydrazone linker structure"
                width={360}
                height={360}
                unoptimized
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <svg className="h-40 w-full" viewBox="0 0 320 160" fill="none">
        <rect x="12" y="14" width="296" height="132" rx="28" fill="url(#violetPanel)" stroke="#ddd6fe" strokeWidth="2" />

        <rect x="34" y="42" width="124" height="24" rx="12" fill="#eff6ff" stroke="#7dd3fc" strokeWidth="2.5" />
        <rect x="34" y="74" width="124" height="24" rx="12" fill="#eff6ff" stroke="#7dd3fc" strokeWidth="2.5" />
        <text x="48" y="58" fontSize="17" fontWeight="700" fill="#0369a1">A U G C A U</text>
        <text x="48" y="90" fontSize="17" fontWeight="700" fill="#0369a1">U A C G U A</text>
        <path d="M96 66V74" stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 4" />

        <rect x="184" y="40" width="104" height="28" rx="14" fill="#f0fdf4" stroke="#4ade80" strokeWidth="2.5" />
        <text x="198" y="59" fontSize="17" fontWeight="700" fill="#15803d">A T G C T</text>

        <rect x="184" y="84" width="104" height="28" rx="14" fill="#fff7ed" stroke="#fb923c" strokeWidth="2.5" />
        <circle cx="204" cy="98" r="8" fill="#fed7aa" stroke="#fb923c" strokeWidth="2" />
        <circle cx="228" cy="98" r="8" fill="#fed7aa" stroke="#fb923c" strokeWidth="2" />
        <circle cx="252" cy="98" r="8" fill="#fed7aa" stroke="#fb923c" strokeWidth="2" />
        <circle cx="276" cy="98" r="8" fill="#fed7aa" stroke="#fb923c" strokeWidth="2" />
        <text x="198" y="126" fontSize="14" fontWeight="600" fill="#9a3412">a t g c u</text>

        <defs>
          <linearGradient id="violetPanel" x1="12" y1="14" x2="308" y2="146" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f8fbff" />
            <stop offset="1" stopColor="#faf5ff" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const mermaidDiagram = `flowchart LR
    A["1. bind receptor"] --> B["2. internalize"]
    B --> C["3. escape bottleneck"]
    C --> D["4. route to productive compartment"]
    D --> E["5. engage RNA mechanism"]

    classDef sky fill:#e0f2fe,stroke:#38bdf8,color:#0f172a;
    classDef indigo fill:#e0e7ff,stroke:#818cf8,color:#0f172a;
    classDef amber fill:#fef3c7,stroke:#f59e0b,color:#92400e;
    classDef emerald fill:#dcfce7,stroke:#4ade80,color:#166534;
    classDef violet fill:#f3e8ff,stroke:#c084fc,color:#6b21a8;

    class A sky;
    class B indigo;
    class C amber;
    class D emerald;
    class E violet;`;

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
        const { svg } = await mermaid.render(`oligo-delivery-${Date.now()}`, mermaidDiagram);
        if (!cancelled) setMermaidSvg(svg);
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
      <BackgroundMotif variant="oligo" />

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
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            oligonucleotide conjugates
          </Chip>
          <h1 className="site-page-title font-semibold">
            targeted delivery for gene silencing and splice control
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            Oligonucleotide conjugates pair a targeting module with a therapeutic
            nucleic-acid cargo. Instead of delivering cytotoxic killing like an
            ADC, they are built to steer siRNA, PMO, ASO, or related oligos into
            the right cells and the right intracellular compartment.
            {cite(1)}
            {cite(2)}
            {cite(3)}
          </p>
          <OligoSectionTabs />
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              chapter map
            </p>
            <h2 className="site-page-heading font-semibold">
              the same 3-part logic as adc, adapted for oligo conjugates
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            {chapterLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex h-full min-h-[14rem] flex-col rounded-[1rem] border border-white/80 bg-white/80 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:text-inherit"
              >
                <div className="mb-5 overflow-hidden rounded-[1rem] border border-slate-100 bg-slate-50/80 px-4 py-3">
                  {renderChapterGraphic(item.accent)}
                </div>
                <div className="space-y-3">
                  <p className="text-2xl font-semibold leading-tight text-zinc-900">
                    {item.title}
                  </p>
                  <p className="text-sm leading-7 text-zinc-600">{item.text}</p>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>

        <section className="grid gap-6 md:grid-cols-3">
          {architecture.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80 h-full">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                  {item.text}
                  {cite(1)}
                </p>
              </CardBody>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {whyAocRows.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                  {item.text}
                  {cite(6)}
                  {cite(7)}
                </p>
              </CardBody>
            </Card>
          ))}
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              delivery logic
            </p>
            <h2 className="site-page-heading font-semibold">
              how oligo conjugates work in cells
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="Oligonucleotide conjugate delivery sequence">
              <div className="zoom-graphic rounded-[1rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)] p-4">
                <div
                  className="mermaid-flow [&_svg]:h-auto [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {bottlenecks.map((item) => (
                <div key={item.title} className="rounded-[1rem] border border-white/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1rem] border border-white/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-semibold text-zinc-900">what changes versus adc logic</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">cell entry is not enough. productive compartment access is the real gate.</p>
              </div>
              <div className="rounded-[1rem] border border-white/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-semibold text-zinc-900">linker role shifts</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">spacing, stability, and escape can matter more than classic payload-release chemistry.</p>
              </div>
              <div className="rounded-[1rem] border border-white/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-semibold text-zinc-900">no bystander killing model</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">the goal is RNA modulation inside the target cell, not diffusion of a cytotoxic warhead.</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                why teams care
              </p>
              <h2 className="site-page-heading font-semibold">
                where aocs can be genuinely useful
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              {useCaseRows.map((row) => (
                <div key={row.title} className="rounded-xl border border-white/70 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-zinc-900">{row.title}</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    {row.text}
                    {cite(2)}
                    {cite(3)}
                    {cite(4)}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                technical reality
              </p>
              <h2 className="site-page-heading font-semibold">
                what makes aocs scientifically hard
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              {technicalRows.map((row) => (
                <div key={row.title} className="rounded-xl border border-white/70 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-zinc-900">{row.title}</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    {row.text}
                    {cite(2)}
                    {cite(3)}
                    {cite(8)}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              page split
            </p>
            <h2 className="site-page-heading font-semibold">
              where the deeper science lives
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <div className="grid gap-4 md:grid-cols-3">
              {chapterLinks.map((item) => (
                <div key={item.title} className="rounded-[1rem] border border-white/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-base font-semibold text-zinc-900">{item.title}</p>
                  <p className="mt-3 text-xs leading-6 text-zinc-600">{item.text}</p>
                  <Link href={item.href} className="mt-3 inline-block text-xs font-medium text-sky-700">
                    go deeper
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-xs leading-6 text-zinc-500">
              the overview page stays at the whole-aoc level. the page-specific detail
              about targeting formats, linker attachment logic, and cargo-specific
              oligo mechanisms lives in the three dedicated branches below.{cite(1)}{cite(2)}{cite(3)}
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
