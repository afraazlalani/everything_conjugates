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

export default function SmdcLinkerPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="smdc" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/smdcs" className="text-sm text-sky-700">
            smdc overview
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
            linker
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            linkers shape release and exposure
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            SMDC linkers tune stability, release kinetics, and payload exposure in
            circulation and at the target site.
          </p>
        </motion.section>

        <MoleculeCard label="linker" variant="linker" />

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              design notes
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              stability vs release
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Linker chemistry is aligned with ligand uptake and the intracellular
              environment to avoid premature payload loss.
            </p>
            <p>
              Cleavable designs can enable bystander effects, while more stable
              linkers may reduce off-target exposure.
            </p>
          </CardBody>
        </Card>


        <SourceList
          items={[
            {
              label:
                "Small-Molecule Drug Conjugates: A Review of Recent Advances (Molecular Pharmaceutics, 2024)",
              href: "https://pubs.acs.org/doi/10.1021/acs.molpharmaceut.4c00009",
            },
            {
              label:
                "Small-molecule drug conjugates: Recent advances and future prospects (Chinese Chemical Letters, 2024)",
              href: "https://www.sciencedirect.com/science/article/pii/S1001841724000747",
            },
          ]}
        />
      </main>
    </div>
  );
}