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
      "Antibody‑directed enzyme prodrug therapy (ADEPT): concepts and developments (Advanced Drug Delivery Reviews, 1997)",
    href: "https://pubmed.ncbi.nlm.nih.gov/9363870/",
  },
  {
    id: 2,
    label:
      "Targeted enzyme prodrug therapy using 2′‑deoxyribosyltransferase conjugates (Biomolecules, 2024) — CC BY",
    href: "https://www.mdpi.com/2218-273X/14/8/894",
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
    title: "targeting moiety",
    desc: "antibodies or ligands guide enzymes to specific cells or tissues.",
  },
  {
    title: "enzyme",
    desc: "catalyzes conversion of a prodrug or generates a local effect.",
  },
  {
    title: "prodrug or substrate",
    desc: "activated at the target site to reduce systemic toxicity.",
  },
];

export default function EnzymePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="enzyme" />

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
            enzyme conjugates
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            catalytic activity at the target site
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            Enzyme conjugates pair targeting moieties with enzymes to generate a
            localized therapeutic effect, often by converting a prodrug at the
            target site.
            {cite(1)}
            {cite(2)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} href="/enzymes/targeting" radius="full" className="bg-sky-600 text-white">
              targeting page
            </Button>
            <Button
              as={Link}
              href="/enzymes/enzyme"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              enzyme page
            </Button>
            <Button
              as={Link}
              href="/enzymes/prodrug"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              prodrug page
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
          <MoleculeCard label="targeting antibody" variant="antibody" />
          <MoleculeCard label="enzyme" variant="enzyme" />
          <MoleculeCard label="prodrug substrate" variant="payload" />
        </section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              cc‑by diagram
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              targeted enzyme prodrug therapy
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-3 text-sm text-zinc-600">
            <Image
              src="/images/ccby/enzyme-idept-mdpi-fig1.png"
              alt="Targeted enzyme prodrug therapy schematic (CC BY)"
              className="w-full rounded-xl border border-white/70 bg-white/60 p-3"
            />
            <p className="text-xs text-zinc-500">
              CC‑BY figure from MDPI Biomolecules. {cite(2)}
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
