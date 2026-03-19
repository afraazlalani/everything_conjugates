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

export default function PdcLinkerPage() {
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
            linker
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            linkers balance stability and release
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            PDC linkers are engineered to keep payloads stable in circulation while
            releasing them at the target site through enzymatic or chemical triggers.
            {cite(1)}
            {cite(2)}
          </p>
        </motion.section>

        <MoleculeCard label="cleavable linker" variant="linker" />

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              diagram
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              linker decision map
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <svg className="w-full" viewBox="0 0 920 180" fill="none">
              <rect x="30" y="50" width="200" height="80" rx="16" fill="#e0f2fe" />
              <text x="55" y="85" fontSize="16" fill="#0f172a">target site?</text>
              <text x="55" y="110" fontSize="12" fill="#334155">intra vs extra</text>
              <path d="M230 90H320" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="340" y="25" width="240" height="60" rx="16" fill="#f5f3ff" />
              <text x="365" y="60" fontSize="14" fill="#0f172a">cleavable linker</text>
              <rect x="340" y="95" width="240" height="60" rx="16" fill="#e0e7ff" />
              <text x="365" y="130" fontSize="14" fill="#0f172a">non‑cleavable</text>
              <path d="M580 55H680" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
              <path d="M580 125H680" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
              <rect x="700" y="25" width="190" height="60" rx="16" fill="#ecfeff" />
              <text x="720" y="60" fontSize="14" fill="#0f172a">enzymatic/pH</text>
              <rect x="700" y="95" width="190" height="60" rx="16" fill="#f1f5f9" />
              <text x="720" y="130" fontSize="14" fill="#0f172a">proteolysis‑release</text>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#0f172a" />
                </marker>
              </defs>
            </svg>
            <p>
              Linker choice is driven by where and how you want payload release.
              {cite(1)}
              {cite(2)}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              design notes
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what matters most
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Stability in plasma helps avoid off‑target release, while cleavage efficiency
              inside target cells supports potency.
              {cite(1)}
              {cite(3)}
            </p>
            <p>
              Linker choice is coordinated with peptide uptake kinetics and payload
              mechanism of action.
              {cite(1)}
              {cite(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              linker families
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              cleavable vs non‑cleavable
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600 sm:grid-cols-2">
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">enzymatic</p>
              <p>
                Cathepsin‑ and legumain‑cleavable peptides are common triggers for
                intracellular release.
                {cite(1)}
                {cite(2)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">pH‑sensitive</p>
              <p>
                Hydrazone‑type linkers release payloads in acidic compartments.
                {cite(1)}
                {cite(3)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">reductive</p>
              <p>
                Disulfide linkers respond to intracellular reducing environments.
                {cite(1)}
                {cite(2)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/60 p-4">
              <p className="font-semibold text-zinc-800">non‑cleavable</p>
              <p>
                Non‑cleavable linkers rely on proteolysis of the carrier to liberate
                active payload fragments.
                {cite(1)}
                {cite(3)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              self‑immolative spacers
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              getting the payload out cleanly
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Self‑immolative spacers such as PABC are used to ensure efficient payload
              release after enzymatic cleavage.
              {cite(1)}
              {cite(2)}
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
