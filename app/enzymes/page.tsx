"use client";

import { useEffect, useRef } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { motion } from "framer-motion";
import { MoleculeCard } from "@/components/MoleculeCard";
import { SourceList } from "@/components/SourceList";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const references = [
  {
    id: 1,
    label:
      "Antibody-directed enzyme prodrug therapy (ADEPT): concepts and developments (Advanced Drug Delivery Reviews, 1997)",
    href: "https://pubmed.ncbi.nlm.nih.gov/9363870/",
    note: "classic ADEPT review used for the core targeting-enzyme-prodrug logic and why localized catalytic activation can widen the therapeutic window.",
  },
  {
    id: 2,
    label:
      "Targeted enzyme prodrug therapy using 2′-deoxyribosyltransferase conjugates (Biomolecules, 2024) — CC BY",
    href: "https://www.mdpi.com/2218-273X/14/8/894",
    note: "used for modern targeted enzyme prodrug therapy framing and the open-source schematic already used in this chapter.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const parts = [
  {
    title: "targeting moiety",
    desc: "the address label has to accumulate enough enzyme at the right site before any catalytic advantage matters.",
  },
  {
    title: "enzyme",
    desc: "the catalyst has to stay active in vivo, avoid immune problems, and turn over the substrate fast enough to matter locally.",
  },
  {
    title: "prodrug or substrate",
    desc: "the masked agent has to survive circulation, then become meaningfully more active only where the enzyme has localized.",
  },
];

const realityCards = [
  {
    title: "why enzyme conjugates are different",
    body: "most conjugates are one-for-one delivery systems. enzyme conjugates are different because one targeted catalyst can activate many substrate molecules once it reaches the right compartment.",
  },
  {
    title: "why they can look powerful",
    body: "if localization works, catalysis can amplify local effect without requiring every incoming molecule to already carry the final active drug in exposed form.",
  },
  {
    title: "why they can fail hard",
    body: "if the enzyme localizes poorly or the prodrug leaks activation elsewhere, the same catalytic amplification that looked attractive can become the safety problem.",
  },
];

const comparisonRows = [
  {
    topic: "how effect is generated",
    enzyme: "localized catalysis converts a separate prodrug or substrate pool",
    classic: "the delivered conjugate usually carries the active cargo directly",
  },
  {
    topic: "where leverage sits",
    enzyme: "targeting accuracy, enzyme turnover, and prodrug selectivity",
    classic: "ligand tolerance, linker behavior, and payload exposure window",
  },
  {
    topic: "best-case upside",
    enzyme: "signal or drug generation can be amplified locally",
    classic: "more direct chemistry and fewer moving parts",
  },
  {
    topic: "main failure mode",
    enzyme: "wrong-site activation or poor catalyst localization",
    classic: "premature release, low target engagement, or systemic exposure",
  },
];

export default function EnzymePage() {
  const pressureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const Plotly = (
      window as typeof window & {
        Plotly?: {
          newPlot: (
            target: HTMLDivElement,
            data: unknown[],
            layout: Record<string, unknown>,
            config?: Record<string, unknown>,
          ) => Promise<void>;
          purge: (target: HTMLDivElement) => void;
        };
      }
    ).Plotly;

    const plotEl = pressureRef.current;
    if (!Plotly || !plotEl) return;

    void Plotly.newPlot(
      plotEl,
      [
        {
          type: "bar",
          name: "targeting pressure",
          x: ["localization", "circulation stability", "activation control", "development burden"],
          y: [4.8, 3.4, 3.2, 3.1],
          marker: { color: "#0ea5e9" },
        },
        {
          type: "bar",
          name: "enzyme pressure",
          x: ["localization", "circulation stability", "activation control", "development burden"],
          y: [3.2, 4.4, 4.8, 4.2],
          marker: { color: "#10b981" },
        },
        {
          type: "bar",
          name: "prodrug pressure",
          x: ["localization", "circulation stability", "activation control", "development burden"],
          y: [2.8, 4.1, 4.6, 3.6],
          marker: { color: "#8b5cf6" },
        },
      ],
      {
        barmode: "group",
        margin: { l: 60, r: 24, t: 28, b: 90 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        yaxis: {
          title: "qualitative design pressure",
          range: [0, 5.2],
          tickvals: [1, 2, 3, 4, 5],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        xaxis: {
          tickangle: -12,
        },
        legend: {
          orientation: "h",
          y: 1.16,
          x: 0,
        },
        font: {
          family: "var(--font-manrope), sans-serif",
          color: "#334155",
        },
      },
      {
        displayModeBar: false,
        responsive: true,
      },
    );

    return () => {
      Plotly.purge(plotEl);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="enzyme" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="text-sm text-sky-700">
            back to home
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            enzyme conjugates
          </Chip>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold sm:text-6xl">
            catalytic activity at the target site
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            enzyme conjugates pair a targeting system with a catalyst and a masked substrate or
            prodrug. the whole point is local conversion: keep the active effect quiet in
            circulation, then generate it only where the catalyst has accumulated enough to make
            the reaction matter.{cite(1)}
            {cite(2)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href="/enzymes/targeting" radius="full" className="bg-sky-600 text-white">
              targeting page
            </Button>
            <Button
              as={Link}
              href="/enzymes/enzyme"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              enzyme page
            </Button>
            <Button
              as={Link}
              href="/enzymes/prodrug"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              prodrug page
            </Button>
          </div>
        </motion.section>

        <section className="grid gap-6 md:grid-cols-3">
          {parts.map((item) => (
            <Card key={item.title} className="border border-white/80 bg-white/70">
              <CardBody className="flex flex-col gap-3 p-6">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">{item.desc}</p>
              </CardBody>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MoleculeCard label="targeting antibody" variant="antibody" />
          <MoleculeCard label="enzyme" variant="enzyme" />
          <MoleculeCard label="prodrug substrate" variant="payload" />
        </section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              architecture
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              how an enzyme conjugate is supposed to work
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Enzyme conjugate architecture">
              <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/80 p-5">
                <svg
                  viewBox="0 0 1080 360"
                  className="zoom-graphic h-auto w-full"
                  role="img"
                  aria-label="Architecture of an enzyme conjugate"
                >
                  <rect x="70" y="88" width="250" height="110" rx="28" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="4" />
                  <rect x="416" y="112" width="230" height="72" rx="26" fill="#dcfce7" stroke="#34d399" strokeWidth="4" />
                  <rect x="748" y="88" width="260" height="110" rx="28" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="4" />
                  <path d="M320 143 H 416" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                  <path d="M646 143 H 748" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                  <polygon points="390,118 438,143 390,168" fill="#0f172a" />
                  <polygon points="722,118 770,143 722,168" fill="#0f172a" />
                  <text x="102" y="136" fill="#0369a1" fontSize="28" fontWeight="700">targeting moiety</text>
                  <text x="102" y="170" fill="#475569" fontSize="22">gets the catalyst close enough</text>
                  <text x="472" y="155" fill="#047857" fontSize="28" fontWeight="700">enzyme</text>
                  <text x="782" y="136" fill="#6d28d9" fontSize="28" fontWeight="700">prodrug / substrate</text>
                  <text x="782" y="170" fill="#475569" fontSize="22">stays quiet until conversion</text>

                  <rect x="110" y="250" width="220" height="52" rx="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <rect x="368" y="250" width="300" height="52" rx="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <rect x="706" y="250" width="260" height="52" rx="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="150" y="283" fill="#334155" fontSize="20">1. localize first</text>
                  <text x="418" y="283" fill="#334155" fontSize="20">2. keep catalyst active long enough</text>
                  <text x="752" y="283" fill="#334155" fontSize="20">3. convert locally</text>
                </svg>
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why this can outperform direct delivery</p>
                <p className="mt-2">
                  one localized enzyme can activate multiple substrate molecules, so the system
                  can act more like local catalysis than one-shot delivery.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">where the whole thing breaks</p>
                <p className="mt-2">
                  if localization fails, the catalyst and substrate no longer cooperate in one
                  place, and the therapeutic-index story starts collapsing.{cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what makes it medicinally tricky</p>
                <p className="mt-2">
                  all three parts are coupled: targeting drives where the enzyme goes, enzyme
                  choice drives what chemistry is possible, and prodrug design drives what really
                  gets released.{cite(1)}
                  {cite(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated pressure map
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              which part of the enzyme-conjugate stack usually creates the next problem
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={pressureRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">targeting breaks the biology first</p>
                <p className="mt-2">
                  if the address label does not localize tightly enough, catalytic amplification
                  becomes a liability instead of an advantage.{cite(1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">the enzyme breaks the platform first</p>
                <p className="mt-2">
                  turnover, stability, and immunogenicity decide whether the system behaves like
                  a practical therapy or a fragile lab construct.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">the prodrug breaks selectivity first</p>
                <p className="mt-2">
                  if the masked substrate is too labile or the released species diffuses too
                  freely, the whole “local activation” idea loses its edge.{cite(1)}
                  {cite(2)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              what is different
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              why enzyme conjugates are not just another payload format
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="How enzyme conjugates differ from direct conjugates" removeWrapper>
              <TableHeader>
                <TableColumn>design topic</TableColumn>
                <TableColumn>enzyme conjugates</TableColumn>
                <TableColumn>direct-delivery conjugates</TableColumn>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.topic}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.topic}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.enzyme}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.classic}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              open-source figure
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              targeted enzyme prodrug therapy in one visual
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Targeted enzyme prodrug therapy schematic">
              <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/80 p-3">
                <Image
                  src="/images/ccby/enzyme-idept-mdpi-fig1.png"
                  alt="Targeted enzyme prodrug therapy schematic"
                  className="zoom-graphic w-full rounded-xl object-contain"
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 md:grid-cols-3">
              {realityCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                  <p className="font-semibold text-zinc-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{card.body}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              cc-by figure from MDPI Biomolecules.{cite(2)}
            </p>
          </CardBody>
        </Card>

        <SourceList title="verified sources" items={references} />
      </main>
    </div>
  );
}
