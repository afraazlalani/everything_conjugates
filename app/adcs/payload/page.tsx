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

const payloadFamilies = [
  {
    title: "microtubule inhibitors",
    desc: "auristatins (MMAE/MMAF) and maytansinoids (DM1/DM4) disrupt mitosis at very low doses.",
  },
  {
    title: "DNA-damaging agents",
    desc: "calicheamicin and PBD dimers induce DNA breaks or crosslinks to trigger cell death.",
  },
  {
    title: "topoisomerase I inhibitors",
    desc: "DXd and SN-38 derivatives block DNA replication and have expanded ADC clinical activity.",
  },
];

const structureExamples: Array<{
  title: string;
  subtitle: string;
  note: string;
  category: "payload";
  smiles?: string;
  smilesName?: string;
}> = [
  {
    title: "MMAE",
    subtitle: "auristatin payload",
    smiles:
      "CCC(C)C(C(CC(=O)N1CCCC1C(C(C)C(=O)NC(C)C(C2=CC=CC=C2)O)OC)OC)N(C)C(=O)C(C(C)C)NC(=O)C(C(C)C)NC",
    note: "Structure reference for MMAE.",
    category: "payload",
  },
  {
    title: "MMAF",
    subtitle: "auristatin payload",
    smilesName: "monomethyl auristatin F",
    note: "Structure reference for MMAF.",
    category: "payload",
  },
  {
    title: "Mertansine (DM1)",
    subtitle: "maytansinoid payload",
    smiles:
      "C[C@]1([C@@](CC(N(C(C=C2C=C3OC)=C3Cl)C)=O)([H])OC([C@H](C)N(C)C(CCS)=O)=O)[C@H]([C@@H]([C@](OC4=O)([H])C[C@]([C@](/C=C/C=C(C)/C2)([H])OC)(N4)O)C)O1",
    note: "Structure reference for DM1.",
    category: "payload",
  },
  {
    title: "DM4",
    subtitle: "maytansinoid payload",
    smilesName: "DM4",
    note: "Structure reference for DM4.",
    category: "payload",
  },
  {
    title: "SN-38",
    subtitle: "topoisomerase I inhibitor",
    smilesName: "SN-38",
    note: "Structure reference for SN-38.",
    category: "payload",
  },
  {
    title: "Calicheamicin",
    subtitle: "DNA-damaging payload",
    smilesName: "calicheamicin",
    note: "Structure reference for calicheamicin.",
    category: "payload",
  },
  {
    title: "SGD-1882 (PBD dimer)",
    subtitle: "DNA crosslinking payload",
    smilesName: "SGD-1882",
    note: "Representative PBD dimer payload.",
    category: "payload",
  },
];

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
      "Antibody–drug conjugates in cancer therapy: current landscape, challenges, and future directions (Molecular Cancer, 2025)",
    href: "https://molecular-cancer.biomedcentral.com/articles/10.1186/s12943-025-02489-2",
  },
  {
    id: 3,
    label: "NCBI policies and disclaimers (molecular data usage)",
    href: "https://www.ncbi.nlm.nih.gov/home/about/policies/",
  },
  {
    id: 4,
    label: "NCI/CADD Chemical Identifier Resolver documentation (SMILES lookup)",
    href: "https://cactus.nci.nih.gov/chemical/structure_documentation",
  },
  {
    id: 5,
    label: "GLPBIO: Monomethyl auristatin E (MMAE) — compound page with SMILES",
    href: "https://www.glpbio.com/monomethyl-auristatin-e-mmae.html",
  },
  {
    id: 6,
    label: "GLPBIO: Mertansine (DM1) — compound page with SMILES",
    href: "https://www.glpbio.com/mertansine.html",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function AdcPayloadPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="payload" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/adcs" className="text-sm text-sky-700">
            adc overview
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
            payloads
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            payloads deliver the therapeutic punch
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            ADC payloads must be extremely potent because only a fraction of drug
            reaches each target cell. Payload chemistry also determines bystander
            activity, resistance patterns, and safety profiles.
            {cite(1)}
          </p>
        </motion.section>

        <section className="grid gap-6">
          {payloadFamilies.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardHeader className="flex flex-col items-start gap-1">
                <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h2>
              </CardHeader>
              <Divider />
              <CardBody className="text-sm text-zinc-600">
                {item.desc}
                {cite(1)}
              </CardBody>
            </Card>
          ))}
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              payload classes
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              mechanisms, advantages, and liabilities
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="ADC payload classes"
              className="bg-white/60 border border-white/70 rounded-xl"
            >
              <TableHeader>
                <TableColumn>Class</TableColumn>
                <TableColumn>Mechanism</TableColumn>
                <TableColumn>Examples</TableColumn>
                <TableColumn>Strengths</TableColumn>
                <TableColumn>Liabilities</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow key="tubulin">
                  <TableCell>Auristatins / Maytansinoids</TableCell>
                  <TableCell>Microtubule disruption → mitotic arrest</TableCell>
                  <TableCell>MMAE, MMAF, DM1, DM4</TableCell>
                  <TableCell>Very potent, clinically validated</TableCell>
                  <TableCell>Peripheral neuropathy, efflux risk</TableCell>
                </TableRow>
                <TableRow key="dna">
                  <TableCell>DNA‑damaging / cross‑linking</TableCell>
                  <TableCell>DNA cleavage or cross‑linking</TableCell>
                  <TableCell>Calicheamicin, PBD dimers</TableCell>
                  <TableCell>High potency, activity in slow‑dividing cells</TableCell>
                  <TableCell>Narrow safety window, genotoxicity</TableCell>
                </TableRow>
                <TableRow key="topo1">
                  <TableCell>Topoisomerase I inhibitors</TableCell>
                  <TableCell>Stabilize Topo‑I complex → DNA breaks</TableCell>
                  <TableCell>SN‑38, DXd (deruxtecan)</TableCell>
                  <TableCell>Can enable bystander diffusion</TableCell>
                  <TableCell>GI and hematologic toxicity</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="grid gap-2 text-xs text-zinc-500">
              <p>
                Selection criteria often include potency (pM–nM), membrane permeability (bystander
                potential), stability, and susceptibility to efflux or resistance mechanisms.
                {cite(2)}
              </p>
              <p>
                Payload class strongly shapes toxicity patterns; tubulin binders, DNA‑damaging agents,
                and Topo‑I inhibitors show distinct safety profiles. {cite(2)}
              </p>
            </div>
          </CardBody>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          {structureExamples.map((item) => (
            <StructureCard key={item.title} {...item} />
          ))}
          <span className="text-xs text-zinc-500">{cite(4)}{cite(5)}{cite(6)}</span>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                mechanism map
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                payload classes in one visual
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <svg className="h-52 w-full" viewBox="0 0 520 180" fill="none">
                <rect x="20" y="20" width="150" height="50" rx="14" fill="#e0f2fe" />
                <rect x="200" y="20" width="150" height="50" rx="14" fill="#e0e7ff" />
                <rect x="380" y="20" width="120" height="50" rx="14" fill="#fef3c7" />
                <text x="40" y="50" fontSize="12" fill="#0f172a">tubulin inhibitors</text>
                <text x="216" y="50" fontSize="12" fill="#0f172a">DNA damaging</text>
                <text x="398" y="50" fontSize="12" fill="#0f172a">topo‑I</text>
                <rect x="60" y="110" width="100" height="40" rx="12" fill="#e2e8f0" />
                <rect x="220" y="110" width="110" height="40" rx="12" fill="#e2e8f0" />
                <rect x="360" y="110" width="120" height="40" rx="12" fill="#e2e8f0" />
                <text x="74" y="135" fontSize="11" fill="#0f172a">MMAE/MMAF</text>
                <text x="238" y="135" fontSize="11" fill="#0f172a">PBD / calich</text>
                <text x="378" y="135" fontSize="11" fill="#0f172a">SN‑38 / DXd</text>
              </svg>
              <p className="text-xs text-zinc-500">
                Quick visual grouping of payload classes and representative examples.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                bystander effect
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                permeable vs trapped payloads
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <svg className="h-52 w-full" viewBox="0 0 520 180" fill="none">
                <rect x="40" y="30" width="140" height="100" rx="18" fill="#e0f2fe" />
                <rect x="220" y="30" width="140" height="100" rx="18" fill="#e0e7ff" />
                <rect x="400" y="30" width="80" height="100" rx="18" fill="#fef3c7" />
                <circle cx="110" cy="80" r="16" fill="#38bdf8" />
                <circle cx="290" cy="80" r="16" fill="#6366f1" />
                <circle cx="440" cy="80" r="12" fill="#f59e0b" />
                <path d="M126 80h78" stroke="#0f172a" strokeWidth="2" />
                <path d="M306 80h78" stroke="#0f172a" strokeWidth="2" />
                <text x="60" y="150" fontSize="11" fill="#0f172a">target cell</text>
                <text x="240" y="150" fontSize="11" fill="#0f172a">neighbor cell</text>
                <text x="400" y="150" fontSize="11" fill="#0f172a">diffusion</text>
              </svg>
              <p className="text-xs text-zinc-500">
                Permeable payloads can diffuse to nearby cells, while charged payloads stay local.
              </p>
            </CardBody>
          </Card>
        </div>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              payload decision matrix
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              how teams choose payloads
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>potency at low intracellular concentrations</p>
            <p>membrane permeability and desired bystander effect</p>
            <p>resistance risk (efflux, target pathway changes)</p>
            <p>stability during conjugation and storage</p>
            <p>compatibility with linker and DAR targets</p>
            <span className="text-xs text-zinc-500">{cite(1)}</span>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              design considerations
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              potency, permeability, and resistance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Membrane-permeable payloads can produce bystander killing, which is
              useful for heterogeneous tumors but may raise safety concerns.
              {cite(2)}
            </p>
            <p>
              Resistance can emerge through drug efflux, target downregulation,
              or impaired internalization, motivating payload and linker tuning.
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
