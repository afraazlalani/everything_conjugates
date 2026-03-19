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
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";

const pillars = [
  {
    title: "comprehensive",
    desc: "every conjugate class, every component, real structures, and multi-source citations.",
  },
  {
    title: "actionable",
    desc: "not just definitions — design levers, failure points, and practical tradeoffs.",
  },
  {
    title: "evidence-first",
    desc: "all claims anchored to primary literature, databases, and labels.",
  },
  {
    title: "built with you",
    desc: "iterative edits driven by expert review and real-world needs.",
  },
];

export default function VisionPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <NavbarContent justify="end" className="gap-4">
          {[
            { label: "home", href: "/" },
            { label: "vision", href: "/vision" },
            { label: "design", href: "/design" },
          ].map((item) => (
            <NavbarItem key={item.label}>
              <Link href={item.href} className="text-sm text-zinc-600">
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            vision
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            a one-stop atlas for bioconjugates
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            Everything Conjugates is built to be the single place where scientists
            can understand, compare, and design conjugates — from fundamental
            chemistry to clinical translation.
          </p>
        </motion.section>

        <section className="grid gap-6 md:grid-cols-2">
          {pillars.map((item) => (
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

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              scope
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what we are building toward
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            <p>
              A living knowledge base that includes modalities, mechanisms,
              structures, linkers, payloads, PK/PD, toxicity, analytics, and
              clinical landscape — with citations on every page.
            </p>
            <p>
              If this misses any part of your vision, tell me and I will expand
              it until it matches what you want to show on your PhD application.
            </p>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
