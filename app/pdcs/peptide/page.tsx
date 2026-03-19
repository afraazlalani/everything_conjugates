"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
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
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function PdcPeptidePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="pdc" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
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

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            peptide moiety
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            peptides set the targeting address
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            In PDCs, the peptide serves as the targeting element, binding a receptor
            or cell surface marker to guide the payload into the desired tissue.
            {cite(1)}
            {cite(2)}
          </p>
        </motion.section>

        <MoleculeCard label="targeting peptide" variant="peptide" />

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              visual
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              peptide–receptor engagement
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <svg className="w-full" viewBox="0 0 900 180" fill="none">
              <rect x="40" y="50" width="220" height="90" rx="18" fill="#e0f2fe" />
              <text x="70" y="90" fontSize="16" fill="#0f172a">cell surface</text>
              <text x="70" y="114" fontSize="12" fill="#334155">receptor target</text>
              <rect x="300" y="65" width="180" height="60" rx="30" fill="#f1f5f9" stroke="#0f172a" />
              <text x="330" y="100" fontSize="14" fill="#0f172a">peptide ligand</text>
              <path d="M480 95H600" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="620" y="55" width="220" height="80" rx="16" fill="#f5f3ff" />
              <text x="650" y="90" fontSize="16" fill="#0f172a">internalization</text>
              <text x="650" y="114" fontSize="12" fill="#334155">endocytosis</text>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#0f172a" />
                </marker>
              </defs>
            </svg>
            <p>
              Short targeting peptides bind receptors and trigger uptake, which is the
              main entry path for many PDCs.
              {cite(1)}
              {cite(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              design levers
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what teams optimize
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Peptides can be engineered as receptor‑targeting ligands (CTPs) or
              cell‑penetrating peptides (CPPs), depending on the desired uptake route.
              {cite(1)}
              {cite(2)}
            </p>
            <p>
              Sequence length, charge, and hydrophobicity control affinity, internalization,
              and biodistribution, so optimization is usually multi‑parameter.
              {cite(2)}
              {cite(3)}
            </p>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">common examples</p>
              <p>
                Reviews highlight motifs such as RGD‑type peptides and somatostatin
                analogs as frequent targeting ligands in PDC studies.
                {cite(2)}
                {cite(3)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              stability
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              keeping peptides intact in vivo
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "cyclization", note: "locks conformation" },
                { label: "D‑amino acids", note: "protease resistance" },
                { label: "PEGylation", note: "half‑life extension" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/70 bg-white/60 p-4">
                  <p className="font-semibold text-zinc-800">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.note}</p>
                </div>
              ))}
            </div>
            <p>
              Protease susceptibility is a key limitation, so PDC peptides are often
              stabilized through cyclization, stapling, and incorporation of D‑amino acids.
              {cite(2)}
              {cite(3)}
            </p>
            <p>
              PEGylation or lipid/albumin‑binding motifs can extend circulation time when
              rapid renal clearance becomes limiting.
              {cite(2)}
              {cite(3)}
            </p>
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
