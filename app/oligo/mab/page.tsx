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

const targetingRoles = [
  {
    title: "Cell-type bias",
    text: "The targeting module is what decides which cells see the conjugate first. In oligo work, that matters because the drug only works after productive intracellular delivery, not because it poisons any cell it touches.",
  },
  {
    title: "Internalization route",
    text: "Different receptors internalize at very different rates and through different vesicle routes. That trafficking pattern can matter as much as raw binding affinity.",
  },
  {
    title: "Dose distribution",
    text: "A large antibody or Fab can shift plasma persistence and tissue partitioning, while compact ligands may favor faster tissue access but shorter systemic residence.",
  },
  {
    title: "Intracellular handoff",
    text: "The real question is whether receptor engagement leads to endosomal escape or productive routing to cytosol or nucleus, not only whether uptake happened at all.",
  },
];

const formatRows = [
  {
    title: "Full antibody",
    whyUsed: "best when teams want strong receptor specificity, long systemic exposure, and the broadest biologics-engineering toolbox",
    strength: "Highest targeting surface area and familiar developability framework",
    risk: "Large size can make stoichiometry, tissue penetration, endosomal escape, and manufacturing more complex",
  },
  {
    title: "Fab, scfv, vhh, or other smaller binders",
    whyUsed: "best when teams want less bulk, better tissue access, higher conjugation flexibility, or a format that interferes less with intracellular routing",
    strength: "Can reduce steric load while keeping receptor specificity",
    risk: "May shorten exposure or reduce avidity compared with full IgG formats",
  },
  {
    title: "Bispecific or multispecific binders",
    whyUsed: "used when one binding arm is not enough and the program needs co-engagement, cell-state discrimination, or a built-in trafficking assist from a second receptor handle",
    strength: "Can sharpen selectivity or reshape uptake biology in ways monospecific binders cannot",
    risk: "Higher molecular complexity can complicate manufacturability, stoichiometry, and interpretation of which binding event is driving activity",
  },
  {
    title: "Ligand-directed systems",
    whyUsed: "best when a natural receptor-ligand pair already gives an efficient uptake route, like GalNAc-ASGPR in liver delivery",
    strength: "Compact and scalable when the receptor biology is strong",
    risk: "Usually more tissue-restricted and highly dependent on receptor density and recycling behavior",
  },
  {
    title: "Peptide or uptake-enhancing modules",
    whyUsed: "used when boosting internalization or membrane interaction matters more than pristine receptor selectivity",
    strength: "Can improve internalization or membrane interaction",
    risk: "Can trade selectivity for uptake and may add tolerability pressure",
  },
  {
    title: "Enzyme or natural-protein shuttle systems",
    whyUsed: "more niche formats can be used when a natural protein pathway or catalytic protein scaffold gives a privileged tissue route or intracellular itinerary",
    strength: "Can exploit biology that standard antibody formats do not access cleanly",
    risk: "Less standardized than antibody platforms and often harder to generalize across targets",
  },
];

const rationaleRows = [
  {
    title: "Why full mAbs are still attractive",
    text: "full antibodies remain appealing when receptor specificity, serum half-life, and mature engineering options matter more than compactness. if the receptor biology is strong enough, a full IgG can act as a durable delivery handle rather than only a binding reagent.",
  },
  {
    title: "Why smaller formats get used",
    text: "smaller binders are used when the conjugate needs less steric bulk, deeper tissue access, easier site-specific loading, or a better chance that the oligo will not be physically crowded after uptake.",
  },
  {
    title: "Why bispecific or multispecific formats show up",
    text: "they can be used to separate target recognition from uptake biology, or to require two surface cues at once. that can tighten cell selectivity or force the conjugate into a more useful endocytic route.",
  },
  {
    title: "Why non-antibody protein modalities still matter",
    text: "ligands, peptides, and some natural-protein shuttles stay relevant because in some tissues the best uptake route is not an antibody-defined one. if biology already offers a privileged receptor pathway, a simpler or more native binder may win.",
  },
];

const designChecks = [
  {
    title: "Receptor density",
    text: "There has to be enough target on the right cells to make receptor-mediated uptake meaningful at realistic doses.",
  },
  {
    title: "Productive trafficking",
    text: "Internalization is not enough if the receptor mainly recycles or traps the conjugate in a dead-end compartment.",
  },
  {
    title: "Expression outside target tissue",
    text: "Off-target receptor expression can redirect expensive oligo dose into organs where it adds toxicity but little benefit.",
  },
  {
    title: "Steric compatibility",
    text: "The targeting module must still allow the oligo to hybridize, engage RISC, or access splice machinery after delivery.",
  },
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
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of PMO Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00803",
  },
  {
    id: 3,
    label:
      "Chemistry, Structure, and Function of Approved Oligonucleotide Therapeutics (Nucleic Acids Research, 2023)",
    href: "https://academic.oup.com/nar/article/51/6/2529/7047002",
  },
  {
    id: 4,
    label:
      "GalNAc-siRNA Conjugates: Leading the Way for Delivery of RNAi Therapeutics (Molecular Therapy, 2018)",
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

export default function OligoMabPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart LR
    A["1. bind receptor"] --> B["2. internalize productively"]
    B --> C["3. avoid dead-end routing"]
    C --> D["4. hand off active oligo"]

    classDef sky fill:#e0f2fe,stroke:#38bdf8,color:#0f172a;
    classDef indigo fill:#e0e7ff,stroke:#818cf8,color:#0f172a;
    classDef amber fill:#fef3c7,stroke:#f59e0b,color:#92400e;
    classDef emerald fill:#dcfce7,stroke:#4ade80,color:#166534;

    class A sky;
    class B indigo;
    class C amber;
    class D emerald;`;

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
        const { svg } = await mermaid.render(`oligo-targeting-${Date.now()}`, mermaidDiagram);
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
      <BackgroundMotif variant="mab" />

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
            mAb / targeting module
          </Chip>
          <h1 className="site-page-title font-semibold">
            targeting modules decide where the oligo goes
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            In oligonucleotide conjugates, the antibody or other targeting module
            is there to steer uptake and routing. The job is not to deliver a toxic
            warhead. The job is to help the oligo reach the cells and intracellular
            compartment where RNA modulation can actually happen.{cite(1)}{cite(2)}{cite(3)}
          </p>
          <OligoSectionTabs active="mab" />
        </motion.section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {targetingRoles.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">{item.text}{cite(3)}</p>
              </CardBody>
            </Card>
          ))}
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              sourced figure
            </p>
            <h2 className="site-page-heading font-semibold">
              targeting proteins come in more than one useful format
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="Open-source schematic of antibody targeting modalities">
              <div className="zoom-graphic rounded-[1rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)] p-4">
                <div className="overflow-hidden rounded-[0.95rem] border border-sky-100 bg-white/90 p-3">
                  <Image
                    src="https://commons.wikimedia.org/wiki/Special:FilePath/Engineered%20monoclonal%20antibodies.svg"
                    alt="Open-source figure showing full antibody, minibody, Fab, Fc, scFv, and nanobody targeting formats"
                    width={1200}
                    height={520}
                    unoptimized
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </ZoomableFigure>
            <p className="leading-7">
              this figure helps ground the format conversation in something real.
              oligo conjugates do not have to use full IgG only. depending on the
              program, the targeting module can be a full antibody, a Fab-like
              fragment, an scFv-style compact binder, or a smaller single-domain
              format.
            </p>
            <p className="leading-7">
              smaller binders can improve tissue access and simplify stoichiometry,
              while larger antibody-style formats can offer longer circulation and
              stronger receptor engagement. that tradeoff matters early, because the
              targeting protein influences uptake and intracellular routing before
              the oligo chemistry gets to do its job.{cite(1)}{cite(2)}{cite(3)}
            </p>
            <p className="text-xs leading-6 text-zinc-500">
              source:{" "}
              <Link
                href="https://commons.wikimedia.org/wiki/File:Engineered_monoclonal_antibodies.svg"
                className="text-sky-700"
              >
                Wikimedia Commons, Engineered monoclonal antibodies.svg
              </Link>
              {" "}— public domain
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              targeting workflow
            </p>
            <h2 className="site-page-heading font-semibold">
              what a good oligo targeting module has to achieve
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="Oligonucleotide targeting-module workflow">
              <div className="zoom-graphic rounded-[1rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)] p-4">
                <div
                  className="mermaid-flow [&_svg]:h-auto [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
            <div className="rounded-[1rem] border border-white/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-semibold text-zinc-900">why this is different from adc antibody logic</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                for an adc, internalization can already be enough if lysosomal payload release follows. for an oligo conjugate, uptake is only the first gate. the targeting module is successful only if it helps the oligo reach productive intracellular RNA biology.{cite(1)}{cite(2)}
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                format choices
              </p>
              <h2 className="site-page-heading font-semibold">
                the main targeting modality families
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              {formatRows.map((row) => (
                <div key={row.title} className="rounded-xl border border-white/70 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-zinc-900">{row.title}</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    <span className="font-semibold text-zinc-700">why teams use it:</span> {row.whyUsed}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    <span className="font-semibold text-zinc-700">strength:</span> {row.strength}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-zinc-600">
                    <span className="font-semibold text-zinc-700">tradeoff:</span> {row.risk}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                selection checklist
              </p>
              <h2 className="site-page-heading font-semibold">
                what we should ask before picking a target
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              {designChecks.map((row) => (
                <div key={row.title} className="rounded-xl border border-white/70 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-zinc-900">{row.title}</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">{row.text}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {rationaleRows.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                  {item.text}
                  {cite(1)}
                  {cite(2)}
                  {cite(4)}
                </p>
              </CardBody>
            </Card>
          ))}
        </section>

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
