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

export default function EnzymeProdrugPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="enzyme" />

      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/enzymes" className="text-sm text-sky-700">
            enzyme overview
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
            prodrug
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            prodrugs become active at the target site
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            In enzyme conjugate strategies, the prodrug is designed to remain
            inactive until enzymatic conversion occurs at the target tissue.
          </p>
        </motion.section>

        <MoleculeCard label="prodrug substrate" variant="payload" />

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              design notes
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              why prodrugs matter
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              Prodrug activation at the target site is intended to lower systemic
              toxicity and improve therapeutic index.
            </p>
            <p>
              The prodrug must be a good substrate for the conjugated enzyme and
              stable in circulation.
            </p>
          </CardBody>
        </Card>


        <SourceList
          items={[
            {
              label:
                "Antibody-directed enzyme prodrug therapy (ADEPT): concepts and developments (Advanced Drug Delivery Reviews, 1997)",
              href: "https://pubmed.ncbi.nlm.nih.gov/9363870/",
            },
          ]}
        />
      </main>
    </div>
  );
}