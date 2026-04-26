"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
} from "@heroui/react";
import { motion } from "framer-motion";
import { SiteShell } from "@/components/SiteShell";

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
    <SiteShell motif="vision" mainClassName="max-w-5xl">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="site-chip">
            vision
          </Chip>
          <h1 className="site-section-title font-semibold">
            a one-stop atlas for bioconjugates
          </h1>
          <p className="site-copy font-[family-name:var(--font-manrope)]">
            Everything Conjugates is built to be the single place where scientists
            can understand, compare, and design conjugates — from fundamental
            chemistry to clinical translation.
          </p>
        </motion.section>

        <section className="grid gap-6 md:grid-cols-2">
          {pillars.map((item) => (
            <Card key={item.title} className="site-panel">
              <CardBody className="flex flex-col gap-2">
                <h3 className="site-section-heading text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="site-copy-sm">{item.desc}</p>
              </CardBody>
            </Card>
          ))}
        </section>

        <Card className="site-panel">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="site-eyebrow">
              scope
            </p>
            <h2 className="site-section-heading text-2xl font-semibold">
              what we are building toward
            </h2>
          </CardHeader>
          <Divider className="site-divider" />
          <CardBody className="flex flex-col gap-3 text-sm text-slate-300">
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
    </SiteShell>
  );
}
