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
      "Transglutaminase‑mediated antibody conjugation (Bioconjugate Chemistry, 2024)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11227664/",
  },
  {
    id: 4,
    label:
      "Glycan remodeling for site‑specific Fc conjugation (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article-abstract/7/3/233/7710329",
  },
  {
    id: 5,
    label:
      "Improved Sortase A variants for site‑specific antibody conjugation (Sci. Reports, 2016)",
    href: "https://www.nature.com/articles/srep31899",
  },
  {
    id: 6,
    label:
      "Glycoconjugation using mutant GalT and bioorthogonal click chemistry (PMC, 2015)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4606561/",
  },
  {
    id: 7,
    label:
      "GlycoConnect for homogeneous ADCs and improved stability (PMC, 2024)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11612762/",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function EnzymaticChemistryPage() {
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
            enzymatic / glycan
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            enzymatic and glycan-based conjugation
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            Enzymatic ligation and Fc-glycan remodeling enable highly controlled
            conjugation sites and homogeneous DAR profiles, often improving
            reproducibility.
            {cite(2)}
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              enzyme toolbox
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              the main enzymatic routes
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">transglutaminase</p>
              <p>
                MTGase installs amide bonds between glutamine and amine‑bearing payloads,
                often targeting defined Fc sites after specific processing steps.
                {cite(3)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">sortase A</p>
              <p>
                Sortase A recognizes LPXTG motifs and ligates to oligoglycine‑tagged
                payloads for highly site‑specific attachments.
                {cite(5)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">glycan remodeling</p>
              <p>
                EndoS2 trimming and GalT‑based azide installation enable click chemistry at
                the conserved Fc glycan.
                {cite(4)}
                {cite(6)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">glycoConnect</p>
              <p>
                Glycan‑based processes can deliver homogeneous ADCs with improved stability
                profiles.
                {cite(7)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              why enzymes
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              control &amp; homogeneity
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Enzymes provide strict sequence or glycan recognition, which translates to
              single‑site conjugation and narrow DAR distributions.
              {cite(2)}
              {cite(4)}
            </p>
            <p>
              Glycan‑based approaches enable controlled site access without direct
              modification of the protein backbone, which can preserve Fc function.
              {cite(4)}
              {cite(7)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              strengths
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              why teams choose it
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <p>precise conjugation sites with narrow DAR distributions{cite(2)}</p>
            <p>improved batch-to-batch consistency{cite(2)}</p>
            <p>compatibility with sensitive payloads under mild conditions{cite(1)}</p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              tradeoffs
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              practical considerations
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <p>requires specialized enzymes or process steps{cite(2)}</p>
            <p>added manufacturing complexity and analytical validation{cite(2)}</p>
            <p>site selection still drives efficacy and safety outcomes{cite(1)}</p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              workflow
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              a typical enzymatic conjugation flow
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">1. prepare substrate</p>
                <p>Expose motif or remodel glycan to create a handle. {cite(3)}{cite(4)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">2. enzymatic ligation</p>
                <p>Apply MTGase, sortase, or glyco‑enzymes. {cite(3)}{cite(5)}{cite(6)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">3. polish &amp; analyze</p>
                <p>Purify and confirm DAR, stability, and activity. {cite(2)}{cite(7)}</p>
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
