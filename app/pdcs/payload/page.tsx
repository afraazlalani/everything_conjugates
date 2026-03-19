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

export default function PdcPayloadPage() {
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
            payload
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            payloads define therapeutic intent
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            PDC payloads are chosen for potency and compatibility with peptide
            delivery and linker chemistry.
            {cite(1)}
            {cite(2)}
          </p>
        </motion.section>

        <MoleculeCard label="therapeutic payload" variant="payload" />

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              chart
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              payload classes at a glance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 text-sm text-zinc-600">
            {[
              { label: "cytotoxics", value: 80 },
              { label: "imaging/theranostic", value: 55 },
              { label: "immunomodulatory", value: 35 },
            ].map((item) => (
              <div key={item.label} className="grid gap-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-zinc-500">
              Illustrative distribution only; exact mix depends on program and indication.
              {cite(1)}
              {cite(2)}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              payload classes
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              common options
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>cytotoxics for targeted cell killing{cite(1)}{cite(2)}</p>
            <p>radionuclides or imaging agents for diagnostics and theranostics{cite(1)}{cite(3)}</p>
            <p>anti‑inflammatory or immunomodulatory payloads in non‑oncology settings{cite(1)}{cite(3)}</p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              selection criteria
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what makes a good payload
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Potency matters because payload delivery is limited by receptor density and
              internalization; high‑potency agents can deliver efficacy at low copy number.
              {cite(1)}
              {cite(2)}
            </p>
            <p>
              Hydrophobicity and charge affect solubility and PK; linker and peptide
              choices often compensate to maintain stability and exposure.
              {cite(1)}
              {cite(3)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              release logic
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              matching payload to linker
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <p>
              Payloads that require intracellular action benefit from cleavable linkers,
              while extracellular targets can use non‑cleavable strategies.
              {cite(1)}
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
