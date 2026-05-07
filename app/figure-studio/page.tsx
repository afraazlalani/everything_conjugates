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
  Image,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

type FigureCheck = {
  name: string;
  passed: boolean;
  note: string;
};

type FigureInterpretation = {
  modality: string;
  figureType: string;
  storyTitle: string;
  storyGoal: string;
  lanes: Array<{
    label: string;
    summary: string;
  }>;
  plainLanguageLabels: string[];
  entities: string[];
  relationships: Array<{
    from: string;
    to: string;
    label: string;
  }>;
};

type FigureReview = {
  passes: number;
  score: number;
  notes: string[];
};

type FigureRenderMode = "auto" | "composer" | "ai-image";

const starterPrompts = [
  "clean scientific schematic of an egfr adc showing antibody binding, receptor internalization, lysosomal trafficking, linker cleavage, and payload release",
  "chapter hero illustration of a duchenne oligo conjugate showing muscle targeting, cell entry, and exon-skipping biology",
  "construct architecture figure of a psma radioligand showing targeting ligand, chelator, lu-177 payload, and kidney exposure caution",
];

export default function FigureStudioPage() {
  const [figurePrompt, setFigurePrompt] = useState(starterPrompts[0]);
  const [figureStyle, setFigureStyle] = useState("scientific schematic");
  const [figureType, setFigureType] = useState("auto");
  const [figureRenderMode, setFigureRenderMode] = useState<FigureRenderMode>("auto");
  const [figureLoading, setFigureLoading] = useState(false);
  const [figureError, setFigureError] = useState("");
  const [figureUrl, setFigureUrl] = useState("");
  const [figureNote, setFigureNote] = useState("");
  const [figureSource, setFigureSource] = useState("");
  const [figureChecks, setFigureChecks] = useState<FigureCheck[]>([]);
  const [figureInterpretation, setFigureInterpretation] = useState<FigureInterpretation | null>(null);
  const [figureReview, setFigureReview] = useState<FigureReview | null>(null);
  const [figurePhase, setFigurePhase] = useState<"idle" | "understanding" | "composing" | "checking">("idle");
  const figureTimeoutRef = useRef<number | null>(null);
  const figurePhaseTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      figurePhaseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      figurePhaseTimersRef.current = [];
    };
  }, []);

  function resolveEffectiveFigureType(prompt: string, requestedType: string) {
    if (requestedType !== "auto") return requestedType;
    const text = prompt.toLowerCase();
    if (/(fcrn|acetylcholine|achr|myasthenia|neuromuscular|autoantibody|blocking|etiology|moa|pathway)/.test(text)) {
      return "disease biology figure";
    }
    return requestedType;
  }

  async function handleGenerateFigure() {
    if (!figurePrompt.trim()) return;
    setFigureLoading(true);
    setFigurePhase("understanding");
    setFigureError("");
    setFigureUrl("");
    setFigureNote("");
    setFigureSource("");
    setFigureChecks([]);
    setFigureInterpretation(null);
    setFigureReview(null);

    if (figureTimeoutRef.current) {
      window.clearTimeout(figureTimeoutRef.current);
    }

    figurePhaseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    figurePhaseTimersRef.current = [];
    figurePhaseTimersRef.current.push(
      window.setTimeout(() => setFigurePhase("composing"), 700),
      window.setTimeout(() => setFigurePhase("checking"), 1550),
    );

    const controller = new AbortController();
    figureTimeoutRef.current = window.setTimeout(() => {
      controller.abort();
      setFigureLoading(false);
      setFigurePhase("idle");
      setFigureError("figure studio timed out. try a cleaner figure type or rerun it.");
    }, 25000);

    try {
      const effectiveFigureType = resolveEffectiveFigureType(figurePrompt, figureType);
      const response = await fetch("/api/figure-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: figurePrompt,
          style: figureStyle,
          figureType: effectiveFigureType,
          renderMode: figureRenderMode,
          nonce: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("figure route failed");
      }

      const data = (await response.json()) as {
        imageUrl?: string;
        note?: string;
        source?: string;
        checks?: FigureCheck[];
        interpretation?: FigureInterpretation;
        review?: FigureReview;
      };

      if (!data.imageUrl) throw new Error("no image returned");

      setFigureUrl(data.imageUrl);
      setFigureNote(data.note ?? "");
      setFigureSource(data.source ?? "");
      setFigureChecks(data.checks ?? []);
      setFigureInterpretation(data.interpretation ?? null);
      setFigureReview(data.review ?? null);
      setFigureError("");
    } catch {
      setFigureError("figure studio couldn’t build the figure this time. try another figure type or a cleaner prompt.");
      setFigureLoading(false);
      setFigurePhase("idle");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <NavbarContent justify="end" className="gap-4">
          <NavbarItem>
            <Link href="/" className="text-sm text-zinc-600">home</Link>
          </NavbarItem>
          <NavbarItem>
            <Link href="/vision" className="text-sm text-zinc-600">vision</Link>
          </NavbarItem>
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button variant="light" radius="full" className="h-auto min-w-0 gap-2 px-3 text-sm font-normal text-zinc-600">
                  <span>design</span>
                  <span className="text-xs text-zinc-400">▾</span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="design navigation">
                <DropdownItem key="conjugates" href="/design">conjugates</DropdownItem>
                <DropdownItem key="figure-studio" href="/figure-studio">figure studio</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            figure studio
          </Chip>
          <h1 className="site-page-title font-semibold">
            turn a conjugate idea into a cleaner scientific figure
          </h1>
          <p className="max-w-4xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            this page is for visuals, not ranking. pick a figure type, give it a clear prompt, and we’ll build a deterministic scientific concept figure with internal checks instead of a flaky random image.
          </p>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[0.92fr,1.08fr]">
          <Card className="border border-white/80 bg-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                figure builder
              </p>
              <h2 className="site-page-heading font-semibold">
                choose the kind of figure first
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4">
              <Card className="border border-amber-200 bg-amber-50/70">
                <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                  <p className="font-semibold text-zinc-900">what this does well</p>
                  <p>mechanism maps, construct architecture, trafficking figures, biology views, and risk views. it’s much better for structured scientific panels than for freeform art.</p>
                </CardBody>
              </Card>
              <Textarea
                label="figure prompt"
                labelPlacement="outside"
                value={figurePrompt}
                onValueChange={setFigurePrompt}
                minRows={6}
              />
              <div className="flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="bordered"
                    radius="full"
                    className="border-sky-200 text-sky-700"
                    onPress={() => setFigurePrompt(prompt)}
                  >
                    use sample
                  </Button>
                ))}
              </div>
              <Select
                label="figure type"
                labelPlacement="outside"
                selectedKeys={[figureType]}
                onSelectionChange={(keys) => setFigureType(Array.from(keys)[0]?.toString() || "auto")}
              >
                {[
                  "auto",
                  "mechanism figure",
                  "construct architecture",
                  "cell trafficking figure",
                  "disease biology figure",
                  "expression / risk figure",
                ].map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
              <Select
                label="render mode"
                labelPlacement="outside"
                selectedKeys={[figureRenderMode]}
                onSelectionChange={(keys) =>
                  setFigureRenderMode((Array.from(keys)[0]?.toString() as FigureRenderMode) || "auto")
                }
              >
                {[
                  { key: "auto", label: "Auto" },
                  { key: "composer", label: "Structured composer" },
                  { key: "ai-image", label: "Ai image api" },
                ].map((item) => (
                  <SelectItem key={item.key}>{item.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="visual style"
                labelPlacement="outside"
                selectedKeys={[figureStyle]}
                onSelectionChange={(keys) => setFigureStyle(Array.from(keys)[0]?.toString() || "scientific schematic")}
              >
                {["scientific schematic", "mechanism flow", "hero illustration"].map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-sky-600 text-white"
                  radius="full"
                  isLoading={figureLoading}
                  isDisabled={!figurePrompt.trim()}
                  onPress={() => void handleGenerateFigure()}
                >
                  generate figure
                </Button>
                <Button
                  variant="bordered"
                  radius="full"
                  className="border-sky-200 text-sky-700"
                  onPress={() => {
                    setFigurePrompt("");
                    setFigureType("auto");
                    setFigureRenderMode("auto");
                    setFigureStyle("scientific schematic");
                    setFigureError("");
                    setFigureUrl("");
                    setFigureNote("");
                    setFigureSource("");
                    setFigureChecks([]);
                    setFigureInterpretation(null);
                    setFigureReview(null);
                  }}
                >
                  clear
                </Button>
              </div>
              {figureError ? (
                <Card className="border border-rose-200 bg-rose-50">
                  <CardBody className="text-sm text-rose-700">{figureError}</CardBody>
                </Card>
              ) : null}
              {figureNote ? (
                <Card className="border border-emerald-200 bg-emerald-50/70">
                  <CardBody className="grid gap-1 text-sm text-emerald-800">
                    <p>{figureNote}</p>
                    {figureSource ? <p className="text-emerald-700">source used: {figureSource}</p> : null}
                  </CardBody>
                </Card>
              ) : null}
            </CardBody>
          </Card>

          <div className="grid gap-4">
            <Card className="border border-white/80 bg-white/80">
              <CardHeader className="flex flex-col items-start gap-2">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                  output
                </p>
                <h2 className="site-page-heading font-semibold">
                  generated figure
                </h2>
              </CardHeader>
              <Divider />
              <CardBody>
                {figureUrl ? (
                  <div className="grid gap-4">
                    {figureInterpretation ? (
                      <Card className="border border-sky-200 bg-sky-50/70">
                        <CardBody className="grid gap-4">
                          <div className="grid gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                              what figure studio understood
                            </p>
                            <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-zinc-900">
                              {figureInterpretation.storyTitle}
                            </h3>
                            <p className="text-sm leading-7 text-zinc-600">
                              {figureInterpretation.storyGoal}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Chip className="border border-sky-200 bg-white text-sky-700">
                              modality: {figureInterpretation.modality}
                            </Chip>
                            <Chip className="border border-sky-200 bg-white text-sky-700">
                              figure type: {figureInterpretation.figureType}
                            </Chip>
                            {figureInterpretation.plainLanguageLabels.map((label) => (
                              <Chip key={label} className="border border-white bg-white text-zinc-600">
                                {label}
                              </Chip>
                            ))}
                          </div>
                          {figureInterpretation.entities.length ? (
                            <div className="grid gap-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                                named pieces
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {figureInterpretation.entities.map((entity) => (
                                  <Chip key={entity} className="border border-white bg-white text-zinc-600">
                                    {entity}
                                  </Chip>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {figureInterpretation.relationships.length ? (
                            <div className="grid gap-3 md:grid-cols-3">
                              {figureInterpretation.relationships.map((relationship) => (
                                <div
                                  key={`${relationship.from}-${relationship.label}-${relationship.to}`}
                                  className="rounded-2xl border border-white bg-white px-4 py-3"
                                >
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                                    relationship
                                  </p>
                                  <p className="mt-2 text-sm leading-7 text-zinc-700">
                                    <span className="font-semibold">{relationship.from}</span>{" "}
                                    {relationship.label}{" "}
                                    <span className="font-semibold">{relationship.to}</span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <div className="grid gap-3 md:grid-cols-3">
                            {figureInterpretation.lanes.map((lane) => (
                              <div key={lane.label} className="rounded-2xl border border-white bg-white px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                                  {lane.label}
                                </p>
                                <p className="mt-2 text-sm leading-7 text-zinc-600">
                                  {lane.summary}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    ) : null}
                    {figureReview ? (
                      <Card className="border border-zinc-200 bg-zinc-50/70">
                        <CardBody className="grid gap-3">
                          <div className="flex flex-wrap gap-2">
                            <Chip className="border border-zinc-200 bg-white text-zinc-700">
                              architect to renderer to reviewer
                            </Chip>
                            <Chip className="border border-zinc-200 bg-white text-zinc-700">
                              review passes: {figureReview.passes}
                            </Chip>
                            <Chip className="border border-zinc-200 bg-white text-zinc-700">
                              review score: {figureReview.score}/10
                            </Chip>
                          </div>
                          <div className="grid gap-2">
                            {figureReview.notes.map((note) => (
                              <p key={note} className="text-sm leading-7 text-zinc-600">
                                {note}
                              </p>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    ) : null}
                    <Image
                      src={figureUrl}
                      alt="Generated scientific figure"
                      className="w-full rounded-[1rem] object-cover"
                      onLoad={() => {
                        setFigureLoading(false);
                        setFigurePhase("idle");
                        setFigureError("");
                        if (figureTimeoutRef.current) {
                          window.clearTimeout(figureTimeoutRef.current);
                          figureTimeoutRef.current = null;
                        }
                        figurePhaseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
                        figurePhaseTimersRef.current = [];
                      }}
                      onError={() => {
                        setFigureLoading(false);
                        setFigurePhase("idle");
                        if (figureTimeoutRef.current) {
                          window.clearTimeout(figureTimeoutRef.current);
                          figureTimeoutRef.current = null;
                        }
                        figurePhaseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
                        figurePhaseTimersRef.current = [];
                        setFigureError("the figure came back unreadable this time. try another figure type.");
                      }}
                    />
                    <p className="text-sm text-zinc-500">
                      if the layout is still off, change the figure type before changing the whole prompt. the composer behaves much better that way.
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-[30rem] items-center justify-center rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm leading-7 text-zinc-500">
                    {figureLoading
                      ? figurePhase === "understanding"
                        ? "understanding your prompt..."
                        : figurePhase === "composing"
                          ? "composing the figure layout..."
                          : "checking the figure before showing it..."
                      : "your generated figure will show up here."}
                  </div>
                )}
              </CardBody>
            </Card>

            {figureChecks.length ? (
              <Card className="border border-sky-200 bg-sky-50/70">
                <CardHeader className="flex flex-col items-start gap-2">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                    validation
                  </p>
                  <h2 className="site-card-heading font-semibold">
                    internal figure checks
                  </h2>
                </CardHeader>
                <Divider />
                <CardBody className="grid gap-3 md:grid-cols-2">
                  {figureChecks.map((check) => (
                    <div
                      key={check.name}
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        check.passed
                          ? "border-emerald-200 bg-white text-emerald-800"
                          : "border-amber-200 bg-white text-amber-800"
                      }`}
                    >
                      <p className="font-semibold">{check.name}</p>
                      <p className="text-zinc-600">{check.note}</p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
