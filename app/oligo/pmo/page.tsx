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
} from "@heroui/react";
import { motion } from "framer-motion";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { MoleculeCard } from "@/components/MoleculeCard";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const advantages = [
  "very strong nuclease resistance because the morpholino backbone is not a normal ribose-phosphate chain",
  "excellent fit for splice-switching and other steric-block mechanisms that do not require enzymatic cleavage of the RNA target",
  "chemically stable platform for exon skipping and related nuclear RNA-modulation strategies",
];

const disadvantages = [
  "charge-neutral chemistry does not automatically solve delivery, and spontaneous uptake is often weak",
  "PMOs do not recruit RNase H, so they are not the right tool when transcript degradation is the goal",
  "conjugation often has to do a lot of the heavy lifting for tissue access and intracellular trafficking",
];

const references = [
  {
    id: 1,
    label:
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of PMO Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00803",
  },
  {
    id: 2,
    label:
      "Chemistry, Structure, and Function of Approved Oligonucleotide Therapeutics (Nucleic Acids Research, 2023)",
    href: "https://academic.oup.com/nar/article/51/6/2529/7047002",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function PmoPage() {
  const [spliceMermaidSvg, setSpliceMermaidSvg] = useState("");
  const spliceDiagram = `flowchart TD
    A["1. pre-mRNA contains a problematic splice choice"]
    B["2. PMO binds the selected RNA sequence and sterically blocks splice use"]
    C["3. splicing shifts toward the intended transcript output"]
    D["design takeaway<br/>PMOs redirect processing by steric block, not by RNase H cleavage"]

    A --> B --> C --> D

    classDef sky fill:#e0f2fe,stroke:#38bdf8,color:#0f172a;
    classDef emerald fill:#dcfce7,stroke:#4ade80,color:#166534;
    classDef amber fill:#fef3c7,stroke:#f59e0b,color:#92400e;
    classDef slate fill:#ffffff,stroke:#cbd5e1,color:#334155;

    class A sky;
    class B emerald;
    class C amber;
    class D slate;`;
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const renderDiagram = async (
      key: string,
      text: string,
      setter: (svg: string) => void,
    ) => {
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
          nodeSpacing: 42,
          rankSpacing: 68,
          padding: 28,
          curve: "basis",
          htmlLabels: true,
        },
      });

      try {
        const { svg } = await mermaid.render(`${key}-${Date.now()}`, text);
        if (!cancelled) setter(svg);
        return true;
      } catch {
        return false;
      }
    };

    if (!spliceMermaidSvg) {
      renderDiagram("pmo-splice", spliceDiagram, setSpliceMermaidSvg);
    }

    const t1 = setTimeout(() => {
      if (!spliceMermaidSvg) renderDiagram("pmo-splice", spliceDiagram, setSpliceMermaidSvg);
    }, 300);

    const t2 = setTimeout(() => {
      if (!spliceMermaidSvg) renderDiagram("pmo-splice", spliceDiagram, setSpliceMermaidSvg);
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [spliceDiagram, spliceMermaidSvg]);

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
            PMO
          </Chip>
          <h1 className="site-page-title font-semibold">
            PMO conjugates for steric splice switching
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            PMO conjugates are built around charge-neutral morpholino oligomers
            that act mainly by steric block. They are especially important when
            the therapeutic goal is splice redirection or translation blocking
            without RNase H recruitment.
            {cite(1)}
            {cite(2)}
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              PMO schematic
            </p>
            <h2 className="site-page-heading font-semibold">
              splice-switching logic at a glance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <div className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
              <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3">
                <MoleculeCard label="PMO chain" variant="oligo" />
              </div>
              <div className="rounded-[1.25rem] border border-white/70 bg-white/70 p-3">
                <ZoomableFigure label="PMO splice-switching schematic">
                  <div className="zoom-graphic rounded-[1.15rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-5">
                    <div
                      className="mermaid-flow min-h-[30rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                      dangerouslySetInnerHTML={{ __html: spliceMermaidSvg || "" }}
                    />
                  </div>
                </ZoomableFigure>
              </div>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/70 p-4">
              <p className="text-sm font-semibold text-zinc-900">what this means biologically</p>
              <p className="mt-2 text-xs leading-6 text-zinc-600">
                PMOs are charge-neutral morpholino oligos that act through steric block.
                They do not recruit RNase H. Instead, they sit on a chosen RNA sequence,
                often near an intron-exon junction or splice regulatory element, and stop
                the splicing machinery from using that site normally. That can force exon
                skipping or splice correction, depending on the program. In conjugation
                work, the hardest part is usually getting enough PMO into the right tissue
                and then into the relevant intracellular compartment, not protecting it
                from nuclease degradation.{cite(1)}{cite(2)}
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                backbone and chemistry
              </p>
              <h2 className="site-page-heading font-semibold">
                what makes PMO chemically distinct
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              <p>
                PMOs replace the usual ribose-phosphate backbone with morpholine rings
                linked through phosphorodiamidate groups, producing a charge-neutral
                scaffold with very strong nuclease resistance.
                {cite(2)}
              </p>
              <p>
                Because the backbone is not a standard negatively charged nucleic-acid
                chain, PMO behavior in protein binding, uptake, and formulation differs
                noticeably from phosphorothioate ASOs and modified siRNA duplexes.
                {cite(2)}
              </p>
              <p>
                PMOs are especially well suited to splice-switching and steric-block
                uses where the oligo needs to bind RNA tightly and persist, but does not
                need to recruit RNase H.
                {cite(2)}
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                conjugation relevance
              </p>
              <h2 className="site-page-heading font-semibold">
                why PMOs often need delivery help
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              <p>
                The backbone is durable, but many PMO programs still need conjugation
                to improve tissue exposure, internalization, and delivery into the right
                intracellular compartment.
                {cite(1)}
              </p>
              <p>
                Antibody or ligand targeting can help bias uptake into selected tissues,
                but productive nuclear access can still be a major barrier for splice-switching
                designs.
                {cite(1)}
                {cite(2)}
              </p>
              <p>
                In other words, PMO conjugation is usually solving a delivery deficit
                rather than amplifying intrinsic chemical instability.
                {cite(1)}
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                delivery reality
              </p>
              <h2 className="site-page-heading font-semibold">
                what conjugation still has to solve
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-3 text-sm text-zinc-600">
              <p>
                PMOs are already chemically durable, so conjugation is usually not about
                preventing nuclease breakdown. it is more often about improving tissue
                exposure, cell entry, and the odds of reaching the right intracellular
                compartment.{cite(1)}{cite(2)}
              </p>
              <p>
                For splice-switching programs, productive delivery often means getting
                enough morpholino all the way to nuclear pre-mRNA, not merely into the
                cell surface or endosomal system.{cite(1)}
              </p>
            </CardBody>
          </Card>

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
