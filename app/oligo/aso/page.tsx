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
import { SourceList } from "@/components/SourceList";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";

export default function AsoPage() {
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

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            ASO
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            antisense oligonucleotide conjugates
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            ASOs bind RNA to block translation or induce degradation. Conjugation
            strategies improve delivery to specific tissues and cell types.
          </p>
        </motion.section>

        <MoleculeCard label="ASO strand" variant="oligo" />

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              delivery focus
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              key considerations
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              ASO chemistry and conjugation determine stability, uptake, and
              biodistribution.
            </p>
            <p>
              Ligand or antibody conjugates can increase selectivity and reduce
              systemic exposure.
            </p>
          </CardBody>
        </Card>


        <SourceList
          items={[
            {
              label:
                "Chemistry, Structure, and Function of Approved Oligonucleotide Therapeutics (Nucleic Acids Research, 2023)",
              href: "https://academic.oup.com/nar/article/51/6/2529/7047002",
            },
          ]}
        />
      </main>
    </div>
  );
}