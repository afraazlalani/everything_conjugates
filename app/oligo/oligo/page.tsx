"use client";

import {
  Button,
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
import { OligoSectionTabs } from "@/components/OligoSectionTabs";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const oligoRows = [
  {
    title: "siRNA",
    mechanism: "RNA interference through RISC loading and catalytic mRNA cleavage",
    backbone: "short double-stranded RNA duplex with heavy terminal and 2′ modification patterns",
    strengths: "strong knockdown when cytosolic delivery works",
    tradeoffs: "endosomal escape and productive duplex handling are major bottlenecks",
    bestFit: "when the biology really benefits from transcript knockdown rather than splice correction or steric blocking",
    conjugationNeed: "protect duplex integrity, bias uptake into the right cells, and still allow guide-strand loading into RISC",
    watchout: "a conjugate can enter cells well and still underperform if very little duplex reaches the cytosol productively",
    href: "/oligo/oligo/sirna",
  },
  {
    title: "PMO",
    mechanism: "steric block and splice switching without RNase H recruitment",
    backbone: "charge-neutral phosphorodiamidate morpholino scaffold",
    strengths: "excellent stability and strong fit for exon-skipping logic",
    tradeoffs: "delivery support is usually essential",
    bestFit: "when the goal is splice correction, exon skipping, or another steric-block mechanism rather than RNA degradation",
    conjugationNeed: "improve tissue uptake and help enough PMO reach the nucleus or other productive splice-setting compartment",
    watchout: "chemical stability is already strong, so most failures come from poor delivery and trafficking rather than backbone breakdown",
    href: "/oligo/oligo/pmo",
  },
  {
    title: "ASO",
    mechanism: "RNase H knockdown or steric antisense modulation depending on architecture",
    backbone: "single-stranded scaffold often built around phosphorothioate and 2′ modifications",
    strengths: "very flexible medicinal-chemistry and mechanism toolkit",
    tradeoffs: "chemistry strongly affects protein binding, distribution, and tolerability",
    bestFit: "when a single-stranded scaffold is preferred and the program needs either gapmer knockdown or splice/translation modulation",
    conjugationNeed: "improve tissue selectivity without breaking the protein-binding and biodistribution profile the ASO chemistry is already creating",
    watchout: "ASO performance often changes with chemistry as much as with sequence, so conjugation can shift PK and tolerability in non-obvious ways",
    href: "/oligo/oligo/aso",
  },
];

const overviewRows = [
  {
    title: "what oligos are",
    text: "Oligonucleotides are sequence-defined nucleic-acid drugs. instead of relying on a small-molecule pharmacophore, they use base pairing and scaffold chemistry to recognize RNA or alter how RNA is processed.",
  },
  {
    title: "how they are used",
    text: "Depending on scaffold, they can cut RNA, recruit RNase H, block translation, or redirect splicing. that means the same delivery platform can produce very different biology just by swapping the oligo class.",
  },
  {
    title: "why they can beat small-molecule payloads",
    text: "They are programmable at the sequence level, can address transcripts that are hard to drug with classical chemistry, and can deliver knockdown or splice correction without needing cytotoxic killing.",
  },
  {
    title: "where they are harder than small molecules",
    text: "They are larger, more polarity-driven, more trafficking-sensitive, and often need much more delivery engineering than a diffusible small-molecule payload.",
  },
];

const versusSmallMoleculeRows = [
  {
    title: "mechanism precision",
    oligo: "base-pairing can make the mechanism transcript-specific",
    smallMolecule: "activity usually comes from a broader binding pharmacophore rather than sequence recognition",
  },
  {
    title: "need for productive trafficking",
    oligo: "delivery has to reach cytosol or nucleus in the right molecular form",
    smallMolecule: "many payloads remain active after lysosomal release or passive diffusion",
  },
  {
    title: "what counts as success",
    oligo: "gene silencing, splice correction, or steric modulation inside the target cell",
    smallMolecule: "direct biochemical inhibition or cytotoxicity from the released warhead",
  },
  {
    title: "main downside",
    oligo: "uptake and intracellular routing often dominate failure",
    smallMolecule: "off-target killing or narrow safety margin often dominates failure",
  },
];

const references = [
  {
    id: 1,
    label:
      "Chemistry, Structure, and Function of Approved Oligonucleotide Therapeutics (Nucleic Acids Research, 2023)",
    href: "https://academic.oup.com/nar/article/51/6/2529/7047002",
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
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function OligoCargoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="oligo" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/oligo" className="text-sm text-sky-700">
            oligo overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
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
            oligo
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            the oligonucleotide cargo decides the mechanism
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            This branch is the oligo-side equivalent of the payload chapter in adc.
            Once the targeting module and linker are chosen, the cargo scaffold changes
            the actual biology: siRNA drives RNAi, PMO drives steric splice switching,
            and ASO programs can split into RNase H or steric designs.{cite(1)}{cite(2)}{cite(3)}
          </p>
          <OligoSectionTabs active="oligo" />
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href="/oligo/oligo/sirna" radius="full" className="bg-sky-600 text-white">
              siRNA
            </Button>
            <Button as={Link} href="/oligo/oligo/pmo" radius="full" variant="bordered" className="border-sky-200 text-sky-700">
              PMO
            </Button>
            <Button as={Link} href="/oligo/oligo/aso" radius="full" variant="bordered" className="border-sky-200 text-sky-700">
              ASO
            </Button>
          </div>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-3">
          <MoleculeCard label="siRNA duplex" variant="oligo" />
          <MoleculeCard label="PMO chain" variant="oligo" />
          <MoleculeCard label="ASO strand" variant="oligo" />
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {overviewRows.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                  {item.text}
                  {cite(1)}
                  {cite(2)}
                  {cite(3)}
                </p>
              </CardBody>
            </Card>
          ))}
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              versus small molecules
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              why oligo cargo is not a classical payload
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2">
            {versusSmallMoleculeRows.map((row) => (
              <div key={row.title} className="rounded-[1rem] border border-white/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <p className="text-base font-semibold text-zinc-900">{row.title}</p>
                <p className="mt-3 text-xs leading-6 text-zinc-600">
                  <span className="font-semibold text-zinc-800">oligo cargo:</span> {row.oligo}
                </p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  <span className="font-semibold text-zinc-800">small-molecule payload:</span> {row.smallMolecule}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              cargo logic
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how the three main oligo classes differ
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="Comparison of siRNA, PMO, and ASO cargo logic">
              <svg className="zoom-graphic h-[27rem] w-full" viewBox="0 0 1180 470" fill="none">
                <rect x="20" y="24" width="1140" height="422" rx="28" fill="#f8fbff" stroke="#dbeafe" strokeWidth="2" />

                <rect x="66" y="74" width="316" height="318" rx="24" fill="#eff6ff" stroke="#7dd3fc" strokeWidth="2.5" />
                <rect x="432" y="74" width="316" height="318" rx="24" fill="#f0fdf4" stroke="#4ade80" strokeWidth="2.5" />
                <rect x="798" y="74" width="316" height="318" rx="24" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2.5" />

                <text x="224" y="116" textAnchor="middle" fontSize="30" fontWeight="700" fill="#0f172a">siRNA</text>
                <text x="224" y="146" textAnchor="middle" fontSize="16" fill="#0369a1">double-stranded RNA duplex</text>
                <text x="96" y="190" fontSize="17" fontWeight="700" fill="#0f172a">where it acts</text>
                <text x="96" y="214" fontSize="15" fill="#475569">cytosol</text>
                <text x="96" y="248" fontSize="17" fontWeight="700" fill="#0f172a">main mechanism</text>
                <text x="96" y="272" fontSize="15" fill="#475569">RISC loading and mRNA cleavage</text>
                <text x="96" y="306" fontSize="17" fontWeight="700" fill="#0f172a">main delivery problem</text>
                <text x="96" y="330" fontSize="15" fill="#475569">productive endosomal escape</text>

                <text x="590" y="116" textAnchor="middle" fontSize="30" fontWeight="700" fill="#166534">PMO</text>
                <text x="590" y="146" textAnchor="middle" fontSize="16" fill="#166534">charge-neutral morpholino</text>
                <text x="462" y="190" fontSize="17" fontWeight="700" fill="#0f172a">where it acts</text>
                <text x="462" y="214" fontSize="15" fill="#475569">often nucleus</text>
                <text x="462" y="248" fontSize="17" fontWeight="700" fill="#0f172a">main mechanism</text>
                <text x="462" y="272" fontSize="15" fill="#475569">steric splice switching / exon skipping</text>
                <text x="462" y="306" fontSize="17" fontWeight="700" fill="#0f172a">main delivery problem</text>
                <text x="462" y="330" fontSize="15" fill="#475569">tissue uptake plus nuclear access</text>

                <text x="956" y="116" textAnchor="middle" fontSize="30" fontWeight="700" fill="#92400e">ASO</text>
                <text x="956" y="146" textAnchor="middle" fontSize="16" fill="#92400e">single-stranded antisense oligo</text>
                <text x="828" y="190" fontSize="17" fontWeight="700" fill="#0f172a">where it acts</text>
                <text x="828" y="214" fontSize="15" fill="#475569">
                  cytosol or nucleus,
                </text>
                <text x="828" y="236" fontSize="15" fill="#475569">
                  depending on design
                </text>
                <text x="828" y="270" fontSize="17" fontWeight="700" fill="#0f172a">main mechanism</text>
                <text x="828" y="294" fontSize="15" fill="#475569">RNase H knockdown or steric modulation</text>
                <text x="828" y="328" fontSize="17" fontWeight="700" fill="#0f172a">main delivery problem</text>
                <text x="828" y="352" fontSize="15" fill="#475569">routing plus chemistry-dependent PK</text>
              </svg>
            </ZoomableFigure>
            <p className="text-xs leading-6 text-zinc-500">
              The same targeting module and linker can behave very differently depending on the
              oligo class, because each cargo changes the productive compartment, mechanism, and
              dominant delivery bottleneck.{cite(1)}{cite(2)}{cite(3)}
            </p>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {oligoRows.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80 h-full">
              <CardHeader className="flex flex-col items-start gap-2">
                <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                  {item.title}
                </p>
                <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                  when teams pick it
                </h2>
              </CardHeader>
              <Divider />
              <CardBody className="grid gap-3 text-sm text-zinc-600">
                <p><span className="font-semibold text-zinc-900">best fit:</span> {item.bestFit}</p>
                <p><span className="font-semibold text-zinc-900">what conjugation has to preserve:</span> {item.conjugationNeed}</p>
                <p><span className="font-semibold text-zinc-900">watchout:</span> {item.watchout}</p>
                <Link href={item.href} className="pt-1 text-sm font-medium text-sky-700">
                  open {item.title} page
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>

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
