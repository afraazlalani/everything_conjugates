"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  Switch,
  Textarea,
  Button,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const modalities = ["ADC", "PDC", "SMDC", "Oligo", "Enzyme", "RDC"];

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: { label: string; href: string }[];
  options?: string[];
};

const STORAGE_KEY = "design-chat";
const FORM_KEY = "design-form";

function getStoredChatLog(): ChatMessage[] {
  if (typeof window === "undefined") {
    return [
      {
        role: "assistant",
        text:
          "Tell me what you want to build. I’ll use your inputs above, sanity‑check the idea, and suggest better options if needed. Example: ‘I want an ADC for HER2+ breast cancer with bystander activity.’",
      },
    ];
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return [
      {
        role: "assistant",
        text:
          "Tell me what you want to build. I’ll use your inputs above, sanity‑check the idea, and suggest better options if needed. Example: ‘I want an ADC for HER2+ breast cancer with bystander activity.’",
      },
    ];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [
      {
        role: "assistant",
        text:
          "Tell me what you want to build. I’ll use your inputs above, sanity‑check the idea, and suggest better options if needed. Example: ‘I want an ADC for HER2+ breast cancer with bystander activity.’",
      },
    ];
  }
}

function getStoredForm() {
  if (typeof window === "undefined") {
    return {
      idea: "",
      mustHave: "",
      avoid: "",
      indication: "",
      target: "",
      constraints: "",
      showAdvanced: true,
      modality: "",
      targetExpression: "",
      internalization: "",
      payloadClass: "",
      linkerType: "",
      bystander: "",
    };
  }

  const saved = window.localStorage.getItem(FORM_KEY);
  if (!saved) {
    return {
      idea: "",
      mustHave: "",
      avoid: "",
      indication: "",
      target: "",
      constraints: "",
      showAdvanced: true,
      modality: "",
      targetExpression: "",
      internalization: "",
      payloadClass: "",
      linkerType: "",
      bystander: "",
    };
  }

  try {
    const data = JSON.parse(saved);
    return {
      idea: data.idea ?? "",
      mustHave: data.mustHave ?? "",
      avoid: data.avoid ?? "",
      indication: data.indication ?? "",
      target: data.target ?? "",
      constraints: data.constraints ?? "",
      showAdvanced: Boolean(data.showAdvanced),
      modality: data.modality ?? "",
      targetExpression: data.targetExpression ?? "",
      internalization: data.internalization ?? "",
      payloadClass: data.payloadClass ?? "",
      linkerType: data.linkerType ?? "",
      bystander: data.bystander ?? "",
    };
  } catch {
    return {
      idea: "",
      mustHave: "",
      avoid: "",
      indication: "",
      target: "",
      constraints: "",
      showAdvanced: true,
      modality: "",
      targetExpression: "",
      internalization: "",
      payloadClass: "",
      linkerType: "",
      bystander: "",
    };
  }
}

export default function DesignPage() {
  const storedForm = getStoredForm();

  const [idea, setIdea] = useState(storedForm.idea);
  const [mustHave, setMustHave] = useState(storedForm.mustHave);
  const [avoid, setAvoid] = useState(storedForm.avoid);
  const [indication] = useState(storedForm.indication);
  const [target, setTarget] = useState(storedForm.target);
  const [constraints, setConstraints] = useState(storedForm.constraints);
  const [showAdvanced, setShowAdvanced] = useState(storedForm.showAdvanced);

  const [modality, setModality] = useState(storedForm.modality);
  const [targetExpression, setTargetExpression] = useState(storedForm.targetExpression);
  const [internalization, setInternalization] = useState(storedForm.internalization);
  const [payloadClass, setPayloadClass] = useState(storedForm.payloadClass);
  const [linkerType, setLinkerType] = useState(storedForm.linkerType);
  const [bystander, setBystander] = useState(storedForm.bystander);

  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>(() => getStoredChatLog());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chatLog));
  }, [chatLog]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      FORM_KEY,
      JSON.stringify({
        idea,
        mustHave,
        avoid,
        indication,
        target,
        constraints,
        showAdvanced,
        modality,
        targetExpression,
        internalization,
        payloadClass,
        linkerType,
        bystander,
      })
    );
  }, [
    idea,
    mustHave,
    avoid,
    indication,
    target,
    constraints,
    showAdvanced,
    modality,
    targetExpression,
    internalization,
    payloadClass,
    linkerType,
    bystander,
  ]);

  function buildContext() {
    const bits: string[] = [];
    if (modality) bits.push(`modality: ${modality}`);
    if (target) bits.push(`target/indication: ${target}`);
    if (targetExpression) bits.push(`expression: ${targetExpression}`);
    if (internalization) bits.push(`internalization: ${internalization}`);
    if (payloadClass) bits.push(`payload: ${payloadClass}`);
    if (linkerType) bits.push(`linker: ${linkerType}`);
    if (bystander) bits.push(`bystander: ${bystander}`);
    if (mustHave) bits.push(`must-have: ${mustHave}`);
    if (avoid) bits.push(`avoid: ${avoid}`);
    if (constraints) bits.push(`constraints: ${constraints}`);
    return bits.length ? `context → ${bits.join(" | ")}` : "";
  }

  const suggestion = (() => {
    const ideas: string[] = [];
    const context = buildContext();
    if (context) ideas.push(context);
    if (modality) ideas.push(`Modality: ${modality}`);
    if (bystander.toLowerCase().includes("yes")) {
      if (modality.toLowerCase().includes("oligo")) {
        ideas.push(
          "Bystander effect is unlikely with oligonucleotide conjugates; consider switching to an ADC or drop the bystander requirement."
        );
      } else {
        ideas.push("Prioritize membrane‑permeable payloads and cleavable linkers to enable bystander effect.");
      }
    }
    if (targetExpression.toLowerCase().includes("low")) {
      ideas.push("Low expression targets may require higher affinity or alternate modalities.");
    }
    if (internalization.toLowerCase().includes("slow")) {
      ideas.push("Slow internalization may reduce payload release; consider target alternatives or non‑cleavable designs.");
    }
    return ideas.length
      ? ideas.join(" • ")
      : "Add details below or use the chat to get tailored scientific guidance.";
  })();

  function buildAssistantResponse(input: string): ChatMessage {
    const normalized = input.toLowerCase();
    const wantsBystander = normalized.includes("bystander");
    const mentionsOligo = normalized.includes("oligo") || normalized.includes("aoc") || normalized.includes("oligonucleotide");
    const mentionsBreast = normalized.includes("breast cancer") || normalized.includes("breast");
    const mentionsADC = normalized.includes("adc");

    const sources: { label: string; href: string }[] = [];
    let text = "";
    let options: string[] = [];

    if (mentionsOligo && wantsBystander) {
      text +=
        "Bystander effect is usually driven by membrane‑permeable cytotoxic payloads used in ADCs; oligonucleotide conjugates are designed for intracellular gene modulation, so bystander killing is unlikely. You can either switch to an ADC or keep the oligo and drop the bystander requirement.";
      sources.push(
        {
          label: "ADC bystander effect review (2024)",
          href: "https://pubmed.ncbi.nlm.nih.gov/41061840/",
        },
        {
          label: "Payload permeability and bystander effect (2024)",
          href: "https://academic.oup.com/abt/advance-article/doi/10.1093/abt/tbaf004/8085092",
        }
      );
      options = ["Switch to ADC", "Keep oligo, drop bystander", "Not sure yet"];
    }

    if (mentionsBreast && mentionsOligo) {
      text +=
        (text ? " " : "") +
        "For breast cancer, clinical evidence and approvals are strongest for ADCs right now. AOC programs are still early and have focused more on muscle/rare diseases so far.";
      sources.push(
        {
          label: "ADCs in breast cancer review (2025)",
          href: "https://pubmed.ncbi.nlm.nih.gov/40114224/",
        },
        {
          label: "AOC platform focus (Avidity Biosciences)",
          href: "https://www.aviditybiosciences.com/platform/aoc",
        }
      );
      if (!options.length) {
        options = ["Stay with oligo", "Switch to ADC", "Need more info"];
      }
    }

    if (mentionsBreast && mentionsADC && !mentionsOligo) {
      text +=
        (text ? " " : "") +
        "Breast cancer has multiple FDA‑approved ADCs and a strong clinical evidence base, so ADC is a solid default choice if the target biology fits.";
      sources.push({
        label: "ADCs in breast cancer review (2025)",
        href: "https://pubmed.ncbi.nlm.nih.gov/40114224/",
      });
      options = ["Proceed with ADC", "Compare with other modalities", "Need more info"];
    }

    if (!text) {
      text =
        "Got it. I’ll sanity‑check modality fit, bystander feasibility, and key tradeoffs. If you want, share the target, indication, and one must‑have requirement.";
    }

    return { role: "assistant", text, sources: sources.length ? sources : undefined, options: options.length ? options : undefined };
  }

  function buildSteps(choice: string): ChatMessage {
    const text = `Based on “${choice}”, here’s a basic step‑by‑step:`;
    const steps = [
      "confirm target biology and expression profile",
      "select modality + payload class aligned with goal",
      "choose linker and conjugation strategy",
      "set DAR target and stability criteria",
      "run binding + internalization + stability assays",
      "iterate based on PK/PD and safety signals",
    ];
    return {
      role: "assistant",
      text,
      options: steps,
    };
  }

  function handleSend() {
    const context = buildContext();
    const message = chatInput.trim() || context;
    if (!message) return;
    const combined = context && message !== context ? `${message}\n\n${context}` : message;
    const userMsg: ChatMessage = { role: "user", text: message };
    const assistantMsg = buildAssistantResponse(combined);
    setChatLog((prev) => [...prev, userMsg, assistantMsg]);
    setChatInput("");
  }

  function handleOption(choice: string) {
    const userMsg: ChatMessage = { role: "user", text: choice };
    const stepMsg = buildSteps(choice);
    setChatLog((prev) => [...prev, userMsg, stepMsg]);
  }

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

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            design your conjugate
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            answer the hard questions up front
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            This guided workflow helps you sanity‑check the idea, spot risks, and
            decide what to build next.
          </p>
        </motion.section>

        <section className="grid gap-6 rounded-3xl border border-white/70 bg-white/70 p-6">
          <div className="grid gap-4">
            <Input
              label="one‑sentence idea"
              labelPlacement="outside"
              placeholder="what are you trying to build?"
              value={idea}
              onValueChange={setIdea}
            />
            <Input
              label="target and indication"
              labelPlacement="outside"
              placeholder="e.g., HER2 in breast cancer"
              value={target}
              onValueChange={setTarget}
            />
            <Textarea
              label="must‑have requirement"
              labelPlacement="outside"
              placeholder="bystander effect, safety window, penetration, etc."
              value={mustHave}
              onValueChange={setMustHave}
              minRows={2}
            />
            <Textarea
              label="constraints or avoid"
              labelPlacement="outside"
              placeholder="toxicities to avoid, payload classes to avoid"
              value={avoid}
              onValueChange={setAvoid}
              minRows={2}
            />
            <Textarea
              label="anything else to keep in mind"
              labelPlacement="outside"
              placeholder="manufacturing, DAR limits, analytics available"
              value={constraints}
              onValueChange={setConstraints}
              minRows={2}
            />
          </div>

          <Card className="bg-sky-50/70 border border-sky-200">
            <CardBody className="text-sm text-sky-800">{suggestion}</CardBody>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">need structured options?</p>
            <Switch isSelected={showAdvanced} onValueChange={setShowAdvanced}>
              show dropdowns
            </Switch>
          </div>

          {showAdvanced ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Select label="modality" labelPlacement="outside" selectedKeys={modality ? [modality] : []} onSelectionChange={(keys) => setModality(Array.from(keys)[0]?.toString() ?? "")}>
                {modalities.map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
              <Select label="target expression" labelPlacement="outside" selectedKeys={targetExpression ? [targetExpression] : []} onSelectionChange={(keys) => setTargetExpression(Array.from(keys)[0]?.toString() ?? "")}>
                {["high + homogeneous", "high + heterogeneous", "low / sparse", "unknown"].map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
              <Select label="internalization" labelPlacement="outside" selectedKeys={internalization ? [internalization] : []} onSelectionChange={(keys) => setInternalization(Array.from(keys)[0]?.toString() ?? "")}>
                {["fast", "moderate", "slow", "unknown"].map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
              <Select label="payload class" labelPlacement="outside" selectedKeys={payloadClass ? [payloadClass] : []} onSelectionChange={(keys) => setPayloadClass(Array.from(keys)[0]?.toString() ?? "")}>
                {["microtubule inhibitor", "topo I inhibitor", "DNA damage", "oligo", "radionuclide", "unknown"].map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
              <Select label="linker type" labelPlacement="outside" selectedKeys={linkerType ? [linkerType] : []} onSelectionChange={(keys) => setLinkerType(Array.from(keys)[0]?.toString() ?? "")}>
                {[
                  "cleavable (protease)",
                  "cleavable (pH)",
                  "cleavable (reducible)",
                  "non‑cleavable",
                  "unknown",
                ].map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
              <Select label="bystander effect" labelPlacement="outside" selectedKeys={bystander ? [bystander] : []} onSelectionChange={(keys) => setBystander(Array.from(keys)[0]?.toString() ?? "")}>
                {["yes", "no", "unsure"].map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
            </div>
          ) : null}

          <Card className="bg-white/70 border border-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">design chat</p>
              <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
                chat after you set your inputs
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
              <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto">
                {chatLog.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-sky-100 text-sky-900 self-end"
                        : "bg-white text-zinc-700 border border-white/80"
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.sources ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {msg.sources.map((src) => (
                          <Link key={src.href} href={src.href} className="text-sky-700">
                            {src.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    {msg.options ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.options.map((opt) => (
                          <Button
                            key={opt}
                            size="sm"
                            radius="full"
                            className="bg-sky-50 text-sky-700 border border-sky-200"
                            onPress={() => handleOption(opt)}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-xs text-zinc-500">{buildContext() || "selections will appear here"}</div>
                <Textarea
                  label="your idea"
                  labelPlacement="outside"
                  placeholder="e.g., I want an ADC for HER2+ breast cancer with bystander activity"
                  value={chatInput}
                  onValueChange={setChatInput}
                  minRows={2}
                />
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-sky-600 text-white w-fit" radius="full" onPress={handleSend}>
                    get a recommendation
                  </Button>
                  <Button
                    variant="bordered"
                    radius="full"
                    className="border-sky-200 text-sky-700"
                    onPress={() => setChatInput(buildContext() || "")}
                  >
                    use selections in chat
                  </Button>
                  <Button
                    variant="bordered"
                    radius="full"
                    className="border-sky-200 text-sky-700"
                    onPress={() => {
                      setChatLog([
                        {
                          role: "assistant",
                          text:
                            "Tell me what you want to build. I’ll use your inputs above, sanity‑check the idea, and suggest better options if needed. Example: ‘I want an ADC for HER2+ breast cancer with bystander activity.’",
                        },
                      ]);
                      setChatInput("");
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem(STORAGE_KEY);
                      }
                    }}
                  >
                    clear chat
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

      </main>
    </div>
  );
}
