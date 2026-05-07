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
import { MoleculeCard } from "@/components/MoleculeCard";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const advantages = [
  "catalytic RNAi mechanism can drive strong knockdown from a relatively small number of productive cytosolic events",
  "well-developed medicinal chemistry toolkit with 2′-F, 2′-OMe, and terminal phosphorothioate patterns",
  "clear fit for receptor-targeted conjugates when cytosolic delivery can be achieved",
];

const disadvantages = [
  "endosomal escape is still the main biological bottleneck",
  "guide/passenger strand design and conjugation position can hurt RISC loading if done poorly",
  "double-stranded architecture adds formulation and manufacturing complexity compared with single-stranded ASOs",
];

const references = [
  {
    id: 1,
    label:
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of siRNA Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00802",
  },
  {
    id: 2,
    label:
      "Chemistry, Structure, and Function of Approved Oligonucleotide Therapeutics (Nucleic Acids Research, 2023)",
    href: "https://academic.oup.com/nar/article/51/6/2529/7047002",
  },
  {
    id: 3,
    label:
      "GalNAc-siRNA Conjugates: Leading the Way for Delivery of RNAi Therapeutics (Mol Ther, 2018)",
    href: "https://pubmed.ncbi.nlm.nih.gov/29792572/",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function SirnaPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart TD
    A["1. deliver duplex<br/>targeted uptake brings the conjugate into the cell"]
    B["2. escape endosome<br/>only a small productive fraction reaches cytosol"]
    C["3. load RISC<br/>passenger strand leaves and guide strand is retained"]
    D["4. cleave target mRNA<br/>Ago2-guided recognition cuts the matching transcript"]
    E["design takeaway<br/>potency depends on escape plus productive RISC loading"]

    A --> B --> C --> D --> E

    classDef sky fill:#e0f2fe,stroke:#38bdf8,color:#0f172a;
    classDef indigo fill:#e0e7ff,stroke:#818cf8,color:#0f172a;
    classDef emerald fill:#dcfce7,stroke:#4ade80,color:#166534;
    classDef violet fill:#f3e8ff,stroke:#c084fc,color:#6b21a8;
    classDef slate fill:#ffffff,stroke:#cbd5e1,color:#334155;

    class A sky;
    class B indigo;
    class C emerald;
    class D violet;
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
          rankSpacing: 65,
          padding: 28,
          curve: "basis",
          htmlLabels: true,
        },
      });

      try {
        const { svg } = await mermaid.render(`sirna-flow-${Date.now()}`, mermaidDiagram);
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
            siRNA
          </Chip>
          <h1 className="site-page-title font-semibold">
            siRNA conjugates for cytosolic gene silencing
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            siRNA conjugates are built to deliver a short RNA duplex into the
            cytosol, where the guide strand loads into RISC and drives sequence-specific
            mRNA cleavage. Conjugation mostly exists to solve delivery, trafficking,
            and tissue targeting rather than to change the RNAi mechanism itself.
            {cite(1)}
            {cite(2)}
            {cite(3)}
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              mechanism
            </p>
            <h2 className="site-page-heading font-semibold">
              how siRNA conjugates work
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
              <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3">
                <MoleculeCard label="siRNA duplex" variant="oligo" />
              </div>
              <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3">
                <ZoomableFigure label="siRNA mechanism of action">
                  <div className="zoom-graphic rounded-[1.15rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-5">
                    <div
                      className="mermaid-flow min-h-[34rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                      dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                    />
                  </div>
                </ZoomableFigure>
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-5">
              <p className="text-sm font-semibold text-zinc-900">how to read the two visuals together</p>
              <div className="mt-3 grid gap-2 text-sm leading-7 text-zinc-600">
                <p>The left image is the compact RNAi overview: duplex processing, RISC assembly, and target-mRNA cleavage.</p>
                <p>The right image adds the conjugate-specific bottleneck, showing that endosomal escape is the step most delivery systems struggle with.</p>
                <p>1. the conjugated siRNA duplex is taken up into the cell through the delivery system.</p>
                <p>2. only a small productive fraction escapes the endosome into the cytosol.</p>
                <p>3. the duplex is loaded into Argonaute-containing RISC, and the passenger strand is removed.</p>
                <p>4. the retained guide strand base-pairs with a complementary mRNA target.</p>
                <p>5. Ago2-mediated cleavage cuts that transcript and lowers expression of the encoded protein.</p>
                <p>6. for conjugate design, the real challenge is not changing the RNAi mechanism, but preserving duplex integrity and getting enough siRNA to the cytosol for productive RISC loading.{cite(1)}{cite(2)}{cite(3)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                backbone and chemistry
              </p>
              <h2 className="site-page-heading font-semibold">
                what the siRNA scaffold looks like
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid grid-cols-1 gap-5 text-sm text-zinc-600 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)] xl:items-start">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <ZoomableFigure label="siRNA duplex backbone and strand layout">
                  <div className="zoom-frame flex h-[20rem] w-full items-center justify-center overflow-hidden rounded-[1rem] border border-sky-100 bg-white p-5">
                    <Image
                      src="https://commons.wikimedia.org/wiki/Special:FilePath/SiRNA%20Structure2.svg"
                      alt="Open-license siRNA structure schematic showing a short paired duplex with 3-prime overhangs"
                      width={1280}
                      height={453}
                      unoptimized
                      className="zoom-graphic max-h-full w-full object-contain"
                    />
                  </div>
                </ZoomableFigure>
                <p className="mt-3 text-sm leading-7 text-zinc-500">
                  Image:{" "}
                  <a
                    href="https://commons.wikimedia.org/wiki/File:SiRNA_Structure2.svg"
                    className="text-sky-700 hover:underline"
                  >
                    Wikimedia Commons, CC0
                  </a>
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="grid gap-3">
                <p className="text-base font-semibold text-zinc-900">
                  how to read this backbone figure
                </p>
                <p>
                  This Commons schematic shows the core siRNA architecture: two short,
                  complementary RNA strands paired into a duplex with the characteristic
                  two-nucleotide 3′ overhangs at the ends. That is the base scaffold
                  medicinal chemists start from before they layer in therapeutic edits.
                  {cite(2)}
                </p>
                <p>
                  Read it step by step: each horizontal line is one strand, the paired
                  middle section is the duplex body, and the short dangling ends are the
                  3′ overhangs that help the RNAi machinery recognize and process the
                  siRNA.
                  {cite(2)}
                </p>
                <p>
                  The backbone itself is still an RNA phosphodiester framework, but
                  therapeutic siRNAs commonly add 2′-fluoro, 2′-O-methyl, and selected
                  phosphorothioate linkages around that same geometry to improve serum
                  stability, reduce innate-immune activation, and tune protein binding.
                  {cite(2)}
                  {cite(3)}
                </p>
                <p>
                  Conjugation is then usually pushed to terminal positions, often on the
                  passenger-strand side, because the guide strand still has to be
                  recognized by Argonaute and retained inside RISC after intracellular
                  processing.
                  {cite(1)}
                  {cite(2)}
                </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                design pressure
              </p>
              <h2 className="site-page-heading font-semibold">
                what conjugation has to preserve
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              <p>
                Receptor targeting helps uptake, but endosomal escape remains the
                central bottleneck for most siRNA conjugate systems.
                {cite(1)}
                {cite(3)}
              </p>
              <p>
                The duplex has to remain stable enough for delivery while still allowing
                strand separation, passenger removal, and Ago2-compatible guide-strand
                function once it reaches the cytosol.
                {cite(1)}
                {cite(2)}
              </p>
              <p>
                Unlike ADC payloads, siRNA does not rely on bystander diffusion. The
                relevant question is whether enough active duplex reaches cytosolic RNAi
                machinery in the intended cells.
                {cite(1)}
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader>
              <h2 className="site-page-heading font-semibold">
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
              <h2 className="site-page-heading font-semibold">
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
