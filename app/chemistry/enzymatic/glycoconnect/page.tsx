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
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { EnzymaticSectionTabs } from "@/components/EnzymaticSectionTabs";
import { StructureCard } from "@/components/StructureCard";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const references = [
  {
    id: 1,
    label:
      "Enzymatic glycan remodeling-metal free click (GlycoConnect) provides homogenous antibody-drug conjugates with improved stability and therapeutic index without sequence engineering (mAbs, 2022)",
    href: "https://www.tandfonline.com/doi/full/10.1080/19420862.2022.2078466",
  },
  {
    id: 2,
    label:
      "Chemoenzymatic conjugation of toxic payloads to the globally conserved N-glycan of native mAbs provides homogeneous and highly efficacious antibody-drug conjugates (Bioconjugate Chemistry, 2015)",
    href: "https://pubs.acs.org/doi/abs/10.1021/acs.bioconjchem.5b00224",
  },
  {
    id: 3,
    label:
      "Glycan remodeling for site-specific Fc conjugation (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article-abstract/7/3/233/7710329",
  },
  {
    id: 4,
    label:
      "Glycoconjugation using mutant GalT and bioorthogonal click chemistry (Bioconjugate Chemistry, 2015)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4606561/",
  },
  {
    id: 5,
    label:
      "Linker in antibody-drug conjugates: a review of linker chemistry (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article/7/3/tbae020/7717690",
  },
];

const workflowRows = [
  {
    step: "trim native Fc glycans to a controlled core",
    why: "the platform starts by simplifying the Fc glycan so each heavy chain presents a reproducible scaffold for rebuilding",
    risk: "messy starting glycoforms or incomplete trimming immediately widen the downstream product distribution",
  },
  {
    step: "install an azide-bearing sugar handle",
    why: "platform examples emphasize azide-bearing GalNAc-style handles so each glycan becomes a click-ready anchor",
    risk: "poor transfer efficiency leaves partially remodeled antibody and weakens the homogeneity advantage",
  },
  {
    step: "use metal-free click for the payload side",
    why: "the remodeled antibody is then reacted with a strained-alkyne linker-drug, avoiding copper and keeping the platform practical for biotherapeutics",
    risk: "if the click partner is too hydrophobic or too bulky, aggregation pressure can erase the gain from site control",
  },
  {
    step: "choose linear versus branched payload geometry",
    why: "reported GlycoConnect examples tune DAR2 versus DAR4 by using linear or branched click partners on the glycan handles",
    risk: "more payload per antibody can still hurt stability if spacer design does not keep hydrophobicity in check",
  },
  {
    step: "pair with a polar spacer when needed",
    why: "HydraSpace-style linker logic is used to offset hydrophobic stress and keep the platform manufacturable with tougher payloads",
    risk: "good glycan chemistry alone does not rescue a linker-payload design that wants to aggregate or shed payload too early",
  },
];

const compareRows = [
  {
    question: "what it adds beyond generic glycan remodeling",
    glycoconnect:
      "a validated platform stack: Fc glycan trim, azide-bearing sugar install, then metal-free click assembly",
    generic:
      "the broader umbrella of glycan editing strategies, which may stop at handle installation or use many different elaboration routes",
  },
  {
    question: "how the click stage is framed",
    glycoconnect:
      "payload assembly is a central platform step, typically with strained-alkyne linker-drug partners",
    generic:
      "click or ligation may happen, but the workflow is not necessarily standardized around one platform architecture",
  },
  {
    question: "why the platform is attractive",
    glycoconnect:
      "homogeneous Fc-site conjugation without sequence engineering, plus a manufacturable path toward defined DAR",
    generic:
      "excellent site control, but platform behavior depends more on the exact lab workflow used",
  },
  {
    question: "where HydraSpace fits",
    glycoconnect:
      "a polar spacer strategy paired with the glycan-click platform to improve stability and reduce aggregation pressure",
    generic:
      "not an intrinsic part of glycan remodeling itself; spacer choice depends on the broader conjugate design",
  },
  {
    question: "main caution",
    glycoconnect:
      "it is still process-heavy: glycoanalytics, click efficiency, and linker-payload behavior all have to stay in sync",
    generic:
      "site control alone does not guarantee a stable or clinically useful conjugate",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function GlycoconnectPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart TD
    A["native IgG Fc glycan<br/>conserved N297 glycan gives the anchor zone"]
    B["trim to a cleaner core glycan<br/>platform starts by simplifying the Fc sugar scaffold"]
    C["install azide-bearing sugar<br/>reported platform examples emphasize 6-azidoGalNAc-style handles"]
    D["metal-free click assembly<br/>strained-alkyne linker-drug reacts with the glycan azide"]
    E["HydraSpace / polar spacer option<br/>extra spacer logic helps control hydrophobic stress"]
    F["homogeneous glycan-linked conjugate<br/>site control without rewriting the antibody sequence"]

    A --> B --> C --> D --> E --> F

    classDef sky fill:#e0f2fe,stroke:#38bdf8,color:#0f172a;
    classDef indigo fill:#e0e7ff,stroke:#818cf8,color:#0f172a;
    classDef emerald fill:#dcfce7,stroke:#4ade80,color:#166534;
    classDef amber fill:#fef3c7,stroke:#f59e0b,color:#92400e;
    classDef slate fill:#ffffff,stroke:#cbd5e1,color:#334155;

    class A sky;
    class B indigo;
    class C emerald;
    class D amber;
    class E indigo;
    class F slate;`;

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
          fontSize: "21px",
          fontFamily: "var(--font-manrope), sans-serif",
          primaryTextColor: "#0f172a",
          lineColor: "#0f172a",
        },
        flowchart: {
          nodeSpacing: 36,
          rankSpacing: 62,
          padding: 26,
          curve: "basis",
          htmlLabels: true,
        },
      });

      try {
        const { svg } = await mermaid.render(
          `glycoconnect-flow-${Date.now()}`,
          mermaidDiagram
        );
        if (!cancelled) setMermaidSvg(svg);
        return true;
      } catch {
        return false;
      }
    };

    if (mermaidSvg) return;
    void tryRender();
    const t1 = setTimeout(() => void tryRender(), 300);
    const t2 = setTimeout(() => void tryRender(), 1000);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mermaidDiagram, mermaidSvg]);

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
          <Link href="/chemistry/enzymatic" className="text-sm text-sky-700">
            enzymatic overview
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            glycoconnect
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            glycoconnect platform logic
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            glycoconnect is not just “glycan remodeling” in the abstract. it is a
            platformized Fc-glycan workflow: simplify the Fc glycan, install an
            azide-bearing sugar handle, then use metal-free click chemistry to attach
            the downstream linker-payload module without rewriting the antibody
            sequence.{cite(1)}{cite(2)}{cite(3)}{cite(4)}
          </p>
          <EnzymaticSectionTabs active="glycoconnect" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              overview
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what this platform is really buying you
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm leading-7 text-zinc-600 md:grid-cols-3">
            <p>
              <span className="font-semibold text-zinc-900">what it is:</span>{" "}
              glycoconnect uses the conserved Fc glycan as the installation site and
              turns that glycan edit into a repeatable click-ready conjugation
              workflow.{cite(1)}{cite(2)}{cite(3)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">why teams use it:</span>{" "}
              it gives homogeneous Fc-centered attachment without antibody sequence
              engineering, which is attractive when product definition and scale-up
              behavior matter a lot.{cite(1)}{cite(2)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">main tradeoff:</span> the
              platform only works well if glycan processing, click efficiency, and the
              downstream linker-payload design all stay aligned.{cite(1)}{cite(3)}
              {cite(5)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              mechanism
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how the platform actually runs
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="GlycoConnect workflow">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/80 p-5">
                <div
                  className="mermaid-flow min-h-[32rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">where the control comes from</p>
                <p className="mt-2">
                  the anchor is still the Fc glycan near N297, so the positional
                  control comes from glycan biology rather than a peptide-side mutation
                  or a broad lysine distribution.{cite(2)}{cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what makes it “platform”</p>
                <p className="mt-2">
                  the key difference is that handle installation and click assembly are
                  treated as one connected manufacturing logic, not just a single
                  chemistry trick.{cite(1)}{cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">where HydraSpace fits</p>
                <p className="mt-2">
                  HydraSpace-style polar spacing is not the glycan edit itself. it is
                  the downstream linker logic used to keep hydrophobic payloads more
                  manageable once the glycan anchor has been installed.{cite(1)}{cite(5)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              placement map
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              where each piece of the platform sits
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
                antibody side
              </p>
              <div className="mt-4 rounded-[1.25rem] border border-sky-200 bg-white/80 p-4">
                <p className="text-lg font-semibold text-zinc-900">Fc glycan / N297 zone</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  the platform starts on the conserved Fc glycan, not on random lysines
                  and not on an engineered peptide tag.{cite(2)}{cite(3)}
                </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">
                installed handle
              </p>
              <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-white/80 p-4">
                <p className="text-lg font-semibold text-zinc-900">azide-bearing sugar</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  platform examples highlight 6-azidoGalNAc-style installation so each
                  remodeled Fc glycan becomes a click-ready azide anchor.{cite(1)}{cite(4)}
                </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-600">
                payload side
              </p>
              <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-white/80 p-4">
                <p className="text-lg font-semibold text-zinc-900">
                  strained-alkyne linker-drug
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  the payload module usually comes in as a metal-free click partner,
                  and spacer design then decides whether the final conjugate stays
                  stable and manufacturable.{cite(1)}{cite(5)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative platform parts
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              the sugar, click, and spacer pieces
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="GalNAc scaffold"
              subtitle="sugar logic behind the remodeled Fc handle"
              smilesName="N-acetyl-D-galactosamine"
              pubchemQuery="N-acetyl-D-galactosamine"
              note="the platform does not attach this plain sugar as-is; it installs an azide-bearing GalNAc-style derivative on the Fc glycan."
              category="linker"
            />
            <StructureCard
              title="azide-bearing glycan handle"
              subtitle="click-ready azide logic"
              formulaDisplay={
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-lg font-semibold text-emerald-700">
                    GalNAc-N3
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600">
                    installed on the Fc glycan before click assembly
                  </div>
                </div>
              }
              note="reported GlycoConnect examples emphasize azide-bearing GalNAc handles because they click cleanly with strained alkynes under biocompatible conditions."
              category="linker"
            />
            <StructureCard
              title="polar spacer logic"
              subtitle="HydraSpace-style hydrophilicity control"
              smiles="OCCOCCOCCO"
              note="this is a representative polar spacer motif rather than the proprietary full linker. the point is the spacer logic: offset hydrophobic payload stress after the glycan-click step."
              category="linker"
            />
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              workflow reality
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              where the platform wins and where it can still fail
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="GlycoConnect workflow table"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>step</TableColumn>
                <TableColumn>why it matters</TableColumn>
                <TableColumn>what can go wrong</TableColumn>
              </TableHeader>
              <TableBody>
                {workflowRows.map((row) => (
                  <TableRow key={row.step}>
                    <TableCell className="font-semibold text-zinc-900">{row.step}</TableCell>
                    <TableCell>{row.why}</TableCell>
                    <TableCell>{row.risk}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              comparison
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how this differs from generic glycan remodeling
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="GlycoConnect vs generic glycan remodeling"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>question</TableColumn>
                <TableColumn>glycoconnect</TableColumn>
                <TableColumn>generic glycan remodeling</TableColumn>
              </TableHeader>
              <TableBody>
                {compareRows.map((row) => (
                  <TableRow key={row.question}>
                    <TableCell className="font-semibold text-zinc-900">{row.question}</TableCell>
                    <TableCell>{row.glycoconnect}</TableCell>
                    <TableCell>{row.generic}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              references
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              sources
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-3 text-sm leading-7 text-zinc-600">
            {references.map((reference) => (
              <p key={reference.id} id={`ref-${reference.id}`}>
                <span className="font-semibold text-zinc-900">[{reference.id}]</span>{" "}
                <Link href={reference.href} isExternal className="text-sky-700">
                  {reference.label}
                </Link>
              </p>
            ))}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
