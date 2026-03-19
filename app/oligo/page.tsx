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
      "Aptamer‑Drug Conjugates: Therapeutic and Diagnostic Applications (Cancers, 2018) — CC BY",
    href: "https://www.mdpi.com/2072-6694/10/1/9",
  },
  {
    id: 2,
    label:
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of siRNA Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00802",
  },
  {
    id: 3,
    label:
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of PMO Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00803",
  },
  {
    id: 4,
    label:
      "Chemistry, Structure, and Function of Approved Oligonucleotide Therapeutics (Nucleic Acids Research, 2023)",
    href: "https://academic.oup.com/nar/article/51/6/2529/7047002",
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
    title: "siRNA conjugates",
    desc: "silence gene expression via RNA interference with targeted delivery.",
  },
  {
    title: "PMO conjugates",
    desc: "morpholino oligomers that modulate splicing or translation.",
  },
  {
    title: "ASO conjugates",
    desc: "antisense oligonucleotides that bind RNA to block or degrade transcripts.",
  },
];

export default function OligoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="oligo" />

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
            oligonucleotide conjugates
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            targeted delivery for gene silencing and splicing
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            Oligonucleotide conjugates pair siRNA, PMO, or ASO therapies with
            targeting ligands or antibodies to improve delivery, potency, and
            tissue specificity.
            {cite(2)}
            {cite(4)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href="/oligo/sirna" radius="full" className="bg-sky-600 text-white">
              siRNA page
            </Button>
            <Button
              as={Link}
              href="/oligo/pmo"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              PMO page
            </Button>
            <Button
              as={Link}
              href="/oligo/aso"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              ASO page
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
          <MoleculeCard label="siRNA duplex" variant="oligo" />
          <MoleculeCard label="PMO chain" variant="oligo" />
          <MoleculeCard label="ASO strand" variant="oligo" />
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              cc‑by diagram
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              aptamer‑drug conjugate schematic
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <Image
              src="/images/ccby/aoc-aptamer-drug-mdpi.png"
              alt="Aptamer–drug conjugate schematic (CC BY)"
              className="w-full rounded-xl border border-white/70 bg-white/60 p-3"
            />
            <p className="text-xs text-zinc-500">
              CC‑BY figure from MDPI Cancers. {cite(1)}
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
