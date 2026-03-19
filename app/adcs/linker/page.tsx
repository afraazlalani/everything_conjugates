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

const linkerClasses = [
  {
    title: "cleavable linkers",
    desc: "engineered to release payloads in response to intracellular cues such as proteases, acidic pH, or reducing environments.",
  },
  {
    title: "non-cleavable linkers",
    desc: "payloads are released only after antibody degradation inside lysosomes, often maximizing plasma stability.",
  },
];

const structureExamples = [
  {
    title: "Val-Cit (protease-cleavable) motif",
    subtitle: "cathepsin-cleavable peptide",
    smilesName: "L-Valyl-L-citrulline",
    note: "Representative Val-Cit dipeptide structure.",
  },
  {
    title: "Hydrazone motif",
    subtitle: "acid-labile linker class",
    smilesName: "benzaldehyde hydrazone",
    note: "Representative hydrazone linkage structure.",
  },
  {
    title: "Disulfide motif",
    subtitle: "reducible linker class",
    smilesName: "dipropyl disulfide",
    note: "Representative disulfide structure.",
  },
  {
    title: "Legumain-cleavable (Ala-Ala-Asn) motif",
    subtitle: "AAN peptide",
    smilesName: "L-Ala-L-Ala-L-Asn",
    note: "Representative AAN tripeptide structure.",
  },
  {
    title: "PABC self-immolative spacer",
    subtitle: "para-aminobenzyl carbamate",
    smilesName: "4-aminobenzyl carbamate",
    note: "Self-immolative spacer often paired with peptide linkers.",
  },
  {
    title: "SMCC (non-cleavable) linker",
    subtitle: "thioether linker class",
    smilesName: "SMCC",
    note: "SMCC is a widely used non-cleavable linker reagent.",
  },
];

const references = [
  {
    id: 1,
    label:
      "Linker in antibody–drug conjugates: a review of linker chemistry (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article/7/3/tbae020/7717690",
  },
  {
    id: 2,
    label:
      "Antibody-drug conjugates: recent advances in conjugation and linker chemistries (Protein & Cell, 2018)",
    href: "https://pubmed.ncbi.nlm.nih.gov/27743348/",
  },
  {
    id: 3,
    label:
      "Antibody–drug conjugates in cancer therapy: current landscape, challenges, and future directions (Molecular Cancer, 2025)",
    href: "https://molecular-cancer.biomedcentral.com/articles/10.1186/s12943-025-02489-2",
  },
  {
    id: 4,
    label: "NCBI policies and disclaimers (molecular data usage)",
    href: "https://www.ncbi.nlm.nih.gov/home/about/policies/",
  },
  {
    id: 5,
    label: "NCI/CADD Chemical Identifier Resolver documentation (SMILES lookup)",
    href: "https://cactus.nci.nih.gov/chemical/structure_documentation",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function AdcLinkerPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="linker" />

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
            linker chemistry
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            linkers control stability, release, and bystander effect
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            ADC linkers must keep payloads stable in circulation and release them
            efficiently after internalization. The linker choice shapes systemic
            safety, tumor penetration, and bystander activity.
            {cite(1)}
          </p>
          <p className="text-sm text-zinc-500">
            Note: linker classes are shared across ADCs and AOC/oligo conjugates,
            with tuning based on payload chemistry and delivery route.
            {cite(1)}
          </p>
        </motion.section>

        <section className="grid gap-6 md:grid-cols-2">
          {linkerClasses.map((item) => (
            <Card key={item.title} className="bg-white/70 border border-white/80">
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600">
                  {item.desc}
                  {cite(1)}
                </p>
              </CardBody>
            </Card>
          ))}
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              linker subclasses
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              cleavable vs non‑cleavable
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="ADC linker subclasses"
              className="bg-white/60 border border-white/70 rounded-xl"
            >
              <TableHeader>
                <TableColumn>Subclass</TableColumn>
                <TableColumn>Trigger / mechanism</TableColumn>
                <TableColumn>Use cases</TableColumn>
                <TableColumn>Advantages</TableColumn>
                <TableColumn>Tradeoffs</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow key="protease">
                  <TableCell>Protease‑cleavable (Val‑Cit, Val‑Ala)</TableCell>
                  <TableCell>Cathepsin cleavage + self‑immolative spacer</TableCell>
                  <TableCell>Designed for lysosomal processing</TableCell>
                  <TableCell>Efficient intracellular drug release</TableCell>
                  <TableCell>Depends on lysosomal protease activity</TableCell>
                </TableRow>
                <TableRow key="acid">
                  <TableCell>Acid‑labile (hydrazone)</TableCell>
                  <TableCell>Low pH in endosome/lysosome</TableCell>
                  <TableCell>Release tuned to acidic vesicles</TableCell>
                  <TableCell>Triggered release in acidic compartments</TableCell>
                  <TableCell>Potential plasma instability</TableCell>
                </TableRow>
                <TableRow key="disulfide">
                  <TableCell>Disulfide / redox‑cleavable</TableCell>
                  <TableCell>Higher intracellular reducing environment</TableCell>
                  <TableCell>Conditional release in reducing cells</TableCell>
                  <TableCell>Release tuned by steric shielding</TableCell>
                  <TableCell>Risk of premature reduction in circulation</TableCell>
                </TableRow>
                <TableRow key="pyro">
                  <TableCell>Pyrophosphate diester</TableCell>
                  <TableCell>Lysosomal cleavage</TableCell>
                  <TableCell>Stable, hydrophilic cleavable linker</TableCell>
                  <TableCell>Traceless payload release</TableCell>
                  <TableCell>Requires efficient lysosomal processing</TableCell>
                </TableRow>
                <TableRow key="noncleavable">
                  <TableCell>Non‑cleavable (thioether)</TableCell>
                  <TableCell>Lysosomal degradation yields active catabolite</TableCell>
                  <TableCell>When maximal plasma stability is needed</TableCell>
                  <TableCell>High plasma stability</TableCell>
                  <TableCell>Requires efficient lysosomal processing</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-zinc-500">
              Linker selection balances systemic stability with efficient intracellular release and is
              often matched to payload class and target biology. {cite(1)}{cite(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              release triggers
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              cleavable linker mechanisms
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Protease-cleavable peptide linkers (for example Val-Cit) are cut by
              lysosomal enzymes such as cathepsins, releasing payloads after
              internalization.
              {cite(1)}
            </p>
            <p>
              Acid-labile hydrazones can release payloads in acidic endosomal or
              lysosomal environments.
              {cite(1)}
            </p>
            <p>
              Reducible disulfides respond to intracellular reducing conditions,
              enabling payload liberation inside cells.
              {cite(1)}
            </p>
            <p>
              Legumain-cleavable peptides (such as AAN motifs) provide additional
              protease-specific release strategies.
              {cite(1)}
            </p>
          </CardBody>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                release map
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                cleavable vs non-cleavable flow
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <svg className="h-52 w-full" viewBox="0 0 520 180" fill="none">
                <rect x="20" y="20" width="140" height="40" rx="14" fill="#e0f2fe" />
                <rect x="200" y="20" width="140" height="40" rx="14" fill="#e0e7ff" />
                <rect x="380" y="20" width="120" height="40" rx="14" fill="#e0f2fe" />
                <rect x="140" y="110" width="120" height="40" rx="14" fill="#fef3c7" />
                <rect x="300" y="110" width="160" height="40" rx="14" fill="#eef2ff" />
                <text x="42" y="45" fontSize="12" fill="#0f172a">blood stable</text>
                <text x="220" y="45" fontSize="12" fill="#0f172a">cell uptake</text>
                <text x="402" y="45" fontSize="12" fill="#0f172a">lysosome</text>
                <text x="156" y="135" fontSize="12" fill="#0f172a">cleavable</text>
                <text x="320" y="135" fontSize="12" fill="#0f172a">non-cleavable</text>
                <path d="M160 40h40" stroke="#0f172a" strokeWidth="2" />
                <path d="M340 40h40" stroke="#0f172a" strokeWidth="2" />
                <path d="M440 60v40" stroke="#0f172a" strokeWidth="2" />
                <path d="M260 130h40" stroke="#0f172a" strokeWidth="2" />
              </svg>
              <p className="text-xs text-zinc-500">
                Visual comparison of release routes for cleavable and non-cleavable linkers.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
                reaction sketch
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                representative conjugation step
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
              <svg className="h-52 w-full" viewBox="0 0 520 180" fill="none">
                <rect x="20" y="50" width="150" height="60" rx="12" fill="#e0f2fe" />
                <rect x="350" y="50" width="150" height="60" rx="12" fill="#e0e7ff" />
                <text x="40" y="85" fontSize="12" fill="#0f172a">antibody‑SH</text>
                <text x="372" y="85" fontSize="12" fill="#0f172a">antibody‑S‑linker</text>
                <path d="M190 80h60" stroke="#0f172a" strokeWidth="2" />
                <text x="240" y="75" fontSize="12" fill="#0f172a">+ maleimide</text>
                <path d="M300 80h40" stroke="#0f172a" strokeWidth="2" />
              </svg>
              <p className="text-xs text-zinc-500">
                Simplified cysteine-maleimide conjugation sketch.
              </p>
            </CardBody>
          </Card>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          {structureExamples.map((item) => (
            <StructureCard key={item.title} {...item} />
          ))}
          <span className="text-xs text-zinc-500">{cite(5)}</span>
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              linker selection
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              checklist for choosing a linker
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>plasma stability and minimal premature payload release</p>
            <p>compatibility with payload chemistry and DAR targets</p>
            <p>controlled release mechanism aligned with target biology</p>
            <p>manufacturability and scalability of conjugation</p>
            <span className="text-xs text-zinc-500">{cite(1)}</span>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              non-cleavable linkers
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              stability-first designs
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Non-cleavable thioether linkers (such as SMCC-derived linkages)
              require antibody catabolism to release payloads, often increasing
              stability in circulation.
              {cite(2)}
            </p>
            <p>
              These linkers can reduce premature payload release but may lower
              bystander effects depending on payload permeability.
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
