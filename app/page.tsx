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
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";

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
    title: "lysine acylation (NHS esters)",
    desc: "classic amide formation on exposed lysines; robust but heterogeneous DAR distributions.",
    ref: 1,
    href: "/chemistry/lysine",
  },
  {
    title: "cysteine conjugation (maleimide)",
    desc: "thiol–maleimide coupling after partial disulfide reduction; widely used for ADCs.",
    ref: 1,
    href: "/chemistry/cysteine",
  },
  {
    title: "site-specific cysteine engineering",
    desc: "engineered cysteines (e.g., THIOMAB-style) for tighter DAR control and stability.",
    ref: 2,
    href: "/chemistry/site-specific",
  },
  {
    title: "enzymatic or glycan remodeling",
    desc: "enzyme-assisted conjugation or Fc glycan editing for defined, homogeneous products.",
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="main" />

      <div className="fixed left-6 top-24 z-30">
        <Dropdown>
          <DropdownTrigger>
            <Button className="bg-white/80 border border-white/70 text-zinc-700" radius="full">
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-4 bg-zinc-700" />
                <span className="h-0.5 w-4 bg-zinc-700" />
                <span className="h-0.5 w-4 bg-zinc-700" />
              </span>
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="site navigation">
            <DropdownItem key="home" href="#top">home</DropdownItem>
            <DropdownItem key="vision" href="/vision">vision</DropdownItem>
            <DropdownItem key="suggestionss" href="/design">suggestions</DropdownItem>
            <DropdownItem key="suggestions" href="/suggestions">suggestions</DropdownItem>
            <DropdownItem key="creator" href="#creator">creator</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <NavbarContent justify="end" className="gap-4">
          {[
            { label: "home", href: "#top" },
            { label: "vision", href: "/vision" },
            { label: "design", href: "/design" },
            { label: "suggestions", href: "/suggestions" },
            { label: "creator", href: "#creator" },
          ].map((item) => (
            <NavbarItem key={item.label}>
              <Link href={item.href} className="text-sm text-zinc-600">
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      </Navbar>

      <main id="top" className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-12">

        <motion.section id="overview"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="flex flex-col gap-6">
            <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
              modern atlas of conjugate modalities
            </Chip>
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight font-[family-name:var(--font-space-grotesk)]">
              beyond ADCs — a full-spectrum map of conjugate science
            </h1>
            <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
              Everything Conjugates brings together the core modalities, design
              levers, and clinical context of drug conjugates in one modern, visual
              place. Built for biotech researchers who want clarity fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                as={Link}
                href="#modalities"
                className="bg-sky-600 text-white"
                radius="full"
              >
                explore modalities
              </Button>
              <Button
                as={Link}
                href="#conjugation-chemistry"
                variant="bordered"
                radius="full"
                className="border-sky-200 text-sky-700"
              >
                conjugation chemistry
              </Button>
            </div>
          </div>

          <Card className="bg-white/70 border border-white/70 shadow-xl">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-500 font-medium">
                at a glance
              </p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                modality coverage
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
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
                    className="bg-sky-50 text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
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
            <h3 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              conjugate types
            </h3>
            <span className="text-sm text-zinc-500">
              curated summaries with room to grow
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {conjugates.map((item) => (
              <Card
                key={item.title}
                id={item.slug}
                className="glance-target bg-white/70 border border-white/80 hover:border-sky-200 transition"
              >
                <CardBody className="flex flex-col gap-3">
                  <Link href={`/${item.slug}`} className="w-fit text-zinc-900">
                    <h4 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                      {item.title}
                    </h4>
                  </Link>
                  <p className="text-sm text-zinc-600">{item.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={tagLinks[item.slug]?.[tag] ?? `/${item.slug}`}
                        className="no-underline"
                      >
                        <Chip size="sm" className="bg-white text-zinc-700">
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
            <h3 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              conjugation chemistry
            </h3>
            <span className="text-sm text-zinc-500">
              shared toolkits across conjugate modalities
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {conjugationChemistry.map((item) => (
              <Card
                key={item.title}
                as={Link}
                href={item.href}
                className="bg-white/70 border border-white/80 hover:border-sky-200"
              >
                <CardBody className="flex flex-col gap-2">
                  <h4 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                    {item.title}
                  </h4>
                  <p className="text-sm text-zinc-600">
                    {item.desc}
                    {cite(item.ref)}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section id="creator" className="flex items-center justify-between rounded-3xl border border-white/70 bg-white/70 px-6 py-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.3em] text-sky-500">creator</span>
            <p className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">Afraaz Lalani</p>
            <p className="text-lg font-[family-name:var(--font-space-grotesk)] text-zinc-600">Biotech scientist</p>
            <Link
              href="https://www.linkedin.com/in/afraaz-lalani/"
              className="text-sm text-sky-700"
            >
              LinkedIn
            </Link>
          </div>
          <div className="h-10 w-10 rounded-full bg-sky-500/10 border border-sky-200" />
        </section>

        <section className="grid gap-4 rounded-3xl border border-white/70 bg-white/70 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.3em] text-sky-500">traffic</span>
              <h3 className="text-xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                audience pulse
              </h3>
            </div>
            <span className="text-xs text-zinc-500">editable</span>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: "today", key: "today" },
              { label: "this week", key: "week" },
              { label: "this month", key: "month" },
              { label: "this year", key: "year" },
              { label: "total", key: "total" },
            ].map((item) => (
              <Input
                key={item.key}
                label={item.label}
                labelPlacement="outside"
                size="sm"
                value={(traffic as Record<string, string>)[item.key]}
                onValueChange={(value) =>
                  setTraffic((prev) => ({ ...prev, [item.key]: value }))
                }
              />
            ))}
          </div>
        </section>

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
