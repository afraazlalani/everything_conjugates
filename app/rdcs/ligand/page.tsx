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

export default function RdcLigandPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="rdc" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/rdcs" className="text-sm text-sky-700">
            rdc overview
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
            ligand
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            ligands choose the target
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            RDC ligands bind specific receptors or antigens, guiding radionuclides
            to diseased tissues for localized radiation delivery.
          </p>
        </motion.section>

        <MoleculeCard label="targeting ligand" variant="ligand" />

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              design notes
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              key considerations
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Target expression, binding affinity, and internalization influence
              radiation dose delivery to the tumor.
            </p>
            <p>
              Ligand choice affects clearance and background exposure in healthy
              organs.
            </p>
          </CardBody>
        </Card>


        <SourceList
          items={[
            {
              label: "LUTATHERA (lutetium Lu 177 dotatate) prescribing information (FDA)",
              href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/208700s000lbl.pdf",
            },
            {
              label: "PLUVICTO (lutetium Lu 177 vipivotide tetraxetan) prescribing information (FDA)",
              href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/215833s000lbl.pdf",
            },
          ]}
        />
      </main>
    </div>
  );
}