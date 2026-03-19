"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Link,
  Navbar,
  NavbarBrand,
  Chip,
} from "@heroui/react";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { motion } from "framer-motion";

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
      "Interchain cysteine‑conjugated ADC heterogeneity and DAR species (ACS PTS, 2023)",
    href: "https://pubs.acs.org/doi/abs/10.1021/acsptsci.3c00235",
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
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="main" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <div className="h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_20px_2px_rgba(14,165,233,0.6)]" />
          <Link href="/" className="text-lg font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)] text-zinc-900">
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

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            cysteine conjugation
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            maleimide–thiol coupling
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            Cysteine conjugation uses reduced disulfide bonds to expose thiols that react
            with maleimide linkers, creating thioether bonds with widely used clinical
            precedents.
            {cite(1)}
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              at a glance
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what makes cysteine chemistry powerful
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">fast &amp; selective</p>
              <p>maleimides react rapidly with thiols near neutral pH. {cite(4)}{cite(5)}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">scalable</p>
              <p>processes are well understood from clinical ADCs. {cite(1)}{cite(2)}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">tunable DAR</p>
              <p>
                interchain disulfide reduction yields a distribution of DAR values (often
                centered around even numbers), spanning 0–8 depending on reduction extent.
                {cite(3)}
                {cite(8)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              reaction snapshot
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              from disulfides to stable thioethers
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <svg className="w-full" viewBox="0 0 800 140" fill="none">
                <rect x="20" y="20" width="220" height="80" rx="16" fill="#e0e7ff" />
                <text x="48" y="50" fontSize="16" fill="#0f172a">1. reduce</text>
                <text x="48" y="72" fontSize="13" fill="#334155">interchain disulfides</text>
                <rect x="290" y="20" width="220" height="80" rx="16" fill="#e0f2fe" />
                <text x="318" y="50" fontSize="16" fill="#0f172a">2. conjugate</text>
                <text x="318" y="72" fontSize="13" fill="#334155">maleimide–thiol</text>
                <rect x="560" y="20" width="220" height="80" rx="16" fill="#f5f3ff" />
                <text x="588" y="50" fontSize="16" fill="#0f172a">3. stabilize</text>
                <text x="588" y="72" fontSize="13" fill="#334155">ring opening / control</text>
                <path d="M245 60H285" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M515 60H555" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#0f172a" />
                  </marker>
                </defs>
              </svg>
              <p className="mt-2">
                Selective reduction exposes thiols for maleimide coupling, then stability is
                tuned by controlling succinimide ring opening.
                {cite(3)}
                {cite(6)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              reaction conditions
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              pH, buffers, and reduction control
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Maleimide–thiol reactions are typically run near neutral pH; guidance commonly
              centers around pH 7.0–7.5 to balance thiolate reactivity and maleimide
              stability.
              {cite(4)}
              {cite(5)}
            </p>
            <p>
              Reducing agents such as TCEP or DTT are used to liberate thiols, and excess
              reductant must be managed so it does not compete with the maleimide reagent.
              {cite(4)}
            </p>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">key control</p>
              <p>
                Interchain disulfides can be selectively reduced to tune DAR, yielding a
                distribution that can include 0–8 depending on reduction extent.
                {cite(3)}
                {cite(8)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              strengths
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              why it’s common
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <p>higher conjugation efficiency than lysine routes{cite(1)}</p>
            <p>consistent DAR when reduction is controlled{cite(1)}</p>
            <p>well understood scale-up and analytics{cite(2)}</p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              stability
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              where thioethers can fail
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Thiosuccinimide linkages can undergo thiol exchange (retro‑Michael), leading
              to payload migration; this is a well‑documented instability risk.
              {cite(6)}
            </p>
            <p>
              Hydrolysis of the succinimide ring yields a ring‑opened product that is more
              stable toward exchange, but the equilibrium can be formulation‑dependent.
              {cite(6)}
              {cite(7)}
            </p>
            <p>
              Over‑reduction or excessive cysteine exposure can destabilize the antibody
              structure compared with engineered strategies.
              {cite(1)}
              {cite(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              analytics
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              understanding DAR distributions
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Interchain cysteine conjugation often yields a distribution of DAR species;
              analytical methods such as HIC resolve 0, 2, 4, 6, and 8 drug‑load peaks.
              {cite(8)}
            </p>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">why it matters</p>
              <p>
                Higher‑DAR species are more hydrophobic and can affect stability and
                aggregation, so profiling the distribution is essential.
                {cite(8)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              workflow
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              a practical cysteine conjugation flow
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">1. prepare antibody</p>
                <p>Buffer to pH ~7.0–7.5 before reduction. {cite(4)}{cite(5)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">2. reduce</p>
                <p>Use TCEP/DTT to open interchain disulfides. {cite(3)}{cite(4)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">3. conjugate</p>
                <p>Add maleimide linker‑payload; control time &amp; pH. {cite(4)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">4. purify &amp; profile</p>
              <p>Remove excess reagents and characterize DAR distribution. {cite(8)}</p>
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
