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
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { EnzymaticSectionTabs } from "@/components/EnzymaticSectionTabs";
import { SmilesStructure } from "@/components/SmilesStructure";
import { StructureCard } from "@/components/StructureCard";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const references = [
  {
    id: 1,
    label:
      "Transglutaminase-mediated antibody conjugation (Bioconjugate Chemistry, 2024)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11227664/",
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
    label: "Wikimedia Commons: Microbial transglutaminase.jpg (CC BY-SA 4.0)",
    href: "https://commons.wikimedia.org/wiki/File:Microbial_transglutaminase.jpg",
  },
];

const workflowRows = [
  {
    step: "Prepare the glutamine site",
    why: "the enzyme only works well if the reactive glutamine is physically accessible",
    risk: "Buried sites or crowded local structure can collapse conversion",
  },
  {
    step: "Present an amine-bearing partner",
    why: "transglutaminase transfers the acyl group onto a primary amine handle",
    risk: "Poor nucleophile design can lower yield or add hydrophobicity",
  },
  {
    step: "Watch conversion and heterogeneity",
    why: "the whole point is cleaner site control than random lysine coupling",
    risk: "Partial reaction leaves mixed species that blunt the value of the route",
  },
  {
    step: "Recheck antibody biology",
    why: "better chemistry is only useful if binding and Fc behavior still hold up",
    risk: "A nice conjugation profile can still fail if site choice perturbs function",
  },
];

const compareRows = [
  {
    topic: "Where control comes from",
    transglutaminase: "enzyme-recognized glutamine context",
    lysine: "bulk surface lysines with broad reactivity",
  },
  {
    topic: "Product definition",
    transglutaminase: "usually narrower positional spread",
    lysine: "larger mixture of positional isomers",
  },
  {
    topic: "Development burden",
    transglutaminase: "enzyme workflow and substrate tuning",
    lysine: "simpler chemistry but looser control",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function TransglutaminasePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="main" />
      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <div className="h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_20px_2px_rgba(14,165,233,0.6)]" />
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)] text-zinc-900"
          >
            Everything Conjugates
          </Link>
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/chemistry/enzymatic" className="text-sm text-sky-700">
            enzymatic overview
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            transglutaminase
          </Chip>
          <h1 className="site-page-title font-semibold">
            transglutaminase-mediated conjugation
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            transglutaminase routes use enzyme-catalyzed amide formation at reactive
            glutamine sites to build more defined conjugates than random lysine
            chemistry. the appeal is cleaner positional control without having to
            commit fully to an engineered-cysteine platform.
            {cite(1)}
            {cite(2)}
            {cite(3)}
            {cite(4)}
          </p>
          <EnzymaticSectionTabs active="transglutaminase" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              overview
            </p>
            <h2 className="site-page-heading font-semibold">
              what this method is really doing
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm leading-7 text-zinc-600 md:grid-cols-3">
            <p>
              <span className="font-semibold text-zinc-900">what it is:</span>{" "}
              microbial transglutaminase links a glutamine-containing protein site to
              an amine-bearing linker or handle, giving a site-biased enzymatic
              coupling step.{cite(1)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">why teams use it:</span>{" "}
              it can tighten site control relative to random lysine chemistry while
              keeping the core antibody architecture closer to native.
              {cite(1)}
              {cite(2)}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">main tradeoff:</span>{" "}
              enzyme access still depends on local structure, so substrate prep,
              handle choice, and process tuning matter a lot.{cite(1)}{cite(3)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              reaction logic
            </p>
            <h2 className="site-page-heading font-semibold">
              representative reaction and enzyme context
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <ZoomableFigure label="Representative transglutaminase reaction logic">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/70 p-6">
                <div className="zoom-graphic grid gap-6">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,14rem)_auto_minmax(0,14rem)_minmax(0,10rem)_minmax(0,15rem)] lg:items-center lg:justify-center">
                    <div className="flex min-w-0 flex-col items-center rounded-[1.25rem] border border-sky-200 bg-sky-50/80 p-4 text-center">
                      <p className="text-sm font-semibold text-sky-800">glutamine-side motif</p>
                      <SmilesStructure
                        smiles="NC(=O)CCC(N)C(=O)O"
                        width={180}
                        height={120}
                        className="h-[7.5rem] w-full"
                        ariaLabel="glutamine side-chain motif"
                      />
                      <p className="text-xs text-zinc-500">
                        representative acyl-donor logic on the protein side
                      </p>
                    </div>

                    <div className="flex items-center justify-center text-3xl font-semibold text-zinc-400">
                      +
                    </div>

                    <div className="flex min-w-0 flex-col items-center rounded-[1.25rem] border border-violet-200 bg-violet-50/80 p-4 text-center">
                      <p className="text-sm font-semibold text-violet-800">dbco-amine handle</p>
                      <SmilesStructure
                        smiles="NCCC(N1CC2=C(C=CC=C2)C#CC3=C1C=CC=C3)=O"
                        width={180}
                        height={120}
                        className="h-[7.5rem] w-full scale-x-[-1]"
                        ariaLabel="dbco-amine primary amine handle"
                      />
                      <p className="text-xs text-zinc-500">
                        primary amine accepts the transfer while dbco stays available
                        for downstream click chemistry
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2 px-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                        microbial transglutaminase
                      </span>
                      <span className="text-4xl text-zinc-500">→</span>
                    </div>

                    <div className="flex min-w-0 flex-col items-center rounded-[1.25rem] border border-amber-200 bg-amber-50/80 p-4 text-center">
                      <p className="text-sm font-semibold text-amber-800">amide-linked outcome</p>
                      <SmilesStructure
                        smiles="NC(CCC(=O)NCCC(=O)N1CC2=C(C=CC=C2)C#CC3=C1C=CC=C3)C(=O)O"
                        width={190}
                        height={120}
                        className="h-[7.5rem] w-full"
                        ariaLabel="amide-linked transglutaminase product"
                      />
                      <p className="text-xs text-zinc-500">
                        representative stand-in for the installed connection
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm text-zinc-600 md:grid-cols-3">
                    <div className="p-4">
                      <p className="font-semibold text-zinc-900">what this is</p>
                      <p className="mt-2">
                        this is a representative chemistry strip built from the site’s
                        structure tooling. it is not the full protein surface, but it
                        shows the core logic: glutamine-side acyl donor plus a
                        dbco-amine acceptor gives an amide-linked product while
                        leaving the click-ready dbco handle available downstream.
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-zinc-900">what the enzyme decides</p>
                      <p className="mt-2">
                        the enzyme decides whether the glutamine context is accessible
                        and whether the primary amine on the dbco handle is accepted
                        efficiently. that is where most of the selectivity comes
                        from.{cite(1)}{cite(3)}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-zinc-900">why this helps</p>
                      <p className="mt-2">
                        this route is useful when teams want cleaner positional control
                        than broad lysine acylation, while still staying in a practical
                        conjugation workflow.{cite(1)}{cite(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ZoomableFigure>
            <p className="text-xs text-zinc-500">
              representative reaction strip built with the site’s integrated chemistry
              rendering tools. structural context for microbial transglutaminase is
              still referenced in the literature cited below.{cite(1)}{cite(3)}{cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative chemistry
            </p>
            <h2 className="site-page-heading font-semibold">
              motifs that matter around a transglutaminase workflow
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="glutamine side-chain motif"
              subtitle="protein-side acyl donor logic"
              smiles="NC(=O)CCC(N)C(=O)O"
              pubchemQuery="glutamine"
              note="transglutaminase reads a reactive glutamine context on the protein side."
              category="linker"
              className="h-full"
            />
            <StructureCard
              title="dbco-amine handle"
              subtitle="incoming nucleophile plus click-ready tag"
              smiles="NCCC(N1CC2=C(C=CC=C2)C#CC3=C1C=CC=C3)=O"
              pubchemQuery="DBCO-amine"
              note="the primary amine is the true acyl acceptor; the dbco ring is carried through as a downstream click handle."
              category="linker"
              className="h-full"
            />
            <StructureCard
              title="amide outcome"
              subtitle="the installed connection type"
              smiles="NC(CCC(=O)NCCC(=O)N1CC2=C(C=CC=C2)C#CC3=C1C=CC=C3)C(=O)O"
              note="the result is an amide-style connection that keeps the dbco handle attached unless later chemistry consumes it in a click step."
              category="linker"
              className="h-full"
            />
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              practical setup
            </p>
            <h2 className="site-page-heading font-semibold">
              how this often looks on the antibody side
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <p>
                <span className="font-semibold text-zinc-900">antibody side:</span>{" "}
                the acyl-donor glutamine usually sits on the mAb side, so the protein
                itself is what the enzyme reads first. that is the positional anchor
                for the whole coupling event.{cite(1)}{cite(3)}
              </p>
              <p>
                <span className="font-semibold text-zinc-900">incoming partner:</span>{" "}
                one common design pattern is a short lysine-containing peptide or
                linker-like appendage where the lysine epsilon amine is the real
                acceptor, while a distal `DBCO` or `N3` handle is carried along for a
                later click step.{cite(1)}{cite(2)}
              </p>
              <p>
                <span className="font-semibold text-zinc-900">why it helps:</span>{" "}
                this splits the job in two parts: transglutaminase installs the peptide
                or handle-bearing stub at the chosen glutamine site, and then the
                click-ready group can be used downstream without asking the enzyme to do
                every step itself.{cite(2)}{cite(3)}
              </p>
            </div>

            <ZoomableFigure label="Transglutaminase antibody-side setup with lysine-containing peptide handle">
              <div className="zoom-frame rounded-xl border border-white/70 bg-white/80 p-6">
                <div className="zoom-graphic grid gap-5">
                  <div className="flex justify-center">
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800">
                      microbial transglutaminase installs a lysine-bearing stub onto an exposed antibody glutamine
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                      mAb side
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-sky-400 bg-white text-2xl font-semibold text-sky-700">
                        mAb
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <div className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm text-zinc-700">
                          exposed glutamine site
                        </div>
                        <div className="h-1.5 w-24 rounded-full bg-sky-300" />
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                      transglutaminase reads this antibody glutamine as the acyl-donor anchor. accessibility of that local site is what determines whether the install step works well.
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-violet-200 bg-violet-50/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">
                      incoming peptide / handle
                    </p>
                    <div className="mt-4 grid gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-violet-300 bg-white px-3 py-1 text-sm font-semibold text-violet-700">
                          lys
                        </div>
                        <div className="h-1.5 flex-1 rounded-full bg-violet-300" />
                        <div className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                          dbco / n3
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/80 bg-white/80 p-3 text-sm text-zinc-700">
                        lysine epsilon amine = enzyme-facing acceptor
                      </div>
                      <div className="rounded-xl border border-white/80 bg-white/80 p-3 text-sm text-zinc-700">
                        dbco or azide = downstream click handle carried through the
                        install step
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                      installed product
                    </p>
                    <div className="mt-4 grid gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-sky-400 bg-white text-lg font-semibold text-sky-700">
                          mAb
                        </div>
                        <div className="h-1.5 w-12 shrink-0 rounded-full bg-sky-300" />
                        <div className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-semibold text-amber-700">
                          Gln-Lys-stub
                        </div>
                        <div className="h-1.5 w-12 shrink-0 rounded-full bg-violet-300" />
                        <div className="rounded-full border border-violet-300 bg-white px-3 py-1 text-sm font-semibold text-violet-700">
                          DBCO / N3
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/80 bg-white/80 p-3 text-sm text-zinc-700">
                        glutamine on the antibody is now amide-linked to the incoming
                        lysine-containing stub
                      </div>
                      <div className="rounded-xl border border-white/80 bg-white/80 p-3 text-sm text-zinc-700">
                        the distal click handle stays intact, so the conjugate can move
                        into SPAAC or azide-alkyne assembly next
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="text-sm font-semibold text-amber-800">resulting logic</p>
                  <p className="mt-2 text-sm text-zinc-600">
                    the enzyme installs the lysine-containing stub onto the antibody’s
                    glutamine site, and the distal `DBCO` or `N3` handle remains
                    available for a later click or assembly step.{cite(1)}{cite(2)}
                  </p>
                </div>
              </div>
            </ZoomableFigure>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              workflow
            </p>
            <h2 className="site-page-heading font-semibold">
              what teams usually have to tune
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="Transglutaminase workflow tuning points"
              className="rounded-xl border border-white/70 bg-white/60"
            >
              <TableHeader>
                <TableColumn>Step</TableColumn>
                <TableColumn>Why it matters</TableColumn>
                <TableColumn>Typical failure mode</TableColumn>
              </TableHeader>
              <TableBody>
                {workflowRows.map((row) => (
                  <TableRow key={row.step}>
                    <TableCell>{row.step}</TableCell>
                    <TableCell>{row.why}</TableCell>
                    <TableCell>{row.risk}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-zinc-500">
              this is why transglutaminase can look simple on paper but still needs
              real process development: the enzyme, the protein surface, and the
              incoming handle all have to line up at once.{cite(1)}{cite(3)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              positioning
            </p>
            <h2 className="site-page-heading font-semibold">
              how it compares with broad lysine coupling
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <Table
              aria-label="Transglutaminase versus lysine comparison"
              className="rounded-xl border border-white/70 bg-white/60"
            >
              <TableHeader>
                <TableColumn>Question</TableColumn>
                <TableColumn>transglutaminase</TableColumn>
                <TableColumn>lysine chemistry</TableColumn>
              </TableHeader>
              <TableBody>
                {compareRows.map((row) => (
                  <TableRow key={row.topic}>
                    <TableCell>{row.topic}</TableCell>
                    <TableCell>{row.transglutaminase}</TableCell>
                    <TableCell>{row.lysine}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

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
