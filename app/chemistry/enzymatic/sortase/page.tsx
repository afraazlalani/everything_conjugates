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
      "Improved Sortase A variants for site-specific antibody conjugation (Scientific Reports, 2016)",
    href: "https://www.nature.com/articles/srep31899",
  },
  {
    id: 2,
    label:
      "Site-selective modification strategies in antibody-drug conjugates (Chem. Soc. Rev., 2021)",
    href: "https://pubs.rsc.org/en/content/articlehtml/2021/cs/d0cs00310g",
  },
  {
    id: 3,
    label:
      "Recent advances in sortase-catalyzed ligation methodology (Biopolymers, 2016)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4818543/",
  },
  {
    id: 4,
    label:
      "The challenges in the use of sortase-mediated ligation for site-specific protein modification (Biomolecules, 2022)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9278504/",
  },
  {
    id: 5,
    label:
      "Calcium promotes sorting signal binding to sortase A by altering substrate dynamics (PNAS, 2006)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1395341/",
  },
  {
    id: 6,
    label:
      "Structure of the Staphylococcus aureus sortase-substrate complex and LPXTG recognition (JBC, 2009)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2782039/",
  },
];

const workflowRows = [
  {
    step: "Place the LPXTG tag where biology tolerates it",
    why: "classic sortase A from S. aureus usually works best when the tagged protein presents LPXTG at the C-terminus",
    risk: "A bad tag position can weaken expression, folding, or binding before ligation even starts",
  },
  {
    step: "Bring an N-terminal oligoglycine partner",
    why: "the incoming nucleophile is typically a GGG- or glycine-bearing peptide, linker, fluorophore, or payload handle",
    risk: "If the glycine partner is blocked or sterically crowded, turnover drops fast",
  },
  {
    step: "Manage the thioacyl intermediate and hydrolysis risk",
    why: "sortase cleaves after threonine and forms a transient acyl-enzyme intermediate that must be captured by the glycine partner",
    risk: "Water can compete, giving hydrolysis or lower ligation yield",
  },
  {
    step: "Choose wild-type versus engineered sortase thoughtfully",
    why: "engineered variants can improve rate and practical conversion for antibody work",
    risk: "Faster variants still do not erase the need for a tolerated tag and a clean glycine acceptor design",
  },
];

const compareRows = [
  {
    question: "What defines the site",
    sortase: "an engineered LPXTG motif on the protein plus an incoming oligoglycine nucleophile",
    transglutaminase: "an accessible glutamine context plus an accepted primary-amine partner",
  },
  {
    question: "What bond is formed",
    sortase: "a native peptide-like ligation after cleavage between T and G",
    transglutaminase: "an isopeptide / amide-style linkage onto the glutamine side chain",
  },
  {
    question: "Main strength",
    sortase: "very explicit ligation logic and modular swapping of incoming partners",
    transglutaminase: "good positional control without requiring a full LPXTG tag architecture",
  },
  {
    question: "Main cost",
    sortase: "construct engineering and tag tolerance are unavoidable",
    transglutaminase: "site accessibility and amine-partner compatibility still need tuning",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function SortasePage() {
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart TD
    A["LPXTG-tagged antibody or protein<br/>sortase reads the engineered sorting motif"]
    B["cleavage after threonine<br/>sortase forms a transient thioacyl intermediate"]
    C["N-terminal oligoglycine attacks<br/>GGG partner resolves the intermediate"]
    D["site-specific ligated product<br/>tagged protein is now joined to the glycine-bearing handle"]
    E["practical takeaway<br/>excellent positional control, but only if the construct tolerates the tag"]

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
        const { svg } = await mermaid.render(`sortase-flow-${Date.now()}`, mermaidDiagram);
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
            sortase a
          </Chip>
          <h1 className="site-page-title font-semibold">
            sortase a ligation
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            sortase a is a tag-directed transpeptidase. in the canonical
            `Staphylococcus aureus` setup, a protein carries an `LPXTG` sorting motif
            and the incoming partner starts with oligoglycine, so the enzyme cuts after
            threonine and hands the tagged protein onto the glycine-bearing handle with
            very explicit positional control.{cite(1)}{cite(2)}{cite(3)}{cite(4)}
            {cite(6)}
          </p>
          <EnzymaticSectionTabs active="sortase" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              overview
            </p>
            <h2 className="site-page-heading font-semibold">
              what this method is really buying you
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm leading-7 text-zinc-600 md:grid-cols-3">
            <p>
              <span className="font-semibold text-zinc-900">what it is:</span> sortase
              recognizes a short peptide tag, usually `LPXTG`, cleaves between `T` and
              `G`, then transfers the tagged protein onto an N-terminal glycine
              nucleophile.{cite(1)}{cite(3)}{cite(5)}{cite(6)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">why teams use it:</span>{" "}
              when the tag is tolerated, sortase gives very explicit ligation logic and
              makes it easy to swap in different glycine-bearing partners at one chosen
              site.{cite(1)}{cite(2)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">main tradeoff:</span> the
              price of that control is construct engineering. the protein has to carry
              the recognition tag and the workflow has to manage enzyme kinetics,
              calcium dependence for wild-type enzyme, and hydrolysis risk.{cite(3)}
              {cite(4)}{cite(5)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              mechanism
            </p>
            <h2 className="site-page-heading font-semibold">
              how the ligation step actually works
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Sortase A ligation mechanism">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/80 p-5">
                <div
                  className="mermaid-flow min-h-[32rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">cut point</p>
                <p className="mt-2">
                  the classic cleavage site is between threonine and glycine in the
                  `LPXTG` motif. that is why the tagged protein usually carries the tag
                  and the incoming partner carries the glycine nucleophile.{cite(3)}
                  {cite(5)}{cite(6)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">real chemical gate</p>
                <p className="mt-2">
                  the key intermediate is a transient thioacyl enzyme. if the
                  oligoglycine partner does not capture it efficiently, hydrolysis
                  competes and conversion falls.{cite(3)}{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why antibody groups care</p>
                <p className="mt-2">
                  sortase gives a cleaner positional story than broad lysine chemistry,
                  but only if the antibody or fragment can tolerate a programmed tag.
                  {cite(1)}{cite(2)}
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
            <h2 className="site-page-heading font-semibold">
              where the two reactive pieces usually sit
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Sortase placement map">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/80 p-6">
                <div className="zoom-graphic grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
                  <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                      tagged protein side
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-sky-400 bg-white text-lg font-semibold text-sky-700">
                        mAb
                      </div>
                      <div className="h-1.5 flex-1 rounded-full bg-sky-300" />
                      <div className="rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700">
                        LPXTG
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                      the classic sortase-a setup places the recognition motif on the
                      protein, often at the C-terminus or another engineered-exposed end
                      that still preserves binding and folding.{cite(1)}{cite(3)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                      sortase a
                    </span>
                    <span className="text-4xl text-zinc-400">⇄</span>
                  </div>

                  <div className="rounded-[1.5rem] border border-violet-200 bg-violet-50/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">
                      incoming partner
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="rounded-full border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700">
                        GGG
                      </div>
                      <div className="h-1.5 flex-1 rounded-full bg-violet-300" />
                      <div className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700">
                        linker / payload / label
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                      the incoming partner usually starts with oligoglycine. that
                      glycine handle can carry a linker, fluorophore, peptide, or other
                      module once the ligation step is complete.{cite(1)}{cite(3)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-7 text-zinc-600">
                  <span className="font-semibold text-zinc-900">practical read:</span>{" "}
                  sortase is great when you want the protein to present the recognition
                  information and the incoming partner to stay modular. that is why it
                  is attractive for late-stage swapping of handles or labels once the
                  tagged construct exists.{cite(2)}{cite(4)}
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
            <h2 className="site-page-heading font-semibold">
              the small-molecule logic around sortase ligation
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="glycine"
              subtitle="the nucleophile starts here"
              smiles="NCC(=O)O"
              pubchemQuery="glycine"
              note="sortase chemistry depends on a free N-terminal glycine nucleophile, so the glycine end has to stay open."
              category="linker"
              className="h-full"
            />
            <StructureCard
              title="triglycine acceptor"
              subtitle="classic incoming partner logic"
              smiles="NCC(=O)NCC(=O)NCC(=O)O"
              pubchemQuery="triglycine"
              note="GGG is a common practical acceptor motif because it gives sortase a flexible glycine-bearing entry point."
              category="linker"
              className="h-full"
            />
            <div className="rounded-[1.75rem] border border-white/80 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-600">tag rule</p>
              <h3 className="mt-3 text-2xl font-semibold text-zinc-900">LPXTG motif</h3>
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
                {["L", "P", "X", "T", "G"].map((aa) => (
                  <span
                    key={aa}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700"
                  >
                    {aa}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-zinc-600">
                the `X` position can vary, but the key logic is preserved: sortase
                recognizes the motif and cleaves after threonine before the glycine
                attack step.{cite(3)}{cite(5)}{cite(6)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              workflow
            </p>
            <h2 className="site-page-heading font-semibold">
              what teams usually have to tune
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="Sortase workflow tuning points"
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
              sortase is conceptually simple, but in practice it is a construct-plus-enzyme
              problem: tag location, glycine partner design, hydrolysis control, and
              usable kinetics all have to line up.{cite(1)}{cite(3)}{cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              comparison
            </p>
            <h2 className="site-page-heading font-semibold">
              how it sits against transglutaminase
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="Sortase versus transglutaminase comparison"
              className="rounded-xl border border-white/70 bg-white/60"
            >
              <TableHeader>
                <TableColumn>Question</TableColumn>
                <TableColumn>sortase a</TableColumn>
                <TableColumn>transglutaminase</TableColumn>
              </TableHeader>
              <TableBody>
                {compareRows.map((row) => (
                  <TableRow key={row.question}>
                    <TableCell>{row.question}</TableCell>
                    <TableCell>{row.sortase}</TableCell>
                    <TableCell>{row.transglutaminase}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="font-semibold text-zinc-900">when sortase is especially attractive</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  when teams want to swap multiple incoming partners onto one tagged
                  scaffold and keep the installation point extremely explicit.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
                <p className="font-semibold text-zinc-900">what improved variants change</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  engineered sortase variants mainly improve practical turnover and
                  antibody compatibility; they help with rate, not with tag tolerance
                  magically disappearing.{cite(1)}{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="font-semibold text-zinc-900">what still limits it</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  if the protein cannot tolerate an `LPXTG`-style tag in a useful place,
                  sortase usually stops being the best answer no matter how elegant the
                  chemistry is on paper.{cite(2)}{cite(4)}
                </p>
              </div>
            </div>
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
