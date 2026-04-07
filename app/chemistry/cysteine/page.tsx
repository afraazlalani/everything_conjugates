"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Image,
  Link,
  Navbar,
  NavbarBrand,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { motion } from "framer-motion";
import { ZoomableFigure } from "@/components/ZoomableFigure";

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
      "Linker in antibody–drug conjugates: a review of linker chemistry (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article/7/3/tbae020/7717690",
  },
  {
    id: 3,
    label:
      "Site-specific conjugation of native antibody (Antibody Therapeutics, 2020) — interchain disulfides and DAR distributions",
    href: "https://academic.oup.com/abt/article/3/4/271/6041421",
  },
  {
    id: 4,
    label:
      "Thiol-Reactive Probe Labeling Protocol (Thermo Fisher) — maleimide optimal pH ~7.0 and thiol labeling workflow",
    href: "https://www.thermofisher.com/tm/en/home/references/protocols/cell-and-tissue-analysis/labeling-chemistry-protocols/thiol-reactive-probe-labeling-protocol.html",
  },
  {
    id: 5,
    label:
      "Introduction to Thiol Modification and Detection (Thermo Fisher Handbook) — compromise pH 7.0–7.5 due to maleimide hydrolysis",
    href: "https://www.thermofisher.com/us/en/home/references/molecular-probes-the-handbook/thiol-reactive-probes/introduction-to-thiol-modification-and-detection.html",
  },
  {
    id: 6,
    label:
      "Long-Term Stabilization of Maleimide–Thiol Conjugates (Bioconjugate Chemistry, 2014)",
    href: "https://pubs.acs.org/doi/10.1021/bc5005262",
  },
  {
    id: 7,
    label:
      "Succinimide ring hydrolysis equilibrium and stability in ADCs (RSC Med. Chem., 2024)",
    href: "https://pubs.rsc.org/en/content/articlelanding/2024/md/d3md00569k",
  },
  {
    id: 8,
    label:
      "Interchain cysteine-conjugated ADC heterogeneity and DAR species (ACS Pharmacology & Translational Science, 2023)",
    href: "https://pubs.acs.org/doi/abs/10.1021/acsptsci.3c00235",
  },
];

const workflowRows = [
  {
    step: "partially reduce interchain disulfides",
    why: "the reaction only starts once buried cystines are opened into accessible thiols on the antibody side",
    risk: "over-reduction widens DAR distribution and can weaken structural integrity",
  },
  {
    step: "clear excess reductant before dosing in maleimide",
    why: "free TCEP or DTT can compete with the maleimide reagent and lower productive coupling",
    risk: "leftover reductant burns reagent and muddies product quality",
  },
  {
    step: "run coupling near neutral pH",
    why: "teams usually work around pH 7.0–7.5 to keep thiols reactive without letting maleimide hydrolyze too aggressively",
    risk: "too basic pushes side reactions and hydrolysis; too acidic slows coupling",
  },
  {
    step: "watch thiosuccinimide stability after install",
    why: "the first product can still exchange or drift until hydrolysis locks the linkage into a more stable state",
    risk: "retro-Michael exchange can cause payload migration or deconjugation",
  },
  {
    step: "profile DAR instead of assuming one clean product",
    why: "native cysteine methods usually yield a DAR distribution rather than one fully defined species",
    risk: "high-DAR tails can increase hydrophobicity, aggregation, and PK stress",
  },
];

const compareRows = [
  {
    question: "why teams still use it",
    cysteine:
      "fast, familiar, and clinically validated route with strong process precedent",
    siteSpecific:
      "used when tighter positional control matters more than workflow simplicity",
  },
  {
    question: "what defines the site",
    cysteine:
      "native interchain disulfides opened to thiols after controlled reduction",
    siteSpecific:
      "engineered residues, tags, or enzyme-recognition features",
  },
  {
    question: "what product quality looks like",
    cysteine:
      "a DAR distribution, often with even-numbered species from interchain reduction logic",
    siteSpecific:
      "narrower positional distribution and more interpretable product map",
  },
  {
    question: "main chemistry risk",
    cysteine:
      "thiosuccinimide instability and payload migration if the linkage is not stabilized",
    siteSpecific:
      "extra engineering burden and a more complex development path up front",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function CysteineChemistryPage() {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [mermaidSvg, setMermaidSvg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || !plotRef.current) return;
    const plotEl = plotRef.current;
    const Plotly = (
      window as typeof window & {
        Plotly?: {
          newPlot: (
            el: HTMLElement,
            data: unknown[],
            layout: Record<string, unknown>,
            config?: Record<string, unknown>
          ) => Promise<unknown>;
          purge: (el: HTMLElement) => void;
        };
      }
    ).Plotly;

    if (!Plotly || !plotEl) return;

    const data = [
      {
        type: "bar",
        x: [
          "DAR 0",
          "DAR 1",
          "DAR 2",
          "DAR 3",
          "DAR 4",
          "DAR 5",
          "DAR 6",
          "DAR 7",
          "DAR 8",
        ],
        y: [0.9, 1.8, 3.1, 4.2, 5.1, 5.0, 3.8, 2.3, 1.2],
        marker: {
          color: [
            "#cbd5e1",
            "#e2e8f0",
            "#7dd3fc",
            "#bfdbfe",
            "#60a5fa",
            "#a5b4fc",
            "#818cf8",
            "#c4b5fd",
            "#a78bfa",
          ],
          line: { color: "#475569", width: 1.2 },
        },
        text: [
          "starting pool",
          "early loaded species",
          "building distribution",
          "approaching center",
          "main cluster",
          "main cluster",
          "high-DAR shoulder",
          "high-DAR tail",
          "upper tail",
        ],
        textposition: "outside",
        cliponaxis: false,
        hovertemplate:
          "%{x}<br>qualitative relative abundance: %{y}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 50, r: 20, t: 20, b: 50 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: { text: "drug-to-antibody ratio band", font: { size: 16, color: "#334155" } },
        tickfont: { size: 14, color: "#334155" },
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      yaxis: {
        title: { text: "qualitative abundance", font: { size: 16, color: "#334155" } },
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      font: { family: "var(--font-manrope), sans-serif", color: "#0f172a" },
      showlegend: false,
    };

    void Plotly.newPlot(plotEl, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    return () => {
      Plotly.purge(plotEl);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const diagram = `flowchart LR
      A["partially reduced antibody<br/>interchain thiols exposed"]
      B["maleimide linker-payload<br/>electrophile ready for thiol capture"]
      C["thiosuccinimide product<br/>fast installed conjugate"]
      D["ring-opened stabilized product<br/>less exchange-prone linkage"]

      A --> B --> C --> D

      classDef sky fill:#e0f2fe,stroke:#38bdf8,color:#0f172a;
      classDef indigo fill:#e0e7ff,stroke:#818cf8,color:#0f172a;
      classDef amber fill:#fef3c7,stroke:#f59e0b,color:#92400e;
      classDef slate fill:#ffffff,stroke:#cbd5e1,color:#334155;

      class A sky;
      class B indigo;
      class C amber;
      class D slate;`;

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
          fontSize: "20px",
          fontFamily: "var(--font-manrope), sans-serif",
          primaryTextColor: "#0f172a",
          lineColor: "#0f172a",
        },
        flowchart: {
          nodeSpacing: 34,
          rankSpacing: 58,
          padding: 24,
          curve: "basis",
          htmlLabels: true,
        },
      });

      try {
        const { svg } = await mermaid.render(`cys-flow-${Date.now()}`, diagram);
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
  }, [mermaidSvg]);

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
          <Link href="/" className="text-sm text-sky-700">
            home
          </Link>
          <Link href="/#conjugation-chemistry" className="text-sm text-sky-700">
            conjugation chemistry
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 pb-16 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            cysteine conjugation
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            maleimide-thiol coupling
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            cysteine conjugation uses controlled disulfide reduction to expose antibody
            thiols, then captures those thiols with maleimide-bearing linker-payloads.
            it is still one of the most familiar industrial ADC chemistries because it
            is fast, scalable, and clinically proven, even though it gives a DAR
            distribution rather than one perfectly defined site.{cite(1)}{cite(2)}
            {cite(3)}
          </p>
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              overview
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what makes this chemistry so common
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm leading-7 text-zinc-600 md:grid-cols-3">
            <p>
              <span className="font-semibold text-zinc-900">what it is:</span> reduce
              interchain disulfides, expose thiols, then trap those thiols with a
              maleimide-bearing partner to give a thiosuccinimide-linked
              conjugate.{cite(1)}{cite(3)}{cite(4)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">why teams use it:</span>{" "}
              the workflow is operationally familiar, fast at near-neutral pH, and
              already tied to many validated manufacturing and analytical
              routines.{cite(1)}{cite(2)}{cite(4)}{cite(5)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">main cost:</span> native
              cysteine chemistry gives a distribution of species and needs active
              management of thiosuccinimide stability, DAR spread, and
              hydrophobicity.{cite(6)}{cite(7)}{cite(8)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              reaction logic
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              from reduced thiols to a stabilized conjugate
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3">
            <ZoomableFigure label="maleimide-thiol conjugation scheme">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/80 p-4">
                <Image
                  alt="IgG reacting with a maleimide-linker-payload to form an IgG conjugate"
                  src="/maleimide-thiol-conjugation.png"
                  className="zoom-graphic h-auto w-full object-contain"
                  radius="sm"
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what this scheme is showing</p>
                <p className="mt-2">
                  this is the full antibody view of native cysteine conjugation: a
                  reduced IgG exposes a cysteine thiol, that thiol attacks the
                  maleimide-bearing linker-payload, and the installed conjugate retains
                  the rest of the linker-payload architecture on the product side.
                </p>
                <p className="mt-3">
                  that’s why this image matters more than a tiny reaction cartoon here:
                  it connects the bond-forming step to the actual antibody-scale outcome
                  teams are trying to make.{cite(1)}{cite(3)}{cite(6)}
                </p>
              </div>
            </div>
            <ZoomableFigure label="maleimide-thiol reaction logic">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/80 p-4">
                <div
                  className="min-h-[10rem] [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">reactive window</p>
                <p className="mt-2">
                  the chemistry usually lives around pH 7.0–7.5 because that window
                  keeps thiols reactive while limiting unnecessary maleimide
                  breakdown.{cite(4)}{cite(5)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">first product is not the final story</p>
                <p className="mt-2">
                  the initial thiosuccinimide can still exchange, so later ring opening
                  is often what makes the linkage more durable in
                  practice.{cite(6)}{cite(7)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why analytics matter</p>
                <p className="mt-2">
                  even if coupling looks efficient, the real product is usually a family
                  of DAR species that needs HIC or related profiling to
                  interpret.{cite(3)}{cite(8)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              qualitative plot
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what a native cysteine DAR profile often looks like
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-3">
              <div ref={plotRef} className="min-h-[14rem] w-full" />
            </div>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">how to read it</p>
                <p className="mt-2">
                  this is a qualitative teaching plot, not a measured dataset. it
                  now reflects a more continuous real-world spread: abundance rises
                  from low DAR toward the middle bands, often plateaus around DAR 4–5,
                  then falls away again toward the high-DAR tail.{cite(3)}{cite(8)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why the middle matters</p>
                <p className="mt-2">
                  many native-cysteine samples build toward a middle cluster around DAR
                  4–5, where enough disulfides have been opened to load payload without
                  pushing too hard into the highest-DAR tail.{cite(3)}{cite(8)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why the tail still matters</p>
                <p className="mt-2">
                  higher-DAR tails can drive more hydrophobicity and more aggregation
                  pressure, even when the central species looks acceptable.{cite(8)}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
              <span className="font-semibold text-zinc-900">practical note:</span> if
              a dataset shows both odd and even DAR species, that can still be very
              normal for a real native-cysteine population. the key question is not
              “are odd bands present?” but whether the overall distribution stays within
              the developability window the program can tolerate.{cite(3)}{cite(8)}
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              workflow reality
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what teams are actually controlling
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="cysteine conjugation workflow controls"
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
              where native cysteine sits versus tighter site-specific routes
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="cysteine versus site-specific comparison"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>question</TableColumn>
                <TableColumn>native cysteine / maleimide</TableColumn>
                <TableColumn>tighter site-specific routes</TableColumn>
              </TableHeader>
              <TableBody>
                {compareRows.map((row) => (
                  <TableRow key={row.question}>
                    <TableCell className="font-semibold text-zinc-900">{row.question}</TableCell>
                    <TableCell>{row.cysteine}</TableCell>
                    <TableCell>{row.siteSpecific}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
