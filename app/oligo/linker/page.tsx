"use client";

import Image from "next/image";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Link,
  Navbar,
  NavbarBrand,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { motion } from "framer-motion";
import { StructureCard } from "@/components/StructureCard";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { OligoSectionTabs } from "@/components/OligoSectionTabs";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const responsibilities = [
  {
    title: "Preserve oligo function",
    text: "The connector cannot block hybridization, RISC loading, or splice-switching behavior after delivery.",
  },
  {
    title: "Manage spacing and sterics",
    text: "A spacer often keeps a bulky targeting module from crowding the oligo or its receptor-binding geometry.",
  },
  {
    title: "Tune release or catabolism",
    text: "Some systems want a stable attachment all the way through action, while others benefit from intracellular cleavage or carrier removal.",
  },
  {
    title: "Control valency and architecture",
    text: "Linker design helps determine how many oligos attach, where they attach, and what shape the whole conjugate presents to cells and proteins.",
  },
];

const linkerClasses = [
  {
    className: "stable amide, thioether, or other non-cleavable attachment",
    role: "Keeps targeting module and oligo connected through uptake and intracellular trafficking",
    strengths: "simple architecture and predictable stoichiometry when the intact conjugate is meant to stay together",
    tradeoffs: "the attached module can still sterically interfere if spacing is too tight",
  },
  {
    className: "reducible or disulfide-based linker",
    role: "Allows conditional intracellular cleavage in more reducing environments",
    strengths: "can help release the oligo from a bulky carrier after uptake",
    tradeoffs: "premature cleavage or mixed catabolites can complicate exposure and interpretation",
  },
  {
    className: "enzyme-sensitive or self-immolative linker",
    role: "Uses intracellular processing to detach or unmask the oligo cargo",
    strengths: "can be useful when carrier removal improves activity",
    tradeoffs: "biological performance becomes dependent on the right intracellular processing path",
  },
  {
    className: "click-derived or handle-based conjugation linkers",
    role: "Use azide, alkyne, maleimide, thiol, or amino handles to connect defined sites on carrier and oligo",
    strengths: "can support cleaner site-selective assembly and modular synthesis",
    tradeoffs: "the handle and spacer themselves can change polarity, sterics, and catabolism",
  },
  {
    className: "spacer-heavy architectures",
    role: "Use PEG-like or other spacing elements to separate receptor binder from oligo",
    strengths: "can reduce steric crowding and improve receptor access or oligo function",
    tradeoffs: "extra mass and polarity can alter PK, uptake, and manufacturability",
  },
];

const releaseQuestions = [
  {
    title: "Does the oligo need to separate from the carrier?",
    text: "Some constructs work fine while still attached, but others perform better once the oligo is no longer physically constrained by the targeting module.",
  },
  {
    title: "Where should cleavage happen?",
    text: "The useful trigger might be extracellularly never, intracellularly after uptake, or only after a specific catabolic pathway is reached.",
  },
  {
    title: "What species is really active?",
    text: "The biologically relevant entity may be the intact conjugate, a partially processed catabolite, or a released free oligo depending on the design.",
  },
];

const attachmentRows = [
  {
    title: "siRNA attachment logic",
    site: "usually a terminal position on the passenger / sense strand, often with the guide strand left as undisturbed as possible",
    why: "the antisense guide strand still has to be recognized by Argonaute and retained during RISC loading, so teams often push bulky conjugation away from the strand that drives target recognition",
  },
  {
    title: "ASO attachment logic",
    site: "commonly a 5′ or 3′ terminal handle, or another position chosen to avoid disrupting hybridization and any gapmer geometry needed for RNase H recruitment",
    why: "ASOs are single-stranded, so conjugation can shift protein binding, affinity, and biodistribution quickly; terminal placement is often the safest way to preserve the antisense pharmacology",
  },
  {
    title: "PMO attachment logic",
    site: "often a terminal attachment on the morpholino sequence rather than an internal site",
    why: "PMOs act by steric blocking, so the recognition surface along the sequence needs to stay open enough to engage pre-mRNA and redirect splicing without a bulky carrier sitting in the middle",
  },
];

const carrierSideRows = [
  {
    title: "Carrier-side attachment still matters",
    text: "On the targeting-module side, attachment site can change receptor binding, Fc biology, valency, and the geometry the oligo sees after uptake. the linker is therefore solving both the protein side and the oligo side at once.",
  },
  {
    title: "Site choice is part of potency",
    text: "Two constructs with the same oligo sequence can behave differently if one attachment site preserves uptake and intracellular handoff while another crowds the binder or changes receptor clustering.",
  },
];

const structureExamples = [
  {
    title: "SMCC / maleimide handle",
    subtitle: "Non-cleavable conjugation motif",
    smilesName: "SMCC",
    note: "Representative handle used for stable thioether-style protein conjugation.",
  },
  {
    title: "NHS ester handle",
    subtitle: "Amine-reactive attachment motif",
    smiles: "CC(=O)ON1C(=O)CCC1=O",
    note: "Representative activated ester logic used to connect linker modules to amino-containing partners.",
  },
  {
    title: "Disulfide linker motif",
    subtitle: "Reducible release class",
    smilesName: "dipropyl disulfide",
    note: "Representative reducible linker logic when intracellular cleavage is desired.",
  },
  {
    title: "Hydrazone motif",
    subtitle: "Acid-sensitive linker class",
    smilesName: "benzaldehyde hydrazone",
    note: "Representative acid-labile motif for pH-responsive release concepts.",
  },
  {
    title: "Alkyne handle",
    subtitle: "Click-ready attachment motif",
    smiles: "CC#C",
    pubchemQuery: "propyne",
    note: "Minimal terminal alkyne logic representing copper-free or click-derived assembly strategies.",
  },
  {
    title: "PEG-like spacer logic",
    subtitle: "Spacing and steric relief",
    smiles: "OCCOCCOCCOCCO",
    note: "Simple ethylene-glycol spacer motif representing PEG-style spacing elements.",
  },
  {
    title: "Azide handle",
    subtitle: "Click-ready attachment motif",
    smiles: "N=[N+]=[N-]",
    formulaDisplay: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-5 text-[2.35rem] font-semibold tracking-tight text-sky-500">
          <span>N</span>
          <span className="text-slate-400">=</span>
          <span className="inline-flex">
            N<span className="translate-y-[-0.55rem] text-lg">+</span>
          </span>
          <span className="text-slate-400">=</span>
          <span className="inline-flex">
            N<span className="translate-y-[-0.55rem] text-lg">-</span>
          </span>
        </div>
        <div className="rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-sky-700">
          compact click handle
        </div>
      </div>
    ),
    note: "Minimal azide handle representing click-derived conjugation logic.",
  },
  {
    title: "Maleimide ring",
    subtitle: "Thiol-reactive motif",
    smiles: "O=C1NC(=O)C=CC1=O",
    pubchemQuery: "maleimide",
    note: "Representative maleimide core used in thiol-directed conjugation strategies.",
  },
];

const references = [
  {
    id: 1,
    label:
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of siRNA Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00802",
  },
  {
    id: 2,
    label:
      "Antibody–Oligonucleotide Conjugates (AOCs) for Targeted Delivery of PMO Therapeutics (J. Med. Chem., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.jmedchem.4c00803",
  },
  {
    id: 3,
    label:
      "Chemistry, Structure, and Function of Approved Oligonucleotide Therapeutics (Nucleic Acids Research, 2023)",
    href: "https://academic.oup.com/nar/article/51/6/2529/7047002",
  },
  {
    id: 4,
    label:
      "Bioanalysis of free antisense oligonucleotide payload from antibody-oligonucleotide conjugate by hybridization LC-MS/MS (Bioanalysis, 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/39041663/",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function OligoLinkerPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="linker" />

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
            linker / spacer
          </Chip>
          <h1 className="site-page-title font-semibold">
            oligo linkers are about spacing, release, and routing
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            In oligonucleotide conjugates, the linker is not usually trying to manage
            bystander killing the way an ADC linker does. It is more often trying to
            preserve oligo function, control architecture, and decide whether the
            active species is the intact conjugate or a released oligo payload.{cite(1)}{cite(2)}{cite(4)}
          </p>
          <OligoSectionTabs active="linker" />
        </motion.section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {responsibilities.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">{item.text}{cite(3)}</p>
              </CardBody>
            </Card>
          ))}
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              sourced figure
            </p>
            <h2 className="site-page-heading font-semibold">
              linker design is really architecture plus chemistry
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="Open-source linker and conjugate architecture figures">
              <div className="zoom-graphic grid gap-3 rounded-[1rem] border border-amber-100 bg-[linear-gradient(135deg,#fffdf7_0%,#f8fbff_100%)] p-4">
                <div className="overflow-hidden rounded-[0.95rem] border border-amber-100 bg-white/90 p-3">
                  <svg className="h-auto w-full" viewBox="0 0 1120 450" fill="none">
                    <rect x="26" y="28" width="1068" height="374" rx="32" fill="#fffdfa" stroke="#fde68a" strokeWidth="2.5" />

                    <rect x="78" y="126" width="258" height="90" rx="36" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="4" />
                    <text x="207" y="181" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0369a1">targeting module</text>

                    <path d="M336 171H432" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                    <rect x="432" y="145" width="154" height="54" rx="27" fill="#fff7ed" stroke="#f59e0b" strokeWidth="4" />
                    <text x="509" y="179" textAnchor="middle" fontSize="27" fontWeight="700" fill="#b45309">linker</text>

                    <path d="M586 171H704" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
                    <rect x="704" y="122" width="286" height="100" rx="40" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="4" />
                    <text x="847" y="179" textAnchor="middle" fontSize="28" fontWeight="700" fill="#6b21a8">oligo cargo</text>

                    <path d="M864 138c32-24 74-24 106 0" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
                    <path d="M870 210c28 20 66 20 94 0" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />

                    <circle cx="509" cy="92" r="14" fill="#f59e0b" />
                    <path d="M509 106V145" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 6" />
                    <text x="509" y="64" textAnchor="middle" fontSize="24" fontWeight="700" fill="#92400e">release or stay intact</text>

                    <rect x="88" y="266" width="300" height="46" rx="23" fill="#f8fafc" stroke="#cbd5e1" />
                    <text x="238" y="294" textAnchor="middle" fontSize="15.5" fontWeight="600" fill="#475569">site-selective attachment</text>

                    <rect x="406" y="266" width="264" height="46" rx="23" fill="#f8fafc" stroke="#cbd5e1" />
                    <text x="538" y="294" textAnchor="middle" fontSize="15.5" fontWeight="600" fill="#475569">spacing preserves function</text>

                    <rect x="684" y="266" width="348" height="46" rx="23" fill="#f8fafc" stroke="#cbd5e1" />
                    <text x="858" y="288" textAnchor="middle" fontSize="15" fontWeight="600" fill="#475569">
                      <tspan x="858" dy="0">active species can</tspan>
                      <tspan x="858" dy="18">differ by design</tspan>
                    </text>

                    <rect x="220" y="330" width="332" height="34" rx="17" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="386" y="351" textAnchor="middle" fontSize="13.5" fontWeight="600" fill="#64748b">
                      where you attach can change oligo behavior
                    </text>

                    <rect x="586" y="330" width="364" height="34" rx="17" fill="#ffffff" stroke="#e2e8f0" />
                    <text x="768" y="345" textAnchor="middle" fontSize="13" fontWeight="600" fill="#64748b">
                      <tspan x="768" dy="0">cleavage choice changes which</tspan>
                      <tspan x="768" dy="16">molecular species is active</tspan>
                    </text>
                  </svg>
                </div>
                <div className="overflow-hidden rounded-[0.95rem] border border-amber-100 bg-white/90 p-3">
                  <Image
                    src="https://commons.wikimedia.org/wiki/Special:FilePath/Acyl_hydrazone_linker.svg"
                    alt="Open-source example of an acyl hydrazone linker structure"
                    width={600}
                    height={320}
                    unoptimized
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </ZoomableFigure>
            <p className="leading-7">
              these figures make the linker conversation more concrete. the first
              image is now an oligo-specific architecture view: targeting module on one
              side, oligo cargo on the other, with the linker controlling spacing,
              attachment geometry, and whether the active species stays intact or is
              released after uptake.
            </p>
            <p className="leading-7">
              the second image is one real cleavable linker motif. for oligo
              conjugates, the key question is usually not “can this release a
              toxin?” but “does this attachment preserve uptake, hybridization,
              duplex handling, and the intracellular route the oligo needs?” that
              makes linker choice a geometry and trafficking problem as much as a
              chemistry problem.{cite(1)}{cite(2)}{cite(3)}
            </p>
            <div className="grid gap-1 text-xs leading-6 text-zinc-500">
              <p>
                source 1: custom oligo-specific architecture redraw for this project
              </p>
              <p>
                source 2:{" "}
                <Link
                  href="https://commons.wikimedia.org/wiki/File:Acyl_hydrazone_linker.svg"
                  className="text-sky-700"
                >
                  Wikimedia Commons, Acyl hydrazone linker.svg
                </Link>
                {" "}— public domain
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              representative motifs
            </p>
          <h2 className="site-page-heading font-semibold">
            example linker chemistry we actually talk about
          </h2>
        </CardHeader>
        <Divider />
          <CardBody className="flex flex-col gap-4">
            <p className="text-sm leading-7 text-zinc-600">
              this gallery stays focused on oligo-relevant connector chemistry: attachment handles, reducible or acid-sensitive release motifs, and spacer elements that help preserve uptake and oligo function. cards now also pull live pubchem facts when a clean public match exists. you can scroll sideways through it.
            </p>
            <div className="-mx-1 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-4 px-1">
                {structureExamples.map((item) => (
                  <div key={item.title} className="w-[18rem] shrink-0 snap-start">
                    <StructureCard
                      title={item.title}
                      subtitle={item.subtitle}
                      smilesName={item.smilesName}
                      smiles={item.smiles}
                      pubchemQuery={item.pubchemQuery}
                      formulaDisplay={item.formulaDisplay}
                      note={item.note}
                      category="linker"
                      className="h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
              drag or mouse-scroll sideways to browse more motifs
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              connector logic
            </p>
            <h2 className="site-page-heading font-semibold">
              what the linker is solving in an oligo conjugate
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="Oligonucleotide linker logic">
              <div className="zoom-graphic rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-6 shadow-[0_10px_40px_rgba(14,165,233,0.06)]">
                <div className="grid gap-5">
                  <div className="grid gap-3 xl:grid-cols-[1.35fr_auto_1.05fr_auto_1.35fr_auto_1fr] xl:items-center">
                    <div className="rounded-[1.75rem] border-2 border-sky-300 bg-sky-100/70 px-6 py-6 text-center">
                      <p className="text-[1.65rem] font-semibold leading-tight text-slate-900">
                        targeting module
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-600">
                        antibody, fab, ligand, peptide
                      </p>
                    </div>

                    <div className="hidden xl:flex items-center justify-center px-2">
                      <div className="h-1 w-12 rounded-full bg-slate-900" />
                    </div>

                    <div className="rounded-[1.75rem] border-2 border-indigo-300 bg-indigo-100/70 px-5 py-6 text-center">
                      <p className="text-[1.55rem] font-semibold leading-tight text-slate-900">
                        linker / spacer
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-600">
                        spacing, release, valency
                      </p>
                    </div>

                    <div className="hidden xl:flex items-center justify-center px-2">
                      <div className="h-1 w-12 rounded-full bg-slate-900" />
                    </div>

                    <div className="rounded-[1.75rem] border-2 border-emerald-300 bg-emerald-100/70 px-6 py-6 text-center">
                      <p className="text-[1.65rem] font-semibold leading-tight text-emerald-800">
                        oligo cargo
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-600">
                        siRNA, PMO, ASO, others
                      </p>
                    </div>

                    <div className="hidden xl:flex items-center justify-center px-2">
                      <div className="h-1 w-12 rounded-full bg-slate-900" />
                    </div>

                    <div className="rounded-[1.75rem] border-2 border-amber-300 bg-amber-100/80 px-5 py-6 text-center">
                      <p className="text-[1.55rem] font-semibold leading-tight text-amber-800">
                        active form
                      </p>
                      <p className="mt-2 text-base leading-7 text-slate-600">
                        intact or released
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-center">
                      <span className="h-3.5 w-3.5 rounded-full bg-amber-500" />
                      <span className="text-lg font-semibold text-amber-800">
                        release choice changes which molecular species is actually active
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="flex min-h-[10.5rem] flex-col rounded-[1.5rem] border border-sky-200 bg-white/90 p-5 text-left">
                      <p className="text-[1.35rem] font-semibold leading-tight text-slate-900">
                        if the linker is too short
                      </p>
                      <p className="mt-3 text-[1rem] leading-7 text-slate-600">
                        the carrier can crowd receptor binding or interfere with productive oligo handling after uptake
                      </p>
                    </div>

                    <div className="flex min-h-[10.5rem] flex-col rounded-[1.5rem] border border-violet-200 bg-white/90 p-5 text-left">
                      <p className="text-[1.35rem] font-semibold leading-tight text-slate-900">
                        if the linker is too fragile
                      </p>
                      <p className="mt-3 text-[1rem] leading-7 text-slate-600">
                        the intended conjugate can fall apart too early, so plasma exposure no longer matches the designed active species
                      </p>
                    </div>

                    <div className="flex min-h-[10.5rem] flex-col rounded-[1.5rem] border border-amber-200 bg-white/90 p-5 text-left">
                      <p className="text-[1.35rem] font-semibold leading-tight text-slate-900">
                        if release is too limited
                      </p>
                      <p className="mt-3 text-[1rem] leading-7 text-slate-600">
                        a bulky carrier can remain attached long enough to block productive RNA engagement inside the cell
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ZoomableFigure>
            <p className="leading-7">
              the linker is doing more than connecting two ends. it is deciding how much
              spacing the targeting module needs, whether the oligo should stay attached
              through action, and whether intracellular processing should generate a
              different active species after uptake.{cite(1)}{cite(2)}{cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              linker classes
            </p>
            <h2 className="site-page-heading font-semibold">
              the main connector strategies we see
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table aria-label="oligonucleotide linker classes" className="bg-white/60 border border-white/70 rounded-xl">
              <TableHeader>
                <TableColumn>Class</TableColumn>
                <TableColumn>Main role</TableColumn>
                <TableColumn>Strengths</TableColumn>
                <TableColumn>Tradeoffs</TableColumn>
              </TableHeader>
              <TableBody>
                {linkerClasses.map((row) => (
                  <TableRow key={row.className}>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{row.strengths}</TableCell>
                    <TableCell>{row.tradeoffs}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-zinc-500">
              The same chemistry can behave very differently depending on whether the biological goal is intact delivery, intracellular release, or generation of a specific free oligo catabolite.{cite(1)}{cite(2)}{cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              attachment map
            </p>
            <h2 className="site-page-heading font-semibold">
              where linker placement usually goes on each oligo class
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="Typical linker attachment positions for siRNA, ASO, and PMO">
              <svg className="zoom-graphic h-[26rem] w-full" viewBox="0 0 1180 470" fill="none">
                <rect x="24" y="28" width="1132" height="410" rx="28" fill="#f8fbff" stroke="#dbeafe" strokeWidth="2" />

                <rect x="58" y="72" width="316" height="316" rx="24" fill="#eff6ff" stroke="#7dd3fc" strokeWidth="2.5" />
                <rect x="432" y="72" width="316" height="316" rx="24" fill="#f0fdf4" stroke="#4ade80" strokeWidth="2.5" />
                <rect x="806" y="72" width="316" height="316" rx="24" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2.5" />

                <text x="216" y="112" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0f172a">siRNA</text>
                <rect x="96" y="146" width="198" height="24" rx="12" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2.5" />
                <rect x="96" y="182" width="198" height="24" rx="12" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2.5" />
                <path d="M280 158h26" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                <circle cx="318" cy="158" r="10" fill="#f59e0b" />
                <text x="216" y="242" textAnchor="middle" fontSize="13.5" fill="#475569">
                  <tspan x="216" dy="0">usually attached at the</tspan>
                  <tspan x="216" dy="21">passenger-strand end</tspan>
                  <tspan x="216" dy="24">helps keep the guide strand</tspan>
                  <tspan x="216" dy="21">cleaner for RISC loading</tspan>
                </text>

                <text x="590" y="112" textAnchor="middle" fontSize="28" fontWeight="700" fill="#166534">PMO</text>
                <rect x="500" y="160" width="180" height="30" rx="15" fill="#dcfce7" stroke="#22c55e" strokeWidth="2.5" />
                <circle cx="488" cy="175" r="10" fill="#f59e0b" />
                <text x="590" y="242" textAnchor="middle" fontSize="13.5" fill="#475569">
                  <tspan x="590" dy="0">usually attached at one</tspan>
                  <tspan x="590" dy="21">terminus, not internally</tspan>
                  <tspan x="590" dy="24">keeps the splice-blocking</tspan>
                  <tspan x="590" dy="21">recognition surface open</tspan>
                </text>

                <text x="964" y="112" textAnchor="middle" fontSize="28" fontWeight="700" fill="#92400e">ASO</text>
                <rect x="874" y="160" width="180" height="30" rx="15" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" />
                <circle cx="862" cy="175" r="10" fill="#f59e0b" />
                <circle cx="1066" cy="175" r="10" fill="#f59e0b" />
                <text x="964" y="242" textAnchor="middle" fontSize="13.5" fill="#475569">
                  <tspan x="964" dy="0">often attached through a</tspan>
                  <tspan x="964" dy="21">5′ or 3′ terminal handle</tspan>
                  <tspan x="964" dy="24">aim is to preserve</tspan>
                  <tspan x="964" dy="21">hybridization and</tspan>
                  <tspan x="964" dy="21">gapmer geometry</tspan>
                </text>
              </svg>
            </ZoomableFigure>
            <p className="text-xs text-zinc-500">
              This diagram is a positioning guide, not a hard rulebook. exact attachment choice still depends on the carrier, the sequence design, and what molecular species has to remain active.{cite(1)}{cite(2)}{cite(3)}
            </p>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {attachmentRows.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                  <span className="font-semibold text-zinc-900">where it is usually attached:</span> {item.site}
                </p>
                <p className="text-sm leading-7 text-zinc-600">
                  <span className="font-semibold text-zinc-900">why:</span> {item.why}
                  {cite(1)}
                  {cite(2)}
                  {cite(3)}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          {carrierSideRows.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">
                  {item.text}
                  {cite(1)}
                  {cite(2)}
                  {cite(4)}
                </p>
              </CardBody>
            </Card>
          ))}
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {releaseQuestions.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-600">{item.text}{cite(4)}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <section className="grid gap-3">
          <h3 className="site-card-heading font-semibold">
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
