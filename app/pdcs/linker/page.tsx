"use client";

import { useEffect, useRef } from "react";
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
import { BrandLogo } from "@/components/BrandLogo";
import { PdcSectionTabs } from "@/components/PdcSectionTabs";
import { StructureCard } from "@/components/StructureCard";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const references = [
  {
    id: 1,
    label:
      "Peptide-Drug Conjugates: Design, Chemistry, and Drug Delivery System as a Novel Cancer Theranostic (ACS Pharmacol. Transl. Sci., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acsptsci.3c00269",
  },
  {
    id: 2,
    label:
      "Peptides as a platform for targeted therapeutics for cancer: PDCs (Chem. Soc. Rev., 2021)",
    href: "https://pubs.rsc.org/en/Content/ArticleLanding/2021/CS/D0CS00556H",
  },
  {
    id: 3,
    label:
      "Peptide-drug conjugates: A new paradigm for targeted cancer therapy (Eur. J. Med. Chem., 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38194773/",
  },
  {
    id: 4,
    label:
      "Peptide-Drug Conjugates with Different Linkers for Cancer Therapy (J. Med. Chem., 2021)",
    href: "https://pubmed.ncbi.nlm.nih.gov/33382619/",
  },
  {
    id: 5,
    label:
      "Recent Advances in Augmenting the Therapeutic Efficacy of Peptide–Drug Conjugates (J. Med. Chem., 2025)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.5c00007",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const linkerRows = [
  {
    class: "cathepsin / protease-cleavable peptide linker",
    what: "uses intracellular protease activity to trigger payload release",
    why: "fits pdcs that actually reach endolysosomal compartments",
    risk: "can leak if extracellular proteases or inflammatory tissue cut it too early",
  },
  {
    class: "disulfide / reductive linker",
    what: "responds to intracellular reducing conditions",
    why: "useful when redox shift is stronger than enzyme certainty",
    risk: "exchange and premature reduction can broaden product behavior",
  },
  {
    class: "pH-sensitive linker",
    what: "tries to respond to acidic microenvironments or compartments",
    why: "can work when trafficking reliably reaches acidified endosomes",
    risk: "circulatory stability can be trickier than for tougher linker families",
  },
  {
    class: "non-cleavable linker",
    what: "keeps the construct intact until carrier degradation creates the active species",
    why: "good when stability matters more than fast free-payload release",
    risk: "the active product may be bulkier and more carrier-dependent",
  },
];

const attachmentRows = [
  {
    site: "n-terminus of peptide",
    when: "common when the receptor-binding residues sit further downstream and the peptide head is not essential for binding",
    upside: "synthetically straightforward and easy to compare across sequence variants",
    watchout: "can weaken binding if the free n-terminus participates in receptor recognition",
  },
  {
    site: "c-terminus of peptide",
    when: "useful when the pharmacophore lives toward the front half of the sequence",
    upside: "often cleaner for leaving the receptor-facing end less disturbed",
    watchout: "can still change charge and local peptide shape near the tail",
  },
  {
    site: "lysine or other side-chain handle",
    when: "used when one side chain can be reserved for conjugation without wrecking the motif",
    upside: "better geometric separation between binding residues and linker installation",
    watchout: "more chemistry work and not every residue is equally silent",
  },
  {
    site: "cysteine thiol handle",
    when: "used when thiol-selective chemistry is desired and a cysteine can be installed or exposed intentionally",
    upside: "gives access to fast maleimide or other thiol-reactive routes",
    watchout: "thiol oxidation, exchange, or altered folding can complicate behavior",
  },
];

const releaseCards = [
  {
    title: "what ideally breaks",
    text: "for many pdc programs, the preferred outcome is cleavage between linker and drug so the released species is close to the intended active payload rather than a bulky carrier-bound fragment.",
  },
  {
    title: "why peptide-side attachment still matters",
    text: "even if release happens on the payload side, the peptide-linker junction still has to preserve receptor binding and not distort the carrier too early.",
  },
  {
    title: "why non-cleavable can still win",
    text: "some pdcs work better when the construct stays intact until broader intracellular degradation generates the active species, especially when premature release is the bigger risk.",
  },
];

export default function PdcLinkerPage() {
  const plotRef = useRef<HTMLDivElement | null>(null);

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

    if (!Plotly) return;

    const data = [
      {
        type: "scatter",
        mode: "markers+text",
        x: [4.6, 3.6, 2.6, 4.8],
        y: [2.4, 4.2, 3.5, 1.8],
        text: ["non-cleavable", "protease-cleavable", "pH-sensitive", "reductive / disulfide"],
        textposition: ["bottom center", "top center", "top center", "bottom center"],
        marker: {
          size: [26, 26, 24, 24],
          color: ["#6366f1", "#38bdf8", "#f59e0b", "#22c55e"],
          line: { color: "#334155", width: 1.5 },
        },
        hovertemplate: "%{text}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 54, r: 22, t: 16, b: 58 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: { text: "circulatory stability bias", font: { size: 15, color: "#334155" } },
        range: [1.5, 5.2],
        tickvals: [2, 3, 4, 5],
        ticktext: ["lower", "mid", "strong", "very strong"],
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
      },
      yaxis: {
        title: { text: "trigger dependence", font: { size: 15, color: "#334155" } },
        range: [1.2, 4.8],
        tickvals: [1.5, 2.5, 3.5, 4.5],
        ticktext: ["lower", "moderate", "high", "very high"],
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
      },
      font: { family: "var(--font-manrope), sans-serif", color: "#0f172a" },
      annotations: [
        {
          x: 1.7,
          y: 1.35,
          text: "stable, but less trigger-driven",
          showarrow: false,
          font: { size: 12, color: "#64748b" },
        },
        {
          x: 5.02,
          y: 4.65,
          text: "more dependent on the right biology",
          showarrow: false,
          xanchor: "right",
          font: { size: 12, color: "#64748b" },
        },
      ],
    };

    void Plotly.newPlot(plotEl, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    return () => Plotly.purge(plotEl);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="pdc" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/pdcs" className="text-sm text-sky-700">
            pdc overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            linker logic
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            pdc linkers have to survive a small-carrier lifestyle
          </h1>
          <p className="max-w-4xl text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            because the peptide carrier is small and often clears fast, pdc linkers do
            more than release payloads. they help decide whether the construct survives
            circulation, whether release happens in the right compartment, and whether the
            delivered species is still potent once it gets there.{cite(1)}{cite(2)}{cite(3)}
          </p>
          <PdcSectionTabs active="linker" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              release map
            </p>
            <h2 className="text-3xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what the linker is solving in a pdc
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <ZoomableFigure label="pdc linker release logic">
              <div className="zoom-frame rounded-2xl border border-white/70 bg-white/85 p-5">
                <svg className="zoom-graphic h-auto w-full" viewBox="0 0 1100 360" fill="none">
                  <rect x="56" y="80" width="228" height="118" rx="32" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="4" />
                  <text x="170" y="132" textAnchor="middle" fontSize="28" fill="#0369a1" fontWeight="700">peptide carrier</text>
                  <text x="170" y="170" textAnchor="middle" fontSize="18" fill="#334155">binding and routing</text>

                  <rect x="376" y="100" width="192" height="76" rx="26" fill="#eef2ff" stroke="#818cf8" strokeWidth="4" />
                  <text x="472" y="147" textAnchor="middle" fontSize="28" fill="#4338ca" fontWeight="700">linker</text>

                  <rect x="662" y="80" width="212" height="118" rx="32" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="4" />
                  <text x="768" y="132" textAnchor="middle" fontSize="28" fill="#6d28d9" fontWeight="700">payload</text>
                  <text x="768" y="170" textAnchor="middle" fontSize="18" fill="#334155">active species logic</text>

                  <path d="M284 139H376" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" markerEnd="url(#linkerArrow)" />
                  <path d="M568 139H662" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" markerEnd="url(#linkerArrow)" />

                  <rect x="112" y="250" width="200" height="46" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="212" y="280" textAnchor="middle" fontSize="17" fill="#334155">1. stay intact in blood</text>
                  <rect x="340" y="250" width="200" height="46" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="440" y="280" textAnchor="middle" fontSize="17" fill="#334155">2. sense the trigger</text>
                  <rect x="568" y="250" width="200" height="46" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="668" y="280" textAnchor="middle" fontSize="17" fill="#334155">3. release cleanly</text>
                  <rect x="796" y="250" width="214" height="46" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="903" y="280" textAnchor="middle" fontSize="16.5" fill="#334155">4. leave a useful product</text>

                  <defs>
                    <marker id="linkerArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                      <path d="M0,0 L10,5 L0,10 Z" fill="#0f172a" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why pdc linkers are touchier than adc linkers</p>
                <p className="mt-2">because a short peptide has less built-in pharmacology and steric shielding, premature linker behavior can dominate the whole program earlier.</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why cleavage is not the only question</p>
                <p className="mt-2">the active species after cleavage has to stay potent, permeable, and chemically intact enough to matter in the target setting.</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what can go wrong</p>
                <p className="mt-2">fast plasma cleavage, slow intracellular cleavage, or a bad released species can all sink a pdc even if the peptide binds well.</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated comparison
            </p>
            <h2 className="text-3xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              where the main pdc linker families usually sit
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">how to read it</p>
                <p className="mt-2">
                  farther right means the linker is relying more heavily on the intended
                  trigger. lower on the plot means the design is usually more about staying
                  intact than sensing a specific biological event.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why pdcs care</p>
                <p className="mt-2">
                  because peptide carriers are smaller than antibodies, premature release or
                  the wrong trigger logic can dominate the whole program earlier.{cite(2)}{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">practical takeaway</p>
                <p className="mt-2">
                  many pdc programs are really balancing two questions at once: will the
                  construct survive long enough, and will the released species still be the
                  right active form once it gets there?{cite(4)}{cite(5)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative motifs
            </p>
            <h2 className="text-3xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              common pdc linker handles and triggers
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="Val-Cit"
              subtitle="cathepsin-cleavable dipeptide"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/name/L-Valyl-L-citrulline"
              pubchemQuery="L-Valyl-L-citrulline"
              note="representative protease-cleavable peptide trigger used when lysosomal processing is the planned release step."
              category="linker"
            />
            <StructureCard
              title="benzaldehyde hydrazone"
              subtitle="acid-labile release motif"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/name/benzaldehyde%20hydrazone"
              pubchemQuery="benzaldehyde hydrazone"
              note="representative pH-sensitive core for acidic release logic."
              category="linker"
            />
            <StructureCard
              title="disulfide"
              subtitle="redox-responsive linkage"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/name/dipropyl%20disulfide"
              pubchemQuery="dipropyl disulfide"
              note="representative reductive linker family used when intracellular reduction is the desired trigger."
              category="linker"
            />
            <StructureCard
              title="1,2,3-triazole"
              subtitle="click-built non-cleavable motif"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/name/1%2C2%2C3-triazole"
              pubchemQuery="1,2,3-triazole"
              note="representative click-derived motif used when the linker should stay intact and the peptide-payload assembly step needs modular chemistry."
              category="linker"
            />
            <StructureCard
              title="acetone oxime"
              subtitle="oxime-style stable connector logic"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/name/acetone%20oxime"
              pubchemQuery="acetone oxime"
              note="representative oxime chemistry used to illustrate stable peptide-payload joining logic rather than trigger-first cleavage."
              category="linker"
            />
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              comparison
            </p>
            <h2 className="text-3xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              pdc linker families at a glance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="pdc linker family comparison"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>class</TableColumn>
                <TableColumn>what it does</TableColumn>
                <TableColumn>why it gets used</TableColumn>
                <TableColumn>watchout</TableColumn>
              </TableHeader>
              <TableBody>
                {linkerRows.map((row) => (
                  <TableRow key={row.class}>
                    <TableCell className="font-semibold text-zinc-900">{row.class}</TableCell>
                    <TableCell>{row.what}</TableCell>
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
              attachment logic
            </p>
            <h2 className="text-3xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              where pdc linkers usually get installed on the peptide side
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="pdc peptide-side linker attachment"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>placement</TableColumn>
                <TableColumn>best fit</TableColumn>
                <TableColumn>upside</TableColumn>
                <TableColumn>watchout</TableColumn>
              </TableHeader>
              <TableBody>
                {attachmentRows.map((row) => (
                  <TableRow key={row.site}>
                    <TableCell className="font-semibold text-zinc-900">{row.site}</TableCell>
                    <TableCell>{row.when}</TableCell>
                    <TableCell>{row.upside}</TableCell>
                    <TableCell>{row.watchout}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              release reality
            </p>
            <h2 className="text-3xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what bond behavior usually matters most
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
            {releaseCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">{card.title}</p>
                <p className="mt-2">{card.text}</p>
              </div>
            ))}
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
