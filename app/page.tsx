"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Link,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";

const conjugates = [
  {
    slug: "adcs",
    title: "Antibody-Drug Conjugates (ADCs)",
    desc: "Monoclonal antibodies linked to potent payloads for targeted delivery, with cleavable or non-cleavable linkers.",
    tags: ["mAb", "linker", "payload"],
  },
  {
    slug: "pdcs",
    title: "Peptide-Drug Conjugates (PDCs)",
    desc: "Short, selective peptides paired with cytotoxins or imaging agents for rapid tissue penetration.",
    tags: ["peptide", "linker", "payload"],
  },
  {
    slug: "smdcs",
    title: "Small Molecule-Drug Conjugates (SMDCs)",
    desc: "Small-molecule ligands guiding payloads to targets with compact size and tunable pharmacokinetics.",
    tags: ["ligand", "linker", "payload"],
  },
  {
    slug: "oligo",
    title: "Oligonucleotide Conjugates (siRNA/PMO/ASO)",
    desc: "Antibody or ligand conjugates that deliver oligonucleotides for gene silencing or splicing modulation.",
    tags: ["siRNA", "PMO", "ASO"],
  },
  {
    slug: "enzymes",
    title: "Enzyme Conjugates",
    desc: "Enzymes coupled to targeting moieties to amplify signal or catalyze local therapeutic effects.",
    tags: ["enzyme", "prodrug", "targeting"],
  },
  {
    slug: "rdcs",
    title: "Radionuclide Drug Conjugates (RDCs)",
    desc: "Targeted carriers delivering alpha or beta emitters for precise radiotherapeutic impact.",
    tags: ["ligand", "chelator", "radionuclide"],
  },
];

const conjugationChemistry = [
  {
    title: "Lysine acylation (NHS esters)",
    desc: "Classic amide formation on exposed lysines; robust but heterogeneous DAR distributions.",
    ref: 1,
    href: "/chemistry/lysine",
  },
  {
    title: "Cysteine conjugation (maleimide)",
    desc: "Thiol-maleimide coupling after partial disulfide reduction; widely used for ADCs.",
    ref: 1,
    href: "/chemistry/cysteine",
  },
  {
    title: "Site-specific cysteine engineering",
    desc: "Engineered cysteines (e.g., THIOMAB-style) for tighter DAR control and stability.",
    ref: 2,
    href: "/chemistry/site-specific",
  },
  {
    title: "Enzymatic or glycan remodeling",
    desc: "Enzyme-assisted conjugation or Fc glycan editing for defined, homogeneous products.",
    ref: 2,
    href: "/chemistry/enzymatic",
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
      "Linker in antibody–drug conjugates: a review of linker chemistry (Antibody Therapeutics, 2024)",
    href: "https://academic.oup.com/abt/article/7/3/tbae020/7717690",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const tagLinks: Record<string, Record<string, string>> = {
  adcs: {
    mAb: "/adcs/mab",
    linker: "/adcs/linker",
    payload: "/adcs/payload",
  },
  pdcs: {
    peptide: "/pdcs/peptide",
    linker: "/pdcs/linker",
    payload: "/pdcs/payload",
  },
  smdcs: {
    ligand: "/smdcs/ligand",
    linker: "/smdcs/linker",
    payload: "/smdcs/payload",
  },
  oligo: {
    siRNA: "/oligo/sirna",
    PMO: "/oligo/pmo",
    ASO: "/oligo/aso",
  },
  enzymes: {
    enzyme: "/enzymes/enzyme",
    prodrug: "/enzymes/prodrug",
    targeting: "/enzymes/targeting",
  },
  rdcs: {
    ligand: "/rdcs/ligand",
    chelator: "/rdcs/chelator",
    radionuclide: "/rdcs/radionuclide",
  },
};

export default function Home() {
  const [traffic, setTraffic] = useState(() => {
    if (typeof window === "undefined") {
      return {
        today: "",
        week: "",
        month: "",
        year: "",
        total: "",
      };
    }

    const saved = window.localStorage.getItem("traffic-metrics");
    if (!saved) {
      return {
        today: "",
        week: "",
        month: "",
        year: "",
        total: "",
      };
    }

    try {
      return JSON.parse(saved);
    } catch {
      return {
        today: "",
        week: "",
        month: "",
        year: "",
        total: "",
      };
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("traffic-metrics", JSON.stringify(traffic));
  }, [traffic]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flashTarget = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const el = document.querySelector(hash);
      if (!el) return;
      el.classList.add("glance-flash");
      window.setTimeout(() => {
        el.classList.remove("glance-flash");
      }, 2000);
    };
    flashTarget();
    window.addEventListener("hashchange", flashTarget);
    return () => window.removeEventListener("hashchange", flashTarget);
  }, []);


  return (
    <SiteShell motif="main" mainClassName="max-w-6xl">
      <div className="fixed left-6 top-24 z-30">
        <Dropdown>
          <DropdownTrigger>
            <Button className="border border-white/10 bg-slate-950/72 text-slate-200 backdrop-blur-md" radius="full">
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-4 bg-slate-200" />
                <span className="h-0.5 w-4 bg-slate-200" />
                <span className="h-0.5 w-4 bg-slate-200" />
              </span>
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="site navigation">
            <DropdownItem key="home" href="#top">Home</DropdownItem>
            <DropdownItem key="vision" href="/vision">Vision</DropdownItem>
            <DropdownItem key="conjugates" href="/design">Conjugates</DropdownItem>
            <DropdownItem key="figure-studio" href="/figure-studio">Figure studio</DropdownItem>
            <DropdownItem key="suggestions" href="/suggestions">Suggestions</DropdownItem>
            <DropdownItem key="creator" href="#creator">Creator</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <main id="top" className="relative flex w-full flex-col gap-12">

        <motion.section id="overview"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="flex flex-col gap-6">
            <Chip className="site-chip">
              Modern atlas of conjugate modalities
            </Chip>
            <h1 className="site-section-title font-semibold">
              Beyond ADCs: a full-spectrum map of conjugate science
            </h1>
            <p className="site-copy font-[family-name:var(--font-manrope)]">
              Everything Conjugates brings together the core modalities, design
              levers, and clinical context of drug conjugates in one modern, visual
              place. Built for biotech researchers who want clarity fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                as={Link}
                href="#modalities"
                className="bg-sky-400 text-slate-950 font-medium"
                radius="full"
              >
                Explore modalities
              </Button>
              <Button
                as={Link}
                href="#conjugation-chemistry"
                variant="bordered"
                radius="full"
                className="border-sky-300/25 text-sky-200"
              >
                Conjugation chemistry
              </Button>
            </div>
          </div>

          <Card className="site-panel">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="site-eyebrow">
                At a glance
              </p>
              <h2 className="site-section-heading font-semibold">
                Modality coverage
              </h2>
            </CardHeader>
            <Divider className="site-divider" />
            <CardBody className="flex flex-col gap-4 text-sm leading-7 text-slate-300">
              <p>
                The atlas is organized around six conjugate families, each with
                its own design constraints, payload options, and translational
                patterns.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Antibody-drug conjugates", href: "#adcs" },
                  { label: "Peptide-drug conjugates", href: "#pdcs" },
                  { label: "Small molecule-drug conjugates", href: "#smdcs" },
                  { label: "Oligonucleotide conjugates", href: "#oligo" },
                  { label: "Enzyme conjugates", href: "#enzymes" },
                  { label: "Radionuclide drug conjugates", href: "#rdcs" },
                ].map((item) => (
                  <Chip
                    key={item.label}
                    as={Link}
                    href={item.href}
                    className="border border-sky-300/15 bg-sky-500/10 text-sky-200 hover:text-white hover:underline cursor-pointer"
                  >
                    {item.label}
                  </Chip>
                ))}
              </div>
              <p>
                Built to scale into detailed pages with data tables, mechanism
                diagrams, and literature snapshots.
              </p>
            </CardBody>
          </Card>
        </motion.section>

        <section id="modalities" className="grid gap-6">
          <div className="flex items-center justify-between">
            <h3 className="site-section-heading font-semibold">
              Conjugate types
            </h3>
            <span className="text-sm font-medium text-slate-500">
              Curated summaries with room to grow
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {conjugates.map((item) => (
              <Card
                key={item.title}
                id={item.slug}
                className="glance-target site-panel hover:border-sky-300/30 transition"
              >
                <CardBody className="flex flex-col gap-3">
                  <Link href={`/${item.slug}`} className="site-panel-title w-fit">
                    <h4 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                      {item.title}
                    </h4>
                  </Link>
                  <p className="site-copy-sm">{item.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={tagLinks[item.slug]?.[tag] ?? `/${item.slug}`}
                        className="no-underline"
                      >
                        <Chip size="sm" className="border border-sky-200 bg-sky-50 text-sky-800">
                          {tag}
                        </Chip>
                      </Link>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section id="conjugation-chemistry" className="grid gap-6">
          <div className="flex items-center justify-between">
            <h3 className="site-section-heading font-semibold">
              Conjugation chemistry
            </h3>
            <span className="text-sm font-medium text-slate-500">
              Shared toolkits across conjugate modalities
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {conjugationChemistry.map((item) => (
              <Card
                key={item.title}
                as={Link}
                href={item.href}
                className="site-panel hover:border-sky-300/30"
              >
                <CardBody className="flex flex-col gap-2">
                  <h4 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                    {item.title}
                  </h4>
                  <p className="site-copy-sm">
                    {item.desc}
                    {cite(item.ref)}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section id="creator" className="site-panel flex items-center justify-between rounded-3xl px-6 py-5">
          <div className="flex flex-col gap-1">
            <span className="site-eyebrow">Creator</span>
            <p className="site-panel-title text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">Afraaz Lalani</p>
            <p className="site-panel-note text-lg font-[family-name:var(--font-space-grotesk)]">Biotech scientist</p>
            <Link
              href="https://www.linkedin.com/in/afraaz-lalani/"
              className="site-link text-sm"
            >
              LinkedIn
            </Link>
          </div>
          <div className="h-10 w-10 rounded-full border border-sky-300/20 bg-sky-400/10" />
        </section>

        <section className="site-panel grid gap-4 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="site-eyebrow">Traffic</span>
              <h3 className="site-section-heading font-semibold">
                Audience pulse
              </h3>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Editable</span>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: "Today", key: "today" },
              { label: "This week", key: "week" },
              { label: "This month", key: "month" },
              { label: "This year", key: "year" },
              { label: "Total", key: "total" },
            ].map((item) => (
              <Input
                key={item.key}
                label={item.label}
                labelPlacement="outside"
                size="sm"
                value={(traffic as Record<string, string>)[item.key]}
                onValueChange={(value) =>
                  setTraffic((prev: typeof traffic) => ({ ...prev, [item.key]: value }))
                }
              />
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="site-section-heading font-semibold">
            References
          </h3>
          <ol className="list-decimal pl-6 text-sm leading-7 text-slate-600">
            {references.map((ref) => (
              <li key={ref.id} id={`ref-${ref.id}`}>
                <Link href={ref.href} className="site-link">
                  {ref.label}
                </Link>
              </li>
            ))}
          </ol>
        </section>

      </main>
    </SiteShell>
  );
}
