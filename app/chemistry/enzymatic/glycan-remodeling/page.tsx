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
      "Glycan remodeling for site-specific Fc conjugation (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article-abstract/7/3/233/7710329",
  },
  {
    id: 2,
    label:
      "Glycoconjugation using mutant GalT and bioorthogonal click chemistry (PMC, 2015)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4606561/",
  },
  {
    id: 3,
    label:
      "The N-glycan of human IgG-Fc: structures, dynamics, and function (Biochemistry, 2014)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4010461/",
  },
  {
    id: 4,
    label:
      "Site-specific antibody-drug conjugation through an engineered glycotransferase and a chemically reactive sugar (MAbs, 2014)",
    href: "https://pubmed.ncbi.nlm.nih.gov/25517304/",
  },
];

const workflowRows = [
  {
    step: "confirm Fc glycan state first",
    why: "the starting glycoform distribution determines how cleanly trimming and rebuilding can proceed",
    risk: "messy glycan heterogeneity upstream makes a site-controlled workflow look worse than it should",
  },
  {
    step: "trim or simplify the glycan",
    why: "many workflows first expose a more uniform scaffold before adding the engineered sugar handle",
    risk: "incomplete trimming leaves mixed substrates and mixed downstream products",
  },
  {
    step: "install a clickable sugar or handle",
    why: "mutant transferases such as GalT(Y289L) can install azide-bearing sugars for later click chemistry",
    risk: "poor transfer efficiency or poor glycoanalytics can hide how much handle really got installed",
  },
  {
    step: "click or elaborate the remodeled glycan",
    why: "the glycan edit is often only the handle-install step; the final conjugation is then done by SPAAC or related chemistry",
    risk: "a clean glycan edit can still fail if the downstream click step is inefficient or over-perturbs Fc behavior",
  },
];

const compareRows = [
  {
    question: "where the site control comes from",
    glycanRemodeling: "the conserved Fc glycan, usually around N297 on IgG Fc",
    backboneRoutes: "a residue or engineered tag on the polypeptide chain itself",
  },
  {
    question: "what gets modified directly",
    glycanRemodeling: "the sugar scaffold is trimmed, rebuilt, and then functionalized",
    backboneRoutes: "amino-acid side chains or peptide tags",
  },
  {
    question: "main upside",
    glycanRemodeling: "site control without rewriting the main antibody sequence",
    backboneRoutes: "simpler conceptual mapping between residue and installed product",
  },
  {
    question: "main cost",
    glycanRemodeling: "strong dependence on glycoanalytics and processing discipline",
    backboneRoutes: "less reliance on glycobiology, but often more direct backbone intervention",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function GlycanRemodelingPage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart TD
    A["Fc glycan starting state<br/>native antibody carries the conserved N-glycan"]
    B["trim or simplify glycoform<br/>prepare a more uniform sugar scaffold"]
    C["install engineered sugar handle<br/>for example GalT(Y289L) adds an azide-bearing sugar"]
    D["click or elaborate the handle<br/>downstream SPAAC / ligation step adds the final module"]
    E["practical takeaway<br/>control comes from the glycan, but the workflow lives or dies on glycoanalytics"]

    A --> B --> C --> D --> E

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
        const { svg } = await mermaid.render(`glycan-flow-${Date.now()}`, mermaidDiagram);
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
            glycan remodeling
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            Fc glycan remodeling
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            glycan remodeling uses the conserved Fc glycan as the installation zone.
            instead of reacting directly with amino-acid side chains, teams trim and
            rebuild the sugar scaffold so a defined click-ready handle can be placed on
            the Fc glycan itself.{cite(1)}{cite(2)}{cite(3)}{cite(4)}
          </p>
          <EnzymaticSectionTabs active="glycan-remodeling" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              overview
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what this method is really buying you
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm leading-7 text-zinc-600 md:grid-cols-3">
            <p>
              <span className="font-semibold text-zinc-900">what it is:</span> rather
              than modifying amino-acid side chains directly, this route edits the
              conserved Fc glycan and installs a click-ready or otherwise reactive
              handle on that sugar scaffold.{cite(1)}{cite(2)}{cite(3)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">why teams use it:</span>{" "}
              the approach keeps the main antibody sequence intact while still creating
              a controlled, Fc-centered attachment site.{cite(1)}{cite(3)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">main tradeoff:</span> it
              depends heavily on glycan processing quality, glycoanalytics, and tight
              control of the remodeling workflow.{cite(1)}{cite(2)}{cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              mechanism
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how the glycan-first workflow actually runs
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Fc glycan remodeling workflow">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/80 p-5">
                <div
                  className="mermaid-flow min-h-[32rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">anchor point</p>
                <p className="mt-2">
                  for IgG-based workflows, the usual anchor is the conserved Fc glycan
                  around `N297`. that is why glycan remodeling stays so tied to Fc
                  biology and Fc analytics.{cite(1)}{cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">handle logic</p>
                <p className="mt-2">
                  a remodeled glycan often becomes the place where an azide-bearing
                  sugar or similar clickable functionality is installed before the final
                  ligation step.{cite(2)}{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what can go wrong</p>
                <p className="mt-2">
                  even if the chemistry is elegant, the workflow still rises or falls
                  on glycoform uniformity and whether the remodeled Fc behaves cleanly
                  in downstream analytics and biology.{cite(1)}{cite(3)}
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
              where the control is actually coming from
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Fc glycan placement logic">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/80 p-6">
                <div className="zoom-graphic grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
                  <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                      antibody side
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-sky-400 bg-white text-lg font-semibold text-sky-700">
                        Fc
                      </div>
                      <div className="h-1.5 flex-1 rounded-full bg-sky-300" />
                      <div className="rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700">
                        N297 glycan
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                      the main protein sequence can stay unchanged while control shifts
                      onto the conserved Fc glycan scaffold.{cite(1)}{cite(3)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                      glycosidase / glycosyltransferase
                    </span>
                    <span className="text-4xl text-zinc-400">⇄</span>
                  </div>

                  <div className="rounded-[1.5rem] border border-violet-200 bg-violet-50/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">
                      remodeled glycan outcome
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="rounded-full border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700">
                        sugar scaffold
                      </div>
                      <div className="h-1.5 flex-1 rounded-full bg-violet-300" />
                      <div className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700">
                        azide / click handle
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                      the remodeled glycan becomes the real installation point, and the
                      click handle can then be used for the final conjugation step.
                      {cite(1)}{cite(2)}{cite(4)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-7 text-zinc-600">
                  <span className="font-semibold text-zinc-900">practical read:</span>{" "}
                  glycan remodeling is attractive when teams want site definition
                  without mutating the backbone, but it only stays attractive if the
                  glycan state remains measurable and controlled through manufacturing.
                  {cite(1)}{cite(4)}
                </div>
              </div>
            </ZoomableFigure>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative motifs
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              chemistry motifs that show up around this workflow
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="N-acetylglucosamine"
              subtitle="core glycan building block"
              smiles="CC(=O)NC1C(O)OC(CO)C(O)C1O"
              pubchemQuery="N-Acetyl-D-glucosamine"
              note="glycan remodeling workflows are built on a real Fc sugar scaffold, not directly on the peptide backbone."
              category="linker"
              className="h-full"
            />
            <StructureCard
              title="azide-bearing sugar handle"
              subtitle="click-ready glycan install logic"
              smiles="N=[N+]=[N-]"
              note="mutant glycosyltransferase workflows often aim to introduce an azide-bearing sugar for downstream click chemistry."
              category="linker"
              className="h-full"
            />
            <StructureCard
              title="dibenzocyclooctyne handle"
              subtitle="common SPAAC partner"
              smiles="C1=CC=C2C(=C1)C#CC3=CC=CC=C23"
              pubchemQuery="dibenzocyclooctyne"
              note="once the glycan carries an azide-style handle, a cyclooctyne partner can be used in a copper-free click step."
              category="linker"
              className="h-full"
            />
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              workflow
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what teams usually have to tune
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="Glycan remodeling workflow tuning points"
              className="rounded-xl border border-white/70 bg-white/60"
            >
              <TableHeader>
                <TableColumn>Step</TableColumn>
                <TableColumn>Why it matters</TableColumn>
                <TableColumn>Typical failure mode</TableColumn>
              </TableHeader>
              <TableBody>
                {workflowRows.map((row) => (
                  <TableRow key={row.step}>
                    <TableCell>{row.step}</TableCell>
                    <TableCell>{row.why}</TableCell>
                    <TableCell>{row.risk}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-zinc-500">
              glycan remodeling is less about one magic enzyme and more about a full
              glyco-workflow: starting glycoforms, trimming, rebuilding, handle install,
              and downstream conjugation all have to behave together.{cite(1)}{cite(2)}
              {cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              comparison
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how it sits against backbone-directed routes
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="Glycan remodeling versus backbone routes"
              className="rounded-xl border border-white/70 bg-white/60"
            >
              <TableHeader>
                <TableColumn>Question</TableColumn>
                <TableColumn>glycan remodeling</TableColumn>
                <TableColumn>backbone-directed routes</TableColumn>
              </TableHeader>
              <TableBody>
                {compareRows.map((row) => (
                  <TableRow key={row.question}>
                    <TableCell>{row.question}</TableCell>
                    <TableCell>{row.glycanRemodeling}</TableCell>
                    <TableCell>{row.backboneRoutes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="font-semibold text-zinc-900">when it shines</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  when teams want Fc-centered site control while keeping the main
                  antibody sequence closer to native.{cite(1)}{cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
                <p className="font-semibold text-zinc-900">what it asks for</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  this route demands stronger glycobiology awareness and stronger
                  glycoanalytics than many backbone-first chemistries.{cite(1)}
                  {cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="font-semibold text-zinc-900">what to watch closely</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  if the glycan state drifts, the whole site-controlled story can blur,
                  even if the click chemistry itself looks clean on paper.{cite(1)}
                  {cite(2)}
                </p>
              </div>
            </div>
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
