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
      "Site-selective modification strategies in antibody–drug conjugates (Chem. Soc. Rev., 2021)",
    href: "https://pubs.rsc.org/en/content/articlehtml/2021/cs/d0cs00310g",
  },
  {
    id: 4,
    label:
      "Site-Specific Antibody Conjugation to Engineered Double Cysteine Residues (Pharmaceuticals, 2021)",
    href: "https://www.mdpi.com/1424-8247/14/7/672",
  },
  {
    id: 5,
    label:
      "Formylglycine-generating enzyme enables aldehyde tags for site-specific conjugation (BMC Biotechnol., 2016)",
    href: "https://bmcbiotechnol.biomedcentral.com/articles/10.1186/s12896-016-0254-0",
  },
  {
    id: 6,
    label:
      "Glycan remodeling for site-specific Fc conjugation (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article-abstract/7/3/233/7710329",
  },
  {
    id: 7,
    label:
      "Improved Sortase A variants for site-specific antibody conjugation (Sci. Reports, 2016)",
    href: "https://www.nature.com/articles/srep31899",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function SiteSpecificChemistryPage() {
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
            site-specific cysteine
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            engineered cysteine conjugation
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            Site-specific strategies introduce engineered cysteines to control DAR
            and improve homogeneity, giving tighter pharmacokinetic and safety profiles.
            {cite(2)}
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              why this exists
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              from heterogeneous to defined conjugates
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Random conjugation can yield heterogeneous mixtures; site‑selective approaches
              were developed to control attachment sites and DAR, improving homogeneity.
              {cite(3)}
            </p>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">core promise</p>
              <p>
                Defined sites enable tighter characterization, more consistent batches, and
                clearer structure–activity relationships.
                {cite(2)}
                {cite(3)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              approach map
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              four proven site‑specific strategies
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">engineered cysteines</p>
              <p>
                Introduce defined cysteines (e.g., Fc positions) to produce homogeneous
                conjugates; DAR 2 is common, higher DAR variants are possible.
                {cite(4)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">aldehyde tags (fGly)</p>
              <p>
                Formylglycine‑generating enzyme installs an aldehyde handle at a specific
                motif for selective ligation chemistry.
                {cite(5)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">Fc glycan remodeling</p>
              <p>
                EndoS2 trimming and GalT‑based azide installation enable click chemistry at
                the conserved Fc glycan.
                {cite(6)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">enzyme tags (sortase)</p>
              <p>
                Sortase A recognizes LPXTG motifs and couples to oligoglycine tags for
                site‑specific ligation.
                {cite(7)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              design levers
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how to choose a site‑specific route
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Choose sites that preserve antigen binding and Fc functions while minimizing
              structural disruption.
              {cite(2)}
              {cite(3)}
            </p>
            <p>
              Consider payload potency: DAR 2 is often sufficient for highly potent
              cytotoxins, while other payloads may demand higher DAR.
              {cite(4)}
            </p>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">scale &amp; complexity</p>
              <p>
                Engineered‑cysteine and enzymatic methods add manufacturing steps but yield
                more defined products than random conjugation.
                {cite(2)}
                {cite(3)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              benefits
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              why it matters
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <p>narrower DAR distribution and reproducible batches{cite(2)}</p>
            <p>improved stability compared with random cysteine methods{cite(1)}</p>
            <p>reduced aggregation and better tolerability in many cases{cite(1)}</p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              limitations
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what to watch
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <p>requires antibody engineering and extra manufacturing steps{cite(2)}</p>
            <p>site selection must preserve binding and stability{cite(1)}</p>
            <p>still needs linker/payload tuning for optimal behavior{cite(1)}</p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              workflow
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              a typical site‑specific development flow
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">1. pick site</p>
                <p>Select a site with minimal impact on function. {cite(2)}{cite(3)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">2. build handle</p>
                <p>Engineer cysteine or install enzymatic tag. {cite(4)}{cite(5)}{cite(7)}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-4">
                <p className="font-semibold text-zinc-800">3. conjugate &amp; test</p>
                <p>Attach linker‑payload and assess DAR, stability, PK. {cite(2)}{cite(3)}</p>
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
