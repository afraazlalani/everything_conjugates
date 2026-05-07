"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
import { LabeledStructureCard } from "@/components/LabeledStructureCard";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { ZoomableFigure } from "@/components/ZoomableFigure";

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

const designLevers = [
  {
    title: "Target biology",
    text:
      "The mAb is only as good as the antigen it sees. Density, accessibility, shedding, and tumor-to-normal expression all shape the therapeutic window.",
  },
  {
    title: "Binding behavior",
    text:
      "Affinity must be high enough for durable tumor engagement, but not so extreme that penetration, recycling, or dissociation behavior becomes unfavorable.",
  },
  {
    title: "Format and Fc choice",
    text:
      "IgG subtype, Fc silencing, and FcRn compatibility influence half-life, effector function, and how much intact ADC remains in circulation.",
  },
  {
    title: "Developability",
    text:
      "Even before payload is attached, the antibody needs strong manufacturability, low aggregation tendency, and a stable epitope-binding profile.",
  },
];

const internalizationChecks = [
  {
    title: "Surface access",
    text: "The epitope must be reachable on intact tumor cells, not buried or inconsistently exposed.",
  },
  {
    title: "Triggered uptake",
    text: "Antigen binding should promote productive endocytosis rather than leaving the ADC parked at the membrane.",
  },
  {
    title: "Lysosomal delivery",
    text: "Internalized complex needs to reach protease-rich compartments where linker cleavage or payload release can occur.",
  },
  {
    title: "Limited recycling",
    text: "If the target-antibody complex recycles back out too efficiently, payload delivery can fall even when binding looks strong.",
  },
];

const formatRows = [
  {
    format: "IgG1-like",
    strength: "Long half-life and strongest effector competence",
    risk: "May add unwanted Fc-mediated activity depending on target and payload mechanism",
  },
  {
    format: "IgG4-like",
    strength: "Can reduce some effector pressure while keeping full-length antibody PK",
    risk: "Still needs careful stability engineering and does not automatically solve off-tumor risk",
  },
  {
    format: "Fc-silenced engineered mAb",
    strength: "Helps focus the construct on delivery rather than immune recruitment",
    risk: "Fc changes can also perturb FcRn engagement or manufacturability if pushed too far",
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
    label: "RCSB PDB usage policy (CC0 for structure images)",
    href: "https://www.rcsb.org/pages/usage-policy",
  },
  {
    id: 4,
    label:
      "Antibody basic unit.svg (Wikimedia Commons, Tokenzero, CC BY-SA 4.0)",
    href: "https://commons.wikimedia.org/wiki/File:Antibody_basic_unit.svg",
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
  const [mermaidSvg, setMermaidSvg] = useState("");

  const mermaidDiagram = `flowchart TD
    A["Tumor antigen selected"] --> B{"Tumor-to-normal expression window wide enough?"}
    B -->|yes| C{"Rapid internalization after binding?"}
    B -->|no| X["Safety risk: off-tumor binding"]
    C -->|yes| D{"Stable full-length IgG PK?"}
    C -->|no| Y["Delivery risk: low lysosomal trafficking"]
    D -->|yes| E["Strong ADC mAb starting point"]
    D -->|no| Z["PK risk: Fc/FcRn or conjugation burden needs work"]

    classDef good fill:#dcfce7,stroke:#22c55e,color:#166534;
    classDef risk fill:#fee2e2,stroke:#ef4444,color:#991b1b;
    class E good;
    class X,Y,Z risk;`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const tryRender = async () => {
      const mermaid = (
        window as typeof window & {
          mermaid?: {
            render: (id: string, text: string) => Promise<{ svg: string }>;
            initialize: (cfg: { startOnLoad: boolean }) => void;
          };
        }
      ).mermaid;
      if (!mermaid) return false;
      mermaid.initialize({ startOnLoad: false });
      try {
        const { svg } = await mermaid.render(`mab-design-${Date.now()}`, mermaidDiagram);
        if (!cancelled) {
          setMermaidSvg(svg);
        }
        return true;
      } catch {
        return false;
      }
    };

    if (mermaidSvg) return;
    tryRender();
    const t1 = setTimeout(() => tryRender(), 300);
    const t2 = setTimeout(() => tryRender(), 1000);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mermaidDiagram, mermaidSvg]);

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

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            mAb in adcs
          </Chip>
          <h1 className="site-page-title font-semibold">
            the antibody defines targeting and exposure
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            The monoclonal antibody (mAb) drives antigen recognition, uptake, and
            tissue distribution. Antigen selection is one of the most critical
            decisions in ADC design.
            {cite(1)}
          </p>
        </motion.section>

        <LabeledStructureCard
          title="IgG antibody structure"
          subtitle="RCSB PDB 1IGT assembly image"
          src="https://cdn.rcsb.org/images/structures/ig/1igt/1igt_assembly-1.jpeg"
          note="RCSB PDB assembly image shown without overlay labels so the structure stays readable."
        />
        <span className="text-xs text-zinc-500">{cite(3)}</span>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              anatomy
            </p>
            <h2 className="site-page-heading font-semibold">
              antibody domains at a glance
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <ZoomableFigure label="Antibody domains at a glance">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <Image
                  src="/antibody-basic-unit.svg"
                  alt="Detailed antibody domain diagram showing VH, VL, CH1, CH2, CH3, CL, Fab, Fc, hinge region, and disulfide bonds"
                  width={1200}
                  height={900}
                  className="mx-auto h-auto max-h-[30rem] w-full object-contain"
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-2 md:grid-cols-2">
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">What it includes:</span> variable
                domains VH and VL, constant domains CH1, CH2, CH3, CL, Fab and Fc fragments, the
                hinge, antigen-binding tips, and disulfide bridges between chains.{cite(4)}
              </p>
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">Reuse status:</span> Wikimedia
                Commons figure by Tokenzero, licensed under CC BY-SA 4.0. We are using it with
                attribution and without removing the original labels.{cite(4)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              recycling
            </p>
            <h2 className="site-page-heading font-semibold">
              FcRn-driven half-life loop
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            <ZoomableFigure label="FcRn-driven half-life loop">
            <svg className="h-[28rem] w-full" viewBox="0 0 1280 560" fill="none">
              <defs>
                <linearGradient id="blood-band" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f4faff" />
                </linearGradient>
                <linearGradient id="cell-band" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eff6ff" />
                  <stop offset="100%" stopColor="#e0f2fe" />
                </linearGradient>
                <marker id="fcrn-loop-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M0 0L10 5L0 10Z" fill="#0f172a" />
                </marker>
                <marker id="fcrn-green-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M0 0L10 5L0 10Z" fill="#15803d" />
                </marker>
                <marker id="fcrn-red-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M0 0L10 5L0 10Z" fill="#b91c1c" />
                </marker>
              </defs>

              <rect x="24" y="20" width="1232" height="520" rx="34" fill="#f8fbff" stroke="#dbeafe" strokeWidth="2" />
              <rect x="56" y="48" width="1168" height="96" rx="24" fill="url(#blood-band)" stroke="#dbeafe" />
              <rect x="56" y="170" width="1168" height="338" rx="30" fill="url(#cell-band)" stroke="#bfdbfe" />
              <rect x="662" y="64" width="420" height="58" rx="22" fill="#ecfdf5" stroke="#86efac" strokeWidth="2" />
              <line x1="56" y1="168" x2="1224" y2="168" stroke="#93c5fd" strokeWidth="3" strokeDasharray="10 10" />

              <text x="88" y="88" fontSize="24" fontWeight="700" fill="#0f172a">blood / extracellular space</text>
              <text x="88" y="116" fontSize="16" fill="#475569">neutral pH ~7.4</text>
              <text x="88" y="220" fontSize="24" fontWeight="700" fill="#0f172a">acidifying endosome / sorting network</text>
              <text x="88" y="248" fontSize="16" fill="#475569">acidic pH ~6.0</text>

              <rect x="118" y="278" width="200" height="126" rx="26" fill="#ffffff" stroke="#7dd3fc" strokeWidth="2.5" />
              <rect x="392" y="278" width="220" height="126" rx="26" fill="#ffffff" stroke="#93c5fd" strokeWidth="2.5" />
              <rect x="686" y="278" width="220" height="126" rx="26" fill="#ffffff" stroke="#818cf8" strokeWidth="2.5" />
              <rect x="978" y="270" width="166" height="142" rx="26" fill="#fff1f2" stroke="#fca5a5" strokeWidth="2.5" />

              <circle cx="218" cy="318" r="14" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
              <path d="M218 332V356" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              <path d="M218 356L192 382" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              <path d="M218 356L244 382" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

              <rect x="448" y="306" width="108" height="70" rx="20" fill="#eff6ff" stroke="#60a5fa" strokeWidth="2" />
              <text x="475" y="338" fontSize="18" fontWeight="700" fill="#1d4ed8">FcRn</text>
              <text x="425" y="361" fontSize="13" fill="#475569">acidic binding site</text>
              <path d="M502 292V264" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              <path d="M502 264L474 238" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
              <path d="M502 264L530 238" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

              <rect x="736" y="308" width="126" height="66" rx="20" fill="#eef2ff" stroke="#818cf8" strokeWidth="2" />
              <text x="752" y="339" fontSize="18" fontWeight="700" fill="#4338ca">FcRn-IgG</text>
              <text x="748" y="361" fontSize="13" fill="#475569">rescued complex</text>

              <rect x="1012" y="318" width="102" height="72" rx="18" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
              <text x="1027" y="347" fontSize="18" fontWeight="700" fill="#991b1b">lysosome</text>
              <text x="1027" y="369" fontSize="13" fill="#7f1d1d">degradation</text>

              <path d="M318 342H392" stroke="#0f172a" strokeWidth="4" markerEnd="url(#fcrn-loop-arrow)" />
              <path d="M612 342H686" stroke="#0f172a" strokeWidth="4" markerEnd="url(#fcrn-loop-arrow)" />
              <path d="M906 342H978" stroke="#b91c1c" strokeWidth="4" strokeDasharray="10 9" markerEnd="url(#fcrn-red-arrow)" />
              <path d="M798 278V124" stroke="#15803d" strokeWidth="4" markerEnd="url(#fcrn-green-arrow)" />

              <text x="136" y="430" fontSize="20" fontWeight="700" fill="#0f172a">1. uptake</text>
              <text x="410" y="430" fontSize="20" fontWeight="700" fill="#0f172a">2. FcRn rescue</text>
              <text x="704" y="430" fontSize="20" fontWeight="700" fill="#0f172a">3. recycling sort</text>
              <text x="978" y="430" fontSize="20" fontWeight="700" fill="#991b1b">failure route</text>

              <text x="688" y="99" fontSize="18" fontWeight="700" fill="#166534">4. neutral-pH release back to blood</text>
              <text x="688" y="119" fontSize="13" fill="#166534">recycled IgG dissociates from FcRn at the plasma membrane</text>
            </svg>
            </ZoomableFigure>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1rem] border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-900">1. constitutive uptake</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  IgG is continuously sampled from plasma into early endosomes by nonspecific pinocytosis.
                </p>
              </div>
              <div className="rounded-[1rem] border border-blue-100 bg-blue-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-900">2. acidic FcRn binding</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  Lower endosomal pH promotes Fc-FcRn binding and diverts intact IgG away from degradation.
                </p>
              </div>
              <div className="rounded-[1rem] border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-900">3. recycling and release</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  The rescued complex is routed back to the cell surface, where neutral pH causes release into blood.
                </p>
              </div>
              <div className="rounded-[1rem] border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-900">4. failure route</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  If FcRn binding or recycling fails, IgG enters lysosomes and exposure drops because intact antibody is lost.{cite(1)}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">Why it matters:</span> FcRn salvage is a major reason full-length IgG antibodies maintain long serum half-life.{cite(1)}
              </p>
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">mAb consequence:</span> altered Fc conformation, aggregation, or poor developability can weaken FcRn engagement and shorten systemic exposure.{cite(1)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              key roles
            </p>
            <h2 className="site-page-heading font-semibold">
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
              design logic
            </p>
            <h2 className="site-page-heading font-semibold">
              how a good ADC antibody gets chosen
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4">
            <ZoomableFigure label="ADC antibody design logic flowchart">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <div
                  className="mermaid-flow [&_svg]:h-auto [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: mermaidSvg || "" }}
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {designLevers.map((item) => (
                <div key={item.title} className="rounded-[1rem] border border-sky-100 bg-sky-50/60 p-4">
                  <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-600">{item.text}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              target selection
            </p>
            <h2 className="site-page-heading font-semibold">
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
              expression window
            </p>
            <h2 className="site-page-heading font-semibold">
              tumor signal has to clear normal-tissue background
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4">
            <ZoomableFigure label="Tumor versus normal expression window">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <svg className="h-64 w-full" viewBox="0 0 900 300" fill="none">
                <rect x="54" y="28" width="792" height="220" rx="26" fill="#f8fbff" stroke="#dbeafe" />
                <line x1="110" y1="216" x2="810" y2="216" stroke="#0f172a" strokeWidth="3" />
                <line x1="110" y1="216" x2="110" y2="74" stroke="#0f172a" strokeWidth="3" />
                <rect x="170" y="164" width="110" height="52" rx="14" fill="#fee2e2" stroke="#fca5a5" />
                <rect x="338" y="132" width="118" height="84" rx="14" fill="#fde68a" stroke="#f59e0b" />
                <rect x="516" y="84" width="130" height="132" rx="14" fill="#dcfce7" stroke="#4ade80" />
                <rect x="706" y="186" width="72" height="30" rx="12" fill="#fee2e2" stroke="#fca5a5" />
                <text x="166" y="154" fontSize="18" fontWeight="700" fill="#991b1b">normal tissue</text>
                <text x="330" y="122" fontSize="18" fontWeight="700" fill="#92400e">borderline</text>
                <text x="512" y="74" fontSize="18" fontWeight="700" fill="#166534">preferred tumor window</text>
                <text x="676" y="176" fontSize="18" fontWeight="700" fill="#991b1b">escape clone</text>
                <text x="118" y="68" fontSize="16" fill="#475569">surface antigen density</text>
                <text x="748" y="244" fontSize="16" fill="#475569">cell populations</text>
                <path d="M398 122V82" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 6" />
                <path d="M580 84V54" stroke="#22c55e" strokeWidth="3" strokeDasharray="6 6" />
                <text x="350" y="74" fontSize="14" fill="#92400e">narrow safety margin</text>
                <text x="552" y="46" fontSize="14" fill="#166534">best separation from normal tissue</text>
                </svg>
              </div>
            </ZoomableFigure>
            <div className="grid gap-3 md:grid-cols-3">
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">Best-case target:</span> high and consistent tumor expression with limited healthy-tissue signal gives the mAb room to deliver payload selectively.{cite(2)}
              </p>
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">Why borderline targets hurt:</span> if normal tissue sits too close to tumor in expression level, the ADC may bind where it should not and compress the dose window.{cite(2)}
              </p>
              <p className="text-xs leading-6 text-zinc-500">
                <span className="font-semibold text-zinc-700">Why heterogeneity matters:</span> even a strong average target can fail when a meaningful tumor fraction expresses little or no antigen and escapes delivery.{cite(2)}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              trafficking
            </p>
            <h2 className="site-page-heading font-semibold">
              internalization checkpoints after binding
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {internalizationChecks.map((item, index) => (
              <div key={item.title} className="rounded-[1rem] border border-white/80 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
                  checkpoint {index + 1}
                </p>
                <p className="mt-2 text-base font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-2 text-xs leading-6 text-zinc-600">{item.text}</p>
              </div>
            ))}
          </CardBody>
        </Card>


        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              fc engineering
            </p>
            <h2 className="site-page-heading font-semibold">
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
            <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white/90">
              <div className="grid md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 md:border-b-0 md:border-r">
                  format
                </div>
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 md:border-b-0 md:border-r">
                  strength
                </div>
                <div className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  tradeoff
                </div>
                {formatRows.map((row) => (
                  <div key={row.format} className="contents">
                    <div className="border-t border-slate-200 px-4 py-4 text-sm font-semibold text-zinc-900 md:border-r">
                      {row.format}
                    </div>
                    <div className="border-t border-slate-200 px-4 py-4 text-sm text-zinc-600 md:border-r">
                      {row.strength}
                    </div>
                    <div className="border-t border-slate-200 px-4 py-4 text-sm text-zinc-600">
                      {row.risk}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              developability and risk
            </p>
            <h2 className="site-page-heading font-semibold">
              mAb-specific challenges
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Antigen downregulation, heterogeneous expression, or weak
              internalization can make an otherwise well-built antibody a poor
              delivery vehicle.
              {cite(2)}
            </p>
            <p>
              Off-tumor antigen expression, soluble antigen interference, and
              antibody aggregation risk can all narrow the usable safety window.
              {cite(2)}
            </p>
            <p className="text-xs text-zinc-500">
              Broader whole-ADC topics like linker stability and payload mechanism stay on the{" "}
              <Link href="/adcs" className="text-sky-700">
                adc overview
              </Link>{" "}
              page so this page stays focused on the antibody itself.
            </p>
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
