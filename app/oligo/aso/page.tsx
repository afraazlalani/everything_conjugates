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
import { ZoomableFigure } from "@/components/ZoomableFigure";

const advantages = [
  "mechanism flexibility: RNase H gapmers, steric blockers, and splice-switching designs can all sit inside the ASO family",
  "strong medicinal-chemistry base with phosphorothioate and 2′-modified chemistries already well explored in the clinic",
  "single-stranded format can simplify some design and manufacturing choices compared with duplex siRNA",
];

const disadvantages = [
  "backbone and sugar chemistry can strongly influence protein binding, distribution, and toxicity",
  "productive nuclear or intracellular delivery is still a major bottleneck for many antisense programs",
  "conjugation can improve targeting but also changes valency, clearance, and the local chemistry seen by proteins",
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
      "Effect of modular conjugation strategy for N-acetylgalactosamine-targeted antisense oligonucleotides (Nucleosides Nucleotides Nucleic Acids, 2020)",
    href: "https://pubmed.ncbi.nlm.nih.gov/31617782/",
  },
  {
    id: 3,
    label:
      "Characterizing the effect of GalNAc and phosphorothioate backbone on binding of antisense oligonucleotides to the asialoglycoprotein receptor (NAR, 2017)",
    href: "https://pubmed.ncbi.nlm.nih.gov/28158620/",
  },
  {
    id: 4,
    label:
      "Bioanalysis of free antisense oligonucleotide payload from antibody-oligonucleotide conjugate by hybridization LC-MS/MS (Bioanalysis, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/39041663/",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function AsoPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart TD
    A["1. deliver strand<br/>conjugation improves cell or tissue uptake"]
    B["2. hybridize to RNA<br/>single strand pairs with a complementary transcript"]
    C["3a. gapmer path<br/>RNase H recognizes the DNA-like gap and cuts target RNA"]
    D["3b. steric path<br/>translation or splicing is redirected without cleavage"]
    E["backbone implication<br/>architecture decides the mechanism: gapmers need a DNA-like core, while fully modified steric blockers avoid RNase H cleavage"]

    A --> B
    B --> C
    B --> D
    C --> E
    D --> E

    classDef sky fill:#e0f2fe,stroke:#38bdf8,color:#0f172a;
    classDef indigo fill:#e0e7ff,stroke:#818cf8,color:#0f172a;
    classDef emerald fill:#dcfce7,stroke:#4ade80,color:#166534;
    classDef amber fill:#fef3c7,stroke:#f59e0b,color:#92400e;
    classDef slate fill:#ffffff,stroke:#cbd5e1,color:#334155;

    class A sky;
    class B indigo;
    class C emerald;
    class D amber;
    class E slate;`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const tryRender = async () => {
      const mermaid = (
        window as typeof window & {
          mermaid?: {
            render: (id: string, text: string) => Promise<{ svg: string }>;
            initialize: (cfg: Record<string, unknown>) => void;
          };
        }
      ).mermaid;

      if (!mermaid) return false;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          fontSize: "22px",
          fontFamily: "var(--font-manrope), sans-serif",
          primaryTextColor: "#0f172a",
          lineColor: "#0f172a",
        },
        flowchart: {
          nodeSpacing: 40,
          rankSpacing: 68,
          padding: 28,
          curve: "basis",
          htmlLabels: true,
        },
      });

      try {
        const { svg } = await mermaid.render(`aso-flow-${Date.now()}`, mermaidDiagram);
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
        <div className="ml-auto flex items-center gap-3">
          <Link href="/oligo" className="text-sm text-sky-700">
            oligo overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            ASO
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            antisense conjugates for degradation or steric block
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            ASO conjugates use a single-stranded antisense scaffold to bind RNA and
            either trigger RNase H-mediated degradation or act through steric block
            and splice modulation. The exact behavior depends heavily on backbone
            chemistry and architecture.
            {cite(1)}
            {cite(2)}
            {cite(3)}
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              ASO schematic
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              antisense splice-modulation example
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <ZoomableFigure label="ASO splice-modulation schematic">
              <div className="zoom-frame overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <Image
                  src="https://commons.wikimedia.org/wiki/Special:FilePath/Nusinersen%20mechanism%20of%20action.svg"
                  alt="Open-license nusinersen mechanism schematic showing ASO-mediated splice modulation"
                  width={1400}
                  height={900}
                  unoptimized
                  className="zoom-graphic mx-auto h-auto max-h-[28rem] w-full object-contain"
                />
              </div>
            </ZoomableFigure>
            <p className="text-xs leading-6 text-zinc-500">
              Open-license ASO mechanism figure from Wikimedia Commons:{" "}
              <Link href="https://commons.wikimedia.org/wiki/File:Nusinersen_mechanism_of_action.svg" className="text-sky-700">
                Nusinersen mechanism of action.svg
              </Link>
              . License shown on the file page: CC BY-SA 4.0.{cite(2)}
            </p>
            <div className="rounded-xl border border-white/70 bg-white/70 p-4">
              <p className="text-sm font-semibold text-zinc-900">what this means biologically</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                ASOs are single-stranded oligos that work by sequence-specific hybridization
                to RNA. Depending on architecture, they can act as gapmers that recruit RNase H
                for transcript degradation, or as fully modified steric blockers that alter
                splicing or translation without cleavage. The nusinersen-style figure shown here
                is one splice-modulation example: the ASO binds pre-mRNA and prevents exclusion
                of a critical exon, increasing production of the desired mature transcript.
                In conjugate design, delivery has to preserve both hybridization and access to
                the compartment where that RNA processing step occurs.{cite(1)}{cite(2)}{cite(3)}{cite(4)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              mechanism
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how ASO conjugates work
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="ASO mechanisms of action">
              <div className="zoom-graphic rounded-[1.15rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-5">
                <div
                  className="mermaid-flow min-h-[34rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                backbone and chemistry
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                what the ASO scaffold is built from
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              <p>
                Many therapeutic ASOs are single-stranded phosphorothioate-based
                constructs with 2′-modified sugars such as 2′-MOE, 2′-OMe, or related
                chemistries, chosen to tune affinity, stability, and protein binding.
                {cite(1)}
              </p>
              <p>
                Gapmer ASOs typically use modified flanks with a more DNA-like central
                gap so RNase H can recognize the heteroduplex and cut the RNA target.
                Fully modified steric blockers use a different logic and do not rely on
                RNase H cleavage.
                {cite(1)}
              </p>
              <p>
                Because phosphorothioate chemistry strongly changes protein interactions
                and biodistribution, ASO behavior is often tightly coupled to chemistry
                rather than sequence alone.
                {cite(1)}
                {cite(3)}
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                conjugation relevance
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                why ASO conjugation is useful
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              <p>
                Ligand conjugation such as GalNAc can sharply improve uptake into
                hepatocytes by exploiting ASGPR biology, while antibody and Fab-based
                conjugates are being explored for more cell-selective delivery beyond
                the liver.
                {cite(2)}
                {cite(3)}
                {cite(4)}
              </p>
              <p>
                Conjugation does not remove the need for productive intracellular routing.
                The delivered ASO still has to reach the compartment where its RNA target
                and mechanism are accessible.
                {cite(4)}
              </p>
              <p>
                In practice, teams often care about the free ASO payload that becomes
                available after delivery, because that release profile shapes tissue PK/PD
                and actual biological activity.
                {cite(4)}
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                advantages
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              {advantages.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                disadvantages
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              {disadvantages.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </CardBody>
          </Card>
        </div>

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
