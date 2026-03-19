"use client";

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
} from "@heroui/react";
import { motion } from "framer-motion";
import { MoleculeCard } from "@/components/MoleculeCard";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";

const references = [
  {
    id: 1,
    label:
      "Peptide‑Drug Conjugates: Design, Chemistry, and Drug Delivery System as a Novel Cancer Theranostic (ACS Pharmacol. Transl. Sci., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acsptsci.3c00269",
  },
  {
    id: 2,
    label:
      "Peptides as a platform for targeted therapeutics for cancer: PDCs (Chem. Soc. Rev., 2021) — CC BY 3.0",
    href: "https://pubs.rsc.org/en/Content/ArticleLanding/2021/CS/D0CS00556H",
  },
  {
    id: 3,
    label:
      "Peptide‑drug conjugates: A new paradigm for targeted cancer therapy (Eur. J. Med. Chem., 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38194773/",
  },
  {
    id: 4,
    label:
      "Peptide–Drug Conjugates: An Emerging Direction for the Next Generation of Peptide Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/abs/10.1021/acs.jmedchem.3c01835",
  },
  {
    id: 5,
    label:
      "Peptide–drug conjugates for targeted cancer therapy (Beilstein J. Org. Chem., 2018) — CC BY",
    href: "https://www.beilstein-journals.org/bjoc/articles/14/80",
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
    title: "peptide targeting moiety",
    desc: "short peptides that bind receptors or penetrate cells to guide delivery.",
  },
  {
    title: "linker",
    desc: "stability in blood with controlled payload release at the target site.",
  },
  {
    title: "payload",
    desc: "cytotoxic or imaging agents selected for potency at low doses.",
  },
];

export default function PdcsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="pdc" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="text-sm text-sky-700">
            back to home
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
            peptide-drug conjugates (pdcs)
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            peptide-guided delivery with compact size
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            PDCs use short targeting peptides to carry potent payloads with smaller
            size and faster tissue penetration than antibodies. Their design pivots
            around peptide selection, linker stability, and payload potency.
            {cite(1)}
            {cite(2)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href="/pdcs/peptide" radius="full" className="bg-sky-600 text-white">
              peptide page
            </Button>
            <Button
              as={Link}
              href="/pdcs/linker"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              linker page
            </Button>
            <Button
              as={Link}
              href="/pdcs/payload"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              payload page
            </Button>
          </div>
        </motion.section>

        <section className="grid gap-6 md:grid-cols-3">
          {parts.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600">{item.desc}</p>
              </CardBody>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MoleculeCard label="targeting peptide" variant="peptide" />
          <MoleculeCard label="cleavable linker" variant="linker" />
          <MoleculeCard label="cytotoxic payload" variant="payload" />
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              cc‑by diagram
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              PDC architecture snapshot
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <Image
              src="/images/ccby/pdc-schematic-bjoc.png"
              alt="Peptide–drug conjugate schematic (CC BY)"
              className="w-full rounded-xl border border-white/70 bg-white/60 p-3"
            />
            <p className="text-xs text-zinc-500">
              CC‑BY figure from Beilstein J. Org. Chem. {cite(5)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              mechanism
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how a PDC delivers its payload
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <svg className="w-full" viewBox="0 0 900 150" fill="none">
                <rect x="20" y="25" width="200" height="80" rx="16" fill="#e0f2fe" />
                <text x="46" y="55" fontSize="16" fill="#0f172a">1. bind receptor</text>
                <text x="46" y="78" fontSize="12" fill="#334155">targeted peptide</text>
                <rect x="260" y="25" width="200" height="80" rx="16" fill="#e0e7ff" />
                <text x="292" y="55" fontSize="16" fill="#0f172a">2. internalize</text>
                <text x="292" y="78" fontSize="12" fill="#334155">endocytosis</text>
                <rect x="500" y="25" width="200" height="80" rx="16" fill="#f5f3ff" />
                <text x="526" y="55" fontSize="16" fill="#0f172a">3. release</text>
                <text x="526" y="78" fontSize="12" fill="#334155">cleavable linker</text>
                <rect x="740" y="25" width="140" height="80" rx="16" fill="#ecfeff" />
                <text x="760" y="55" fontSize="16" fill="#0f172a">4. effect</text>
                <text x="760" y="78" fontSize="12" fill="#334155">payload action</text>
                <path d="M220 65H250" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M460 65H490" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M700 65H730" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#0f172a" />
                  </marker>
                </defs>
              </svg>
              <p className="mt-2">
                PDCs combine receptor targeting, internalization, and linker‑controlled
                payload release to achieve selective activity.
                {cite(1)}
                {cite(2)}
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
              what governs PDC performance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600 sm:grid-cols-2">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">peptide selection</p>
              <p>
                Targeting peptides (CTPs) and cell‑penetrating peptides (CPPs) are selected
                for receptor affinity, internalization, and stability in circulation.
                {cite(1)}
                {cite(2)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">stability tuning</p>
              <p>
                Cyclization, stapling, D‑amino acids, and PEGylation are used to improve
                protease resistance and half‑life.
                {cite(2)}
                {cite(3)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">linker strategy</p>
              <p>
                Cleavable (enzymatic, pH‑sensitive, reductive) and non‑cleavable linkers
                balance stability with on‑target release.
                {cite(1)}
                {cite(3)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">payload choice</p>
              <p>
                Payloads are selected for potency and mechanism; cytotoxins and imaging
                agents are both common in PDC development.
                {cite(1)}
                {cite(4)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              pharmacology
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              PK/PD themes for PDCs
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              PDCs are smaller than antibodies, enabling faster tissue penetration but
              also faster renal clearance unless half‑life extension strategies are used.
              {cite(2)}
              {cite(3)}
            </p>
            <p>
              Balancing systemic stability with efficient release is critical for
              therapeutic index.
              {cite(1)}
              {cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              limitations
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              common challenges
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-2 text-sm text-zinc-600">
            <p>proteolysis and short circulation time without stabilization{cite(2)}{cite(3)}</p>
            <p>off‑target uptake if receptor specificity is weak{cite(1)}{cite(3)}</p>
            <p>linker instability or premature release in plasma{cite(1)}{cite(4)}</p>
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
