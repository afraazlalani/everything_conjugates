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
  Image,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
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
      "Conjugation Protocol for Amine Reactive Dyes (Tocris) — NHS esters, lysine reactivity, basic pH, avoid amine buffers",
    href: "https://www.tocris.com/resources/protocols/janelia-fluor-dyes/conjugation-protocol-amine-reactive-dyes",
  },
  {
    id: 4,
    label:
      "BP Fluor 594 TFP Ester (BroadPharm) — TFP ester amine reactivity and hydrolysis resistance vs NHS",
    href: "https://broadpharm.com/product/bp-25575",
  },
  {
    id: 5,
    label: "Original figure by Afraaz Lalani (2026) — NHS–lysine conjugation scheme",
    href: "#",
  },
  {
    id: 6,
    label: "Original figure by Afraaz Lalani (2026) — TFP–lysine conjugation scheme",
    href: "#",
  },
  {
    id: 7,
    label:
      "Thermo Fisher: Chemistry of crosslinking — NHS esters react with primary amines at pH 7.2–8.5; avoid Tris/glycine buffers",
    href: "https://www.thermofisher.com/ru/en/home/life-science/protein-biology/protein-biology-learning-center/protein-biology-resource-library/pierce-protein-methods/chemistry-crosslinking.html",
  },
  {
    id: 8,
    label:
      "Thermo Fisher FAQ: amine-reactive dyes (NHS/TFP) work best at pH 8.0–8.5; avoid Tris buffers",
    href: "https://www.thermofisher.com/store/v3/products/faqs/A20006",
  },
  {
    id: 9,
    label:
      "Thermo Fisher IgM labeling protocol — remove free dye by gel filtration or dialysis",
    href: "https://www.thermofisher.com/aq/en/home/references/protocols/cell-and-tissue-analysis/labeling-chemistry-protocols/fluorescent-amine-reactive-alexa-fluor-dye-labeling-of-igm-antibodies.html.html",
  },
  {
    id: 10,
    label:
      "Current ADC Linker Chemistry (Pharmaceutical Research, 2015) — lysine conjugation heterogeneity and typical DAR 3–4",
    href: "https://link.springer.com/article/10.1007/s11095-015-1657-7",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function LysineChemistryPage() {
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
            lysine acylation
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            NHS ester conjugation on lysines
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            NHS ester chemistry targets accessible lysines to form stable amide bonds,
            producing robust conjugates with broad compatibility across payloads and
            linker classes.
            {cite(1)}
            {cite(3)}
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              reaction schemes
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              NHS vs TFP activated esters
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-6 text-sm text-zinc-600">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                NHS ester + lysine ε‑NH2 → amide + NHS
              </p>
              <Image
                src="/images/lysine-nhs-linker-payload.png"
                alt="NHS ester conjugation on lysine residues"
                className="mt-3 w-full rounded-xl border border-white/70 bg-white/60 p-3"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Original figure by Afraaz Lalani (2026). {cite(5)}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                NHS esters acylate lysine ε‑amines under mildly basic conditions.
                {cite(3)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                TFP ester + lysine ε‑NH2 → amide + TFP
              </p>
              <Image
                src="/images/lysine-tfp-linker-payload.png"
                alt="TFP ester conjugation on lysine residues"
                className="mt-3 w-full rounded-xl border border-white/70 bg-white/60 p-3"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Original figure by Afraaz Lalani (2026). {cite(6)}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                TFP esters are amine‑reactive activated esters with improved resistance to
                hydrolysis compared with NHS esters.
                {cite(4)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              key parameters
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              reaction conditions that matter
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">pH window</p>
              <p>
                NHS and TFP esters react with primary amines in the mildly basic range;
                common guidance is pH ~7.2–8.5 with best performance around pH 8.0–8.5.
                {cite(7)}
                {cite(8)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">buffer choice</p>
              <p>
                Avoid amine‑containing buffers (for example Tris or glycine) because they
                compete with lysines for activated esters.
                {cite(7)}
                {cite(8)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">hydrolysis control</p>
              <p>
                Activated esters hydrolyze in water; TFP esters are typically more
                hydrolysis‑resistant than NHS, giving a longer working window.
                {cite(4)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              heterogeneity
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              why lysine conjugation is distribution‑heavy
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Antibodies present many lysines with variable accessibility, so lysine
              conjugation yields a mixture of positional isomers and drug‑to‑antibody ratios
              (DAR) rather than a single uniform species.
              {cite(1)}
              {cite(10)}
            </p>
            <p>
              Typical lysine‑conjugated ADCs often show average DAR values around 3–4,
              with a distribution of species across a wider range.
              {cite(1)}
              {cite(10)}
            </p>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">impact</p>
              <p>
                This distribution can influence potency, stability, and antigen binding if
                critical lysines are modified.
                {cite(1)}
                {cite(2)}
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
              a standard lysine conjugation flow
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">1. buffer exchange</p>
                <p>Move antibody into amine‑free buffer at basic pH. {cite(7)}{cite(8)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">2. add ester reagent</p>
                <p>Add NHS/TFP‑linker‑payload and incubate. {cite(3)}{cite(7)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">3. quench &amp; purify</p>
                <p>Remove free reagent by desalting or dialysis. {cite(9)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">4. characterize</p>
              <p>
                Measure protein concentration and average DAR with validated analytical
                methods before downstream assays.
                {cite(1)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              why teams use it
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              strengths
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <p>robust, scalable chemistry with standard reagents{cite(1)}</p>
            <p>works across many mAbs and payload-linker chemistries{cite(1)}</p>
            <p>no need for engineered residues or complex enzymes{cite(2)}</p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              tradeoffs
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              limitations
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <p>heterogeneous DAR distributions across lysines{cite(1)}</p>
            <p>batch-to-batch variability if reaction control is limited{cite(1)}</p>
            <p>possible impact on antigen binding if key lysines are modified{cite(2)}</p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              pros and cons table
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              NHS vs TFP at a glance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="NHS vs TFP comparison" className="text-sm">
              <TableHeader>
                <TableColumn>feature</TableColumn>
                <TableColumn>NHS ester</TableColumn>
                <TableColumn>TFP ester</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow key="reactivity">
                  <TableCell>amine reactivity</TableCell>
                  <TableCell>high for lysine ε‑NH2{cite(3)}</TableCell>
                  <TableCell>high for lysine ε‑NH2{cite(4)}</TableCell>
                </TableRow>
                <TableRow key="hydrolysis">
                  <TableCell>hydrolysis stability</TableCell>
                  <TableCell>moderate; sensitive in aqueous buffers{cite(3)}</TableCell>
                  <TableCell>more hydrolysis‑resistant than NHS{cite(4)}</TableCell>
                </TableRow>
                <TableRow key="conditions">
                  <TableCell>typical conditions</TableCell>
                  <TableCell>mildly basic pH; avoid amine buffers{cite(3)}</TableCell>
                  <TableCell>similar conditions; longer working window{cite(4)}</TableCell>
                </TableRow>
                <TableRow key="use">
                  <TableCell>common use</TableCell>
                  <TableCell>general protein labeling{cite(3)}</TableCell>
                  <TableCell>protein labeling when stability is critical{cite(4)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              use cases
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              where lysine conjugation shows up
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <p>fluorophore labeling of antibodies and proteins for analytics{cite(3)}</p>
            <p>payload-linker attachment in early ADC discovery workflows{cite(1)}</p>
            <p>pegylation or hapten conjugation for immunoassays{cite(3)}</p>
            <p>TFP esters in cases requiring improved hydrolysis resistance{cite(4)}</p>
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
