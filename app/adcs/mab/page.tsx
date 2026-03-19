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
import { LabeledStructureCard } from "@/components/LabeledStructureCard";
import { StructureCard } from "@/components/StructureCard";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";

const highlights = [
  "selects the target antigen and shapes tumor selectivity",
  "controls internalization and lysosomal trafficking",
  "influences circulating half-life via FcRn recycling",
  "affects safety through antigen expression on healthy tissue",
];

const targetNotes = [
  "high tumor expression with minimal normal-tissue expression",
  "rapid internalization after binding",
  "limited antigen shedding or soluble antigen interference",
  "stable epitope accessibility and low heterogeneity",
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
    label: "RCSB PDB usage policy (CC0 for structure images)",
    href: "https://www.rcsb.org/pages/usage-policy",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

export default function MabPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="mab" />

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

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            mAb in adcs
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            the antibody defines targeting and exposure
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            The monoclonal antibody (mAb) drives antigen recognition, uptake, and
            tissue distribution. Antigen selection is one of the most critical
            decisions in ADC design.
            {cite(1)}
          </p>
        </motion.section>

        <MoleculeCard label="monoclonal antibody" variant="antibody" />

        <LabeledStructureCard
          title="IgG antibody structure"
          subtitle="zoomed labeled IgG structure (RCSB PDB 1IGT)"
          src="https://cdn.rcsb.org/images/structures/ig/1igt/1igt_assembly-1.jpeg"
          note="RCSB PDB structure image with added Fab, hinge, and Fc labels."
        />
        <span className="text-xs text-zinc-500">{cite(1)}</span>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              anatomy
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              antibody domains at a glance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <svg className="h-52 w-full" viewBox="0 0 420 180" fill="none">
              <path d="M210 160V110" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
              <path d="M210 110L130 30" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
              <path d="M210 110L290 30" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
              <circle cx="130" cy="30" r="18" fill="#e0f2fe" />
              <circle cx="290" cy="30" r="18" fill="#e0f2fe" />
              <circle cx="210" cy="110" r="22" fill="#e0e7ff" />
              <text x="112" y="34" fontSize="11" fill="#0f172a">Fab</text>
              <text x="272" y="34" fontSize="11" fill="#0f172a">Fab</text>
              <text x="198" y="114" fontSize="11" fill="#0f172a">Fc</text>
              <text x="200" y="168" fontSize="11" fill="#0f172a">hinge</text>
            </svg>
            <p className="text-xs text-zinc-500">
              Simple domain map to anchor Fab/Fc roles in targeting and half-life.
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              recycling
            </p>
            <h2 className="text-3xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              FcRn-driven half-life loop
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-2 text-sm text-zinc-600">
            <svg className="h-[42rem] w-full" viewBox="0 0 1120 620" fill="none">
              <g transform="translate(0,-70)">
                <defs>
                  <marker id="fcrn-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill="#0f172a" />
                  </marker>
                </defs>

                <rect x="20" y="8" width="1080" height="556" rx="34" fill="#f8fbff" stroke="#dbeafe" strokeWidth="2" />
                <rect x="40" y="22" width="1040" height="96" rx="22" fill="#ffffff" stroke="#dbeafe" />
                <rect x="40" y="134" width="1040" height="400" rx="28" fill="#eff6ff" stroke="#dbeafe" />

                <text x="70" y="62" fontSize="22" fontWeight="700" fill="#0f172a">blood / extracellular space</text>
                <text x="70" y="90" fontSize="16" fill="#475569">neutral pH ~7.4 - FcRn releases IgG and returns intact antibody to circulation</text>
                <text x="70" y="176" fontSize="22" fontWeight="700" fill="#0f172a">acidifying endosome and sorting network</text>
                <text x="70" y="204" fontSize="16" fill="#475569">acidic pH ~6.0 - Fc binds FcRn and is diverted away from lysosomal degradation</text>

                <circle cx="154" cy="360" r="84" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2.5" />
                <circle cx="410" cy="360" r="84" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2.5" />
                <circle cx="674" cy="360" r="84" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="2.5" />
                <circle cx="674" cy="492" r="58" fill="#dcfce7" stroke="#86efac" strokeWidth="2.5" />
                <circle cx="944" cy="360" r="84" fill="#fee2e2" stroke="#fca5a5" strokeWidth="2.5" />

                <text x="112" y="338" fontSize="18" fontWeight="700" fill="#0f172a">1 uptake</text>
                <text x="104" y="370" fontSize="15" fill="#0f172a">IgG enters</text>
                <text x="92" y="392" fontSize="15" fill="#0f172a">early endosome</text>

                <text x="350" y="338" fontSize="18" fontWeight="700" fill="#0f172a">2 FcRn rescue</text>
                <text x="344" y="370" fontSize="15" fill="#0f172a">acidic pH drives</text>
                <text x="334" y="392" fontSize="15" fill="#0f172a">Fc-FcRn binding</text>

                <text x="620" y="338" fontSize="18" fontWeight="700" fill="#0f172a">3 recycling sort</text>
                <text x="614" y="370" fontSize="15" fill="#0f172a">complex enters</text>
                <text x="606" y="392" fontSize="15" fill="#0f172a">recycling route</text>

                <text x="628" y="500" fontSize="17" fontWeight="700" fill="#166534">4 surface release</text>
                <text x="612" y="524" fontSize="13" fill="#166534">neutral pH dissociates</text>
                <text x="622" y="542" fontSize="13" fill="#166534">IgG from FcRn</text>

                <text x="908" y="338" fontSize="18" fontWeight="700" fill="#7f1d1d">failure route</text>
                <text x="900" y="370" fontSize="15" fill="#7f1d1d">missed rescue</text>
                <text x="888" y="392" fontSize="15" fill="#7f1d1d">lysosomal loss</text>

                <path d="M238 360H316" stroke="#0f172a" strokeWidth="3.2" markerEnd="url(#fcrn-arrow)" />
                <path d="M494 360H580" stroke="#0f172a" strokeWidth="3.2" markerEnd="url(#fcrn-arrow)" />
                <path d="M674 274V108" stroke="#0ea5e9" strokeWidth="3.2" markerEnd="url(#fcrn-arrow)" />
                <path d="M724 510C804 510 860 468 896 418" stroke="#166534" strokeWidth="3.2" markerEnd="url(#fcrn-arrow)" />
                <path d="M758 360H852" stroke="#7f1d1d" strokeWidth="3.2" strokeDasharray="7 6" markerEnd="url(#fcrn-arrow)" />

                <text x="704" y="110" fontSize="18" fontWeight="700" fill="#0f172a">5 salvage back to plasma</text>
                <text x="790" y="324" fontSize="14" fill="#7f1d1d">if recycling fails</text>
              </g>
            </svg>
            <div className="grid gap-3 md:grid-cols-3">
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">What it shows:</span> IgG is
                continuously sampled into endosomes, rescued from degradation by FcRn at acidic
                pH, and returned to blood when the complex reaches the neutral cell surface. This
                salvage loop is a major reason full-length antibodies maintain long serum half-life.
                {cite(1)}
              </p>
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">Why it matters:</span> antibody
                engineering near the Fc, high DAR, aggregation, or altered Fc conformation can
                weaken FcRn engagement and shorten exposure. In ADCs, that changes systemic
                clearance, tumor delivery, and safety margins. {cite(1)}
              </p>
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">Failure checkpoints:</span> if IgG
                misses FcRn in the endosome, sorts poorly into recycling vesicles, or enters the
                lysosomal route instead, intact conjugate is lost and the PK profile shifts toward
                faster clearance and lower exposure. {cite(1)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              key roles
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what the mAb is responsible for
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                <span>{item}</span>
              </div>
            ))}
            <span className="text-xs text-zinc-500">{cite(1)}</span>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              target selection
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what makes a strong antigen target
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            {targetNotes.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                <span>{item}</span>
              </div>
            ))}
            <span className="text-xs text-zinc-500">{cite(1)}</span>
          </CardBody>
        </Card>


        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              fc engineering
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              immune effector considerations
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Fc domain properties can influence half-life, immune effector
              function, and overall tolerability.
              {cite(2)}
            </p>
            <p>
              Some ADCs retain effector activity, while others are engineered to
              reduce it depending on the mechanism of action.
              {cite(2)}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              resistance and safety
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              common challenges
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Antigen downregulation, heterogeneous expression, or impaired
              internalization can reduce ADC efficacy.
              {cite(2)}
            </p>
            <p>
              Off-tumor antigen expression raises safety concerns and often drives
              dose-limiting toxicity.
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
