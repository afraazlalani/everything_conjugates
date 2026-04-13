import { NextRequest, NextResponse } from "next/server";

type FigureType =
  | "auto"
  | "mechanism figure"
  | "construct architecture"
  | "cell trafficking figure"
  | "disease biology figure"
  | "expression / risk figure";

type FigureRequest = {
  prompt?: string;
  style?: string;
  figureType?: FigureType;
  renderMode?: "auto" | "composer" | "ai-image";
  nonce?: string;
};

type FigureResponsePayload = {
  imageUrl: string;
  source: string;
  note: string;
  figureType: Exclude<FigureType, "auto">;
  renderMode: "composer" | "ai-image";
  review: {
    passes: number;
    score: number;
    notes: string[];
  };
  checks: FigureCheck[];
  interpretation: {
    modality: string;
    figureType: Exclude<FigureType, "auto">;
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
};

type FigureCheck = {
  name: string;
  passed: boolean;
  note: string;
};

type FigureBlueprint = {
  focus: "conjugate" | "biology";
  sceneFamily:
    | "generic-conjugate"
    | "adc-lysine-conjugation"
    | "oligo-rna-delivery"
    | "oligo-exon-skipping"
    | "neuromuscular-blockade"
    | "receptor-blockade"
    | "recycling-biology"
    | "generic-biology";
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

type FigureContext = {
  modality: string;
  figureType: Exclude<FigureType, "auto">;
  prompt: string;
  style: string;
  title: string[];
  subtitle: string[];
  concepts: {
    targetLabel: string;
    diseaseLabel: string;
    targetBinding: boolean;
    internalization: boolean;
    lysosome: boolean;
    nucleus: boolean;
    payloadRelease: boolean;
    geneEffect: boolean;
    radiometal: boolean;
    catalytic: boolean;
    peptide: boolean;
    smallMolecule: boolean;
    kidneyRisk: boolean;
    normalTissueRisk: boolean;
    bystander: boolean;
    expressionSelectivity: boolean;
    muscleTargeting: boolean;
    exonSkipping: boolean;
    biologyFirst: boolean;
    fcrn: boolean;
    achr: boolean;
    acetylcholine: boolean;
    blocking: boolean;
    autoantibody: boolean;
    neuromuscular: boolean;
    igg: boolean;
    mmae: boolean;
    lysineConjugation: boolean;
    darLabel: string;
  };
  accent: ReturnType<typeof modalityAccent>;
  steps: string[];
  blueprint: FigureBlueprint;
  layoutVariant: number;
  renderNonce: string;
  highContrast: boolean;
  strokeScale: number;
};

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapLine(text: string, length = 26) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > length && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function hashPrompt(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildFigureBlueprint(
  prompt: string,
  modality: string,
  figureType: Exclude<FigureType, "auto">,
  concepts: FigureContext["concepts"],
): FigureBlueprint {
  if (concepts.achr || concepts.acetylcholine || concepts.neuromuscular || /myasthenia|motor neuron|synaptic|junction/i.test(prompt)) {
    return {
      focus: "biology",
      sceneFamily: "neuromuscular-blockade",
      storyTitle: concepts.diseaseLabel !== "disease context" ? `${concepts.diseaseLabel} disease mechanism` : "disease mechanism",
      storyGoal: "show neurotransmission at the junction, what blocks it, and why signal strength falls.",
      lanes: [
        {
          label: "normal signaling",
          summary: "acetylcholine reaches the receptor cluster and supports neuromuscular signal transmission.",
        },
        {
          label: "pathogenic mechanism",
          summary: concepts.blocking || concepts.autoantibody ? "pathogenic antibodies interrupt receptor access and weaken downstream activation." : "the disease mechanism disrupts the normal receptor node.",
        },
        {
          label: concepts.fcrn ? "persistence / recycling" : "functional consequence",
          summary: concepts.fcrn ? "fcRn can preserve pathogenic igg exposure by recycling it and extending its lifetime." : "reduced receptor signaling lowers effective muscle activation.",
        },
      ],
      plainLanguageLabels: concepts.fcrn
        ? ["motor neuron", "acetylcholine", "AChR cluster", "pathogenic IgG", "FcRn"]
        : ["motor neuron", "acetylcholine", "AChR cluster", "pathogenic IgG"],
      entities: concepts.fcrn
        ? ["motor neuron", "acetylcholine", "AChR cluster", "pathogenic IgG", "muscle membrane", "FcRn"]
        : ["motor neuron", "acetylcholine", "AChR cluster", "pathogenic IgG", "muscle membrane"],
      relationships: [
        { from: "motor neuron", to: "acetylcholine", label: "releases" },
        { from: "acetylcholine", to: "AChR cluster", label: "activates" },
        { from: "pathogenic IgG", to: "AChR cluster", label: concepts.blocking ? "blocks" : "binds" },
        ...(concepts.fcrn ? [{ from: "FcRn", to: "pathogenic IgG", label: "recycles" }] : []),
      ],
    };
  }

  if (concepts.fcrn || (concepts.biologyFirst && /igg|antibody|autoantibody|recycling|half-life/i.test(prompt))) {
    return {
      focus: "biology",
      sceneFamily: "recycling-biology",
      storyTitle: concepts.diseaseLabel !== "disease context" ? `${concepts.diseaseLabel} exposure persistence map` : "immune persistence map",
      storyGoal: "show how pathogenic antibodies persist, recycle, and keep the disease signal alive.",
      lanes: [
        { label: "circulating antibody pool", summary: "pathogenic antibodies remain available in the extracellular space." },
        { label: "recycling node", summary: "fcRn rescues IgG from degradation and can prolong exposure." },
        { label: "downstream consequence", summary: "longer antibody persistence can preserve disease-driving biology." },
      ],
      plainLanguageLabels: ["pathogenic IgG", "FcRn", "recycling endosome", "persistent exposure"],
      entities: ["pathogenic IgG", "FcRn", "endosome", "extracellular pool"],
      relationships: [
        { from: "pathogenic IgG", to: "endosome", label: "internalizes into" },
        { from: "FcRn", to: "pathogenic IgG", label: "rescues" },
        { from: "FcRn", to: "extracellular pool", label: "returns IgG to" },
      ],
    };
  }

  if (concepts.biologyFirst && (concepts.blocking || /block|blocking|inhibit|neutraliz/i.test(prompt))) {
    const target = concepts.targetLabel === "target biology" ? "target receptor" : concepts.targetLabel;
    return {
      focus: "biology",
      sceneFamily: "receptor-blockade",
      storyTitle: `${target} blockade biology`,
      storyGoal: "show the normal binding event, the blocking interaction, and the downstream biology shift.",
      lanes: [
        { label: "normal ligand signaling", summary: `the native ligand reaches ${target} and supports normal signaling.` },
        { label: "blocking event", summary: `the blocking agent prevents productive ${target} activation.` },
        { label: "downstream consequence", summary: "the functional readout falls once the receptor node is interrupted." },
      ],
      plainLanguageLabels: [target, "native ligand", "blocking agent", "reduced signaling"],
      entities: [target, "native ligand", "blocking agent", "downstream signal"],
      relationships: [
        { from: "native ligand", to: target, label: "binds" },
        { from: "blocking agent", to: target, label: "prevents access to" },
        { from: target, to: "downstream signal", label: "drives" },
      ],
    };
  }

  if (modality === "oligo" && concepts.muscleTargeting && concepts.exonSkipping) {
    return {
      focus: "conjugate",
      sceneFamily: "oligo-exon-skipping",
      storyTitle: `${concepts.diseaseLabel} exon-skipping concept`,
      storyGoal: "show delivery, cell entry, and the splice correction outcome in a simple order.",
      lanes: [
        { label: "delivery", summary: "the oligo needs to reach muscle tissue and get inside the right cells." },
        { label: "rna step", summary: "the active strand has to find the pre-mrna target in a productive compartment." },
        { label: "biology shift", summary: "the splice pattern changes toward a more useful transcript outcome." },
      ],
      plainLanguageLabels: ["muscle fiber", "oligo entry", "pre-mrna", "exon skipping"],
      entities: ["muscle fiber", "oligo", "pre-mRNA", "splice outcome"],
      relationships: [
        { from: "oligo", to: "muscle fiber", label: "enters" },
        { from: "oligo", to: "pre-mRNA", label: "binds" },
        { from: "pre-mRNA", to: "splice outcome", label: "shifts" },
      ],
    };
  }

  if (modality === "adc" && (concepts.igg || /adc|antibody-drug/i.test(prompt)) && (concepts.mmae || concepts.lysineConjugation || concepts.darLabel)) {
    const payload = concepts.mmae ? "MMAE" : "payload";
    const dar = concepts.darLabel || "DAR target";
    return {
      focus: "conjugate",
      sceneFamily: "adc-lysine-conjugation",
      storyTitle: `lysine ${payload.toLowerCase()} adc concept`,
      storyGoal: "show the igg scaffold, stochastic lysine loading, and the resulting payload distribution target.",
      lanes: [
        { label: "antibody scaffold", summary: "the full igg provides the targeting carrier and the lysine attachment landscape." },
        { label: "lysine conjugation", summary: `${payload} is installed across accessible lysine positions rather than one fixed site.` },
        { label: "dar outcome", summary: `${dar} acts as the average loading goal, not a single perfectly uniform species.` },
      ],
      plainLanguageLabels: ["full IgG", "lysine handles", payload, dar],
      entities: ["full IgG", "lysine handles", payload, dar],
      relationships: [
        { from: "full IgG", to: "lysine handles", label: "presents" },
        { from: payload, to: "lysine handles", label: "conjugates onto" },
        { from: "lysine handles", to: dar, label: "sets average" },
      ],
    };
  }

  if (modality === "oligo") {
    const oligoType = /sirna/.test(prompt) ? "siRNA" : /aso|antisense/.test(prompt) ? "ASO" : "oligo";
    const carrierLabel = /aoc|antibody oligonucleotide conjugate/.test(prompt)
      ? "antibody-oligo carrier"
      : /galnac/.test(prompt)
        ? "GalNAc delivery handle"
        : "delivery handle";
    return {
      focus: "conjugate",
      sceneFamily: "oligo-rna-delivery",
      storyTitle: `${oligoType} delivery logic`,
      storyGoal: "show the carrier, intracellular handoff, and the downstream rna effect in a readable sequence.",
      lanes: [
        { label: "targeted delivery", summary: `${carrierLabel} gets the oligo into the right tissue and cell population.` },
        { label: "productive handoff", summary: `${oligoType} has to leave the carrier context and reach a productive intracellular compartment.` },
        { label: "rna consequence", summary: "the active strand changes transcript handling or target expression." },
      ],
      plainLanguageLabels: [carrierLabel, oligoType, "productive compartment", "RNA effect"],
      entities: [carrierLabel, oligoType, "productive compartment", "RNA target"],
      relationships: [
        { from: carrierLabel, to: oligoType, label: "delivers" },
        { from: oligoType, to: "productive compartment", label: "reaches" },
        { from: oligoType, to: "RNA target", label: /sirna/.test(prompt) ? "silences" : "modulates" },
      ],
    };
  }

  return {
    focus: "conjugate",
    sceneFamily: "generic-conjugate",
    storyTitle: `${modality.toUpperCase()} figure logic`,
    storyGoal: figureType === "construct architecture"
      ? "show the parts and what job each part is doing."
      : "show the mechanism in a left-to-right order that a new reader can follow.",
    lanes: [
      { label: "targeting", summary: "the construct first needs a believable entry or binding point." },
      { label: "transition", summary: "the middle step decides whether the construct reaches the productive compartment." },
      { label: "effect", summary: "the endpoint has to match the intended payload or biology change." },
    ],
    plainLanguageLabels: ["target", "carrier", "effect"],
    entities: ["target", "carrier", "effect"],
    relationships: [
      { from: "target", to: "carrier", label: "engages" },
      { from: "carrier", to: "effect", label: "drives" },
    ],
  };
}

function inferModality(prompt: string) {
  const text = prompt.toLowerCase();
  if (/(fcrn|acetylcholine|achr|myasthenia|neuromuscular|autoantibody|junction|blocking)/.test(text)) {
    return "biology";
  }
  if (
    /(biology|mechanism|etiology|moa|pathway|blocking|autoantibody|fcrn|acetylcholine|achr|neuromuscular|synaptic|junction)/.test(
      text,
    ) &&
    !/(adc|antibody-drug|radioligand|radionuclide|lu-177|ac-225|oligo|sirna|aso|pmo|peptide|pdc|small molecule|smdc|enzyme|prodrug)/.test(
      text,
    )
  ) {
    return "biology";
  }
  if (text.includes("oligo") || text.includes("sirna") || text.includes("aso") || text.includes("pmo")) return "oligo";
  if (text.includes("radioligand") || text.includes("radionuclide") || text.includes("lu-177") || text.includes("ac-225")) return "rdc";
  if (text.includes("enzyme") || text.includes("prodrug")) return "enzyme";
  if (text.includes("peptide") || text.includes("pdc")) return "pdc";
  if (text.includes("small molecule") || text.includes("smdc")) return "smdc";
  return "adc";
}

function inferFigureType(prompt: string, requestedType: FigureType | undefined): Exclude<FigureType, "auto"> {
  if (requestedType && requestedType !== "auto") return requestedType;
  const text = prompt.toLowerCase();
  if (/(expression|normal tissue|kidney|risk|off-target|organ)/.test(text)) return "expression / risk figure";
  if (/(biology|disease mechanism|pathway|disease|etiology|moa|blocking|autoantibody|fcrn|acetylcholine|achr|neuromuscular|junction)/.test(text)) return "disease biology figure";
  if (/(traffic|internaliz|lysosom|endosom|entry|uptake)/.test(text)) return "cell trafficking figure";
  if (/(architecture|construct|format|targeting format|linker|payload)/.test(text)) return "construct architecture";
  return "mechanism figure";
}

function buildFallbackSteps(prompt: string, modality: string, figureType: Exclude<FigureType, "auto">) {
  const text = prompt.toLowerCase();

  if (figureType === "expression / risk figure") {
    return ["target tissue", "normal tissue", "delivery window", "main exposure risk"];
  }
  if (figureType === "disease biology figure") {
    if (/(fcrn|acetylcholine|achr|myasthenia|neuromuscular|junction)/.test(text)) {
      return ["immune driver", "junction binding", "signal blockade", "muscle effect"];
    }
    return ["disease driver", "target node", "construct action", "expected biology shift"];
  }
  if (figureType === "construct architecture") {
    if (modality === "adc") return ["targeting arm", "linker logic", "payload class", "first decision point"];
    if (modality === "oligo") return ["delivery handle", "attachment site", "oligo cargo", "productive endpoint"];
    if (modality === "rdc") return ["ligand", "chelator", "isotope", "exposure watchout"];
    return ["targeting unit", "linker logic", "active cargo", "fit criteria"];
  }

  if (/(radioligand|radionuclide|lu-177|actinium|ac-225|y-90)/.test(text)) {
    return ["target binding", "tumor localization", "isotope retention", "therapeutic radiation"];
  }
  if (/(oligo|sirna|aso|pmo|splice|exon|knockdown)/.test(text)) {
    return ["tissue entry", "cell uptake", "productive trafficking", "rna effect"];
  }
  if (/(enzyme|prodrug|catalytic|activation)/.test(text)) {
    return ["target localization", "enzyme activity", "local activation", "drug effect"];
  }
  if (/(fcrn|acetylcholine|achr|myasthenia|neuromuscular|junction)/.test(text)) {
    return ["immune driver", "junction binding", "signal blockade", "muscle effect"];
  }
  return ["target binding", "internalization", "payload release", "cell response"];
}

function modalityAccent(modality: string) {
  if (modality === "biology") return { border: "#4f7c82", fill: "#edf5f3", label: "#315d64" };
  if (modality === "oligo") return { border: "#5a8b7d", fill: "#eef6f2", label: "#3f6b5f" };
  if (modality === "rdc") return { border: "#6b7d98", fill: "#eef2f7", label: "#43546c" };
  if (modality === "enzyme") return { border: "#7e8f76", fill: "#f1f4ef", label: "#55634f" };
  if (modality === "pdc") return { border: "#5e8793", fill: "#eef5f7", label: "#456672" };
  if (modality === "smdc") return { border: "#6d8b74", fill: "#f1f6f1", label: "#4d6753" };
  return { border: "#5f7f9f", fill: "#eef4f8", label: "#42627d" };
}

function drawYAntibody(x: number, y: number, color: string) {
  return `
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 58}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${x}" y1="${y}" x2="${x - 38}" y2="${y - 42}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
    <line x1="${x}" y1="${y}" x2="${x + 38}" y2="${y - 42}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
  `;
}

function drawMembrane(x: number, y: number, width: number) {
  return `
    <line x1="${x}" y1="${y}" x2="${x + width}" y2="${y}" stroke="#64748b" stroke-width="8" stroke-linecap="round"/>
    <line x1="${x}" y1="${y + 18}" x2="${x + width}" y2="${y + 18}" stroke="#64748b" stroke-width="8" stroke-linecap="round"/>
  `;
}

function drawCell(x: number, y: number, width: number, height: number, fill: string, stroke: string) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${width / 2}" ry="${height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
    <ellipse cx="${cx + width * 0.14}" cy="${cy + height * 0.06}" rx="${width * 0.16}" ry="${height * 0.18}" fill="#d6dde6" stroke="#94a3b8" stroke-width="3"/>
    <circle cx="${cx + width * 0.18}" cy="${cy + height * 0.02}" r="${Math.max(8, Math.round(width * 0.03))}" fill="#9aa8b8"/>
  `;
}

function drawReceptor(x: number, y: number, color: string) {
  return `
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 54}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${x}" cy="${y - 10}" r="12" fill="${color}" />
    <circle cx="${x - 18}" cy="${y + 12}" r="10" fill="${color}" />
    <circle cx="${x + 18}" cy="${y + 12}" r="10" fill="${color}" />
  `;
}

function drawDoubleHelix(x: number, y: number, height: number) {
  const segments = Array.from({ length: 7 }).map((_, index) => {
    const offset = index * (height / 6);
    const leftX = x + (index % 2 === 0 ? -14 : 14);
    const rightX = x + (index % 2 === 0 ? 14 : -14);
    return `
      <line x1="${leftX}" y1="${y + offset}" x2="${rightX}" y2="${y + offset + height / 12}" stroke="#0f766e" stroke-width="4" stroke-linecap="round"/>
      <line x1="${x - 16}" y1="${y + offset}" x2="${x - 16}" y2="${y + offset + height / 12}" stroke="#14b8a6" stroke-width="4" stroke-linecap="round"/>
      <line x1="${x + 16}" y1="${y + offset}" x2="${x + 16}" y2="${y + offset + height / 12}" stroke="#0ea5e9" stroke-width="4" stroke-linecap="round"/>
    `;
  });
  return segments.join("");
}

function drawRadiationBurst(x: number, y: number, color: string) {
  return `
    <circle cx="${x}" cy="${y}" r="16" fill="${color}" opacity="0.16"/>
    <circle cx="${x}" cy="${y}" r="8" fill="${color}"/>
    <line x1="${x}" y1="${y - 28}" x2="${x}" y2="${y - 46}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${x}" y1="${y + 28}" x2="${x}" y2="${y + 46}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${x - 28}" y1="${y}" x2="${x - 46}" y2="${y}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${x + 28}" y1="${y}" x2="${x + 46}" y2="${y}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
  `;
}

function drawPayloadDots(x: number, y: number, count: number, color: string) {
  return Array.from({ length: count })
    .map((_, index) => `<circle cx="${x + index * 20}" cy="${y + (index % 2 === 0 ? 0 : 12)}" r="6" fill="${color}" />`)
    .join("");
}

function drawMuscleFiber(x: number, y: number, width: number, height: number, stroke: string, fill: string) {
  const stripes = Array.from({ length: 8 })
    .map((_, index) => {
      const stripeX = x + 28 + index * ((width - 56) / 7);
      return `<line x1="${stripeX}" y1="${y + 24}" x2="${stripeX}" y2="${y + height - 24}" stroke="${stroke}" stroke-width="4" opacity="0.35" />`;
    })
    .join("");

  return `
    <rect x="${x}" y="${y}" rx="44" ry="44" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>
    ${stripes}
    <line x1="${x + 18}" y1="${y + 34}" x2="${x + width - 18}" y2="${y + 34}" stroke="${stroke}" stroke-width="4" opacity="0.45"/>
    <line x1="${x + 18}" y1="${y + height - 34}" x2="${x + width - 18}" y2="${y + height - 34}" stroke="${stroke}" stroke-width="4" opacity="0.45"/>
  `;
}

function drawLabelPlaceholder(x: number, y: number, width: number, height = 38, fill = "#ffffff", stroke = "#cbd5e1") {
  return `
    <rect x="${x}" y="${y}" rx="${height / 2}" ry="${height / 2}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <line x1="${x + 18}" y1="${y + height / 2}" x2="${x + width - 18}" y2="${y + height / 2}" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
  `;
}

function drawCaptionPill(
  x: number,
  y: number,
  width: number,
  _text: string,
  fill: string,
  stroke: string,
  _labelColor?: string,
) {
  void _labelColor;
  return drawLabelPlaceholder(x, y, width, 38, fill, stroke);
}

function drawLegend(accent: ReturnType<typeof modalityAccent>, modality: string, figureType: string) {
  const border = accent.border;
  return `
    <rect x="1010" y="68" rx="20" ry="20" width="182" height="84" fill="#ffffff" stroke="${border}" stroke-width="2"/>
    <text x="1034" y="94" font-family="Arial, sans-serif" font-size="11" letter-spacing="3" font-weight="700" fill="#64748b">MODE</text>
    <text x="1034" y="123" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="${accent.label}">${escapeXml(modality.toUpperCase())}</text>
    <text x="1034" y="144" font-family="Arial, sans-serif" font-size="14" fill="#334155">${escapeXml(figureType)}</text>
  `;
}

function drawInfoPanel(x: number, y: number, width: number, title: string, body: string, accent: ReturnType<typeof modalityAccent>) {
  const lines = wrapLine(body, 28);
  return `
    <rect x="${x}" y="${y}" rx="24" ry="24" width="${width}" height="130" fill="#ffffff" stroke="${accent.border}" stroke-width="2"/>
    <text x="${x + 24}" y="${y + 34}" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" font-weight="700" fill="${accent.label}">${escapeXml(title.toUpperCase())}</text>
    <text x="${x + 24}" y="${y + 66}" font-family="Arial, sans-serif" font-size="19" fill="#334155">
      ${lines
        .map(
          (line, index) =>
            `<tspan x="${x + 24}" dy="${index === 0 ? 0 : 22}">${escapeXml(line)}</tspan>`,
        )
        .join("")}
    </text>
  `;
}

function inferConcepts(prompt: string) {
  const text = prompt.toLowerCase();
  const targetMatch =
    prompt.match(/\b(egfr|her2|trop2|psma|frα|fra|fap|caix|dmd|dystrophin|acetylcholine receptor|achr)\b/i) ??
    prompt.match(/\bfor ([a-z0-9\- ]{3,40})/i);

  const diseaseMatch =
    prompt.match(/\b(duchenne muscular dystrophy|dmd|myasthenia gravis|colorectal cancer|breast cancer|prostate cancer|ovarian cancer)\b/i) ??
    prompt.match(/\bfor ([a-z0-9\- ]{3,40})/i);

  return {
    targetLabel: targetMatch?.[1] ? clean(targetMatch[1]) : "target biology",
    diseaseLabel: diseaseMatch?.[1] ? clean(diseaseMatch[1]) : "disease context",
    targetBinding: /(bind|target|receptor|surface|ligand)/.test(text),
    internalization: /(internaliz|uptake|endosom|traffick|entry)/.test(text),
    lysosome: /(lysosom|catheps|cleavage)/.test(text),
    nucleus: /(nucleus|dna|transcription|splice|exon)/.test(text),
    payloadRelease: /(release|cleavage|payload)/.test(text),
    geneEffect: /(gene|rna|sirna|aso|splice|exon|knockdown|modulation)/.test(text),
    radiometal: /(radioligand|radionuclide|lu-177|y-90|ac-225|radiation|chelator)/.test(text),
    catalytic: /(enzyme|prodrug|catalytic|activation)/.test(text),
    peptide: /(peptide|pdc|cyclic peptide|linear peptide)/.test(text),
    smallMolecule: /(small molecule|smdc|ligand)/.test(text),
    kidneyRisk: /(kidney|renal|salivary)/.test(text),
    normalTissueRisk: /(normal tissue|off-target|toxicity|safety)/.test(text),
    bystander: /(bystander)/.test(text),
    expressionSelectivity: /(expression|heterogeneous|window|selective)/.test(text),
    muscleTargeting: /(muscle|myofiber|skeletal muscle)/.test(text),
    exonSkipping: /(exon-skipping|exon skipping|splice correction|splice)/.test(text),
    biologyFirst: /(biology|mechanism|etiology|moa|pathway|blocking|autoantibody|synaptic|neuromuscular|junction)/.test(text),
    fcrn: /\bfcrn\b/.test(text),
    achr: /(acetylcholine receptor|achr)/.test(text),
    acetylcholine: /acetylcholine/.test(text),
    blocking: /(block|blocking|inhibit|inhibition)/.test(text),
    autoantibody: /(autoantibody|igg autoantibody|pathogenic antibody)/.test(text),
    neuromuscular: /(myasthenia|neuromuscular|motor neuron|synaptic cleft|muscle cell|junction)/.test(text),
    igg: /\bigg\b|full igg|antibody/.test(text),
    mmae: /\bmmae\b/.test(text),
    lysineConjugation: /lysine/.test(text),
    darLabel: prompt.match(/\bdar\s*-?\s*(\d+(\.\d+)?)\b/i)?.[0] ?? "",
  };
}

function buildShortFigureTitle(
  modality: string,
  figureType: Exclude<FigureType, "auto">,
  concepts: FigureContext["concepts"],
) {
  const target = concepts.targetLabel === "target biology" ? "selected target" : concepts.targetLabel;
  if (concepts.fcrn || concepts.achr || concepts.neuromuscular) return `${concepts.diseaseLabel} biology map`;
  if (figureType === "construct architecture") return `${modality.toUpperCase()} construct architecture`;
  if (figureType === "cell trafficking figure") return `${modality.toUpperCase()} trafficking map`;
  if (figureType === "disease biology figure") return `${concepts.diseaseLabel} biology view`;
  if (figureType === "expression / risk figure") return `${target} risk and expression view`;
  return `${modality.toUpperCase()} mechanism overview`;
}

function buildFigureSubtitle(concepts: FigureContext["concepts"]) {
  const parts: string[] = [];
  if (concepts.diseaseLabel !== "disease context") parts.push(concepts.diseaseLabel);
  if (concepts.targetLabel !== "target biology") parts.push(concepts.targetLabel);
  if (concepts.fcrn) parts.push("fcRn biology");
  if (concepts.achr) parts.push("AChR signaling");
  if (concepts.blocking) parts.push("blocking mechanism");
  if (concepts.internalization) parts.push("cell entry");
  if (concepts.payloadRelease) parts.push("payload release");
  if (concepts.geneEffect) parts.push("rna effect");
  if (concepts.radiometal) parts.push("radiation logic");
  if (concepts.catalytic) parts.push("local activation");
  if (!parts.length) parts.push("target, carrier, and effect logic");
  return parts.join(" · ");
}

function buildFigureContext(prompt: string, style: string, requestedType?: FigureType, nonce?: string): FigureContext {
  const cleanedPrompt = clean(prompt);
  const modality = inferModality(cleanedPrompt);
  const figureType = inferFigureType(cleanedPrompt, requestedType);
  const accent = modalityAccent(modality);
  const concepts = inferConcepts(cleanedPrompt);
  const blueprint = buildFigureBlueprint(cleanedPrompt, modality, figureType, concepts);
  const steps = buildFallbackSteps(cleanedPrompt, modality, figureType);
  const title = buildShortFigureTitle(modality, figureType, concepts);
  const subtitle = buildFigureSubtitle(concepts);
  const renderNonce = nonce || `${Date.now()}`;
  const layoutVariant = hashPrompt(`${cleanedPrompt}:${figureType}:${modality}:${renderNonce}`) % 4;
  return {
    modality,
    figureType,
    prompt: cleanedPrompt,
    style: clean(style || "scientific schematic"),
    title: wrapLine(title, 24),
    subtitle: wrapLine(subtitle, 38),
    concepts,
    accent,
    steps,
    blueprint,
    layoutVariant,
    renderNonce,
    highContrast: false,
    strokeScale: 1,
  };
}

function applyReviewTuning(ctx: FigureContext, tuning: { layoutVariant?: number; highContrast?: boolean; strokeScale?: number }) {
  return {
    ...ctx,
    layoutVariant: tuning.layoutVariant ?? ctx.layoutVariant,
    highContrast: tuning.highContrast ?? ctx.highContrast,
    strokeScale: tuning.strokeScale ?? ctx.strokeScale,
  };
}

function reviewRenderedFigure(ctx: FigureContext, checks: FigureCheck[]) {
  const notes: string[] = [];
  let score = 8.4;

  if (ctx.blueprint.relationships.length < 3) {
    score -= 1.2;
    notes.push("relationship coverage is still thin, so the figure may read too generically.");
  }

  if (ctx.blueprint.sceneFamily === "generic-conjugate" || ctx.blueprint.sceneFamily === "generic-biology") {
    score -= 1.4;
    notes.push("this prompt still landed in a generic scene family instead of a more specific mechanism grammar.");
  }

  if (checks.some((check) => !check.passed && /readability|label fit|entity coverage|relationship coverage/.test(check.name))) {
    score -= 1.1;
    notes.push("the reviewer still sees readability pressure in the current composition.");
  }

  if (ctx.figureType === "mechanism figure" && ctx.blueprint.focus === "biology") {
    score -= 0.4;
    notes.push("biology prompts usually benefit from more spacing than a tight mechanism layout.");
  }

  if (score < 7.5) {
    return {
      pass: false,
      score: Math.max(0, Number(score.toFixed(1))),
      notes,
      next: {
        layoutVariant: (ctx.layoutVariant + 1) % 4,
        highContrast: true,
        strokeScale: Math.min(1.35, ctx.strokeScale + 0.12),
      },
    };
  }

  notes.push("the reviewer thinks the figure is specific enough to the prompt and readable enough to ship as a concept image.");
  return {
    pass: true,
    score: Math.max(0, Number(score.toFixed(1))),
    notes,
    next: null,
  };
}

function buildInterpretationPayload(ctx: FigureContext) {
  return {
    modality: ctx.modality,
    figureType: ctx.figureType,
    storyTitle: ctx.blueprint.storyTitle,
    storyGoal: ctx.blueprint.storyGoal,
    lanes: ctx.blueprint.lanes,
    plainLanguageLabels: ctx.blueprint.plainLanguageLabels,
    entities: ctx.blueprint.entities,
    relationships: ctx.blueprint.relationships,
  };
}

function runFigureChecks(ctx: FigureContext): FigureCheck[] {
  const checks: FigureCheck[] = [
    {
      name: "prompt clarity",
      passed: ctx.prompt.length > 18,
      note: ctx.prompt.length > 18 ? "the prompt is specific enough to compose a real figure." : "the prompt is still very short, so the figure may stay generic.",
    },
    {
      name: "modality resolution",
      passed: Boolean(ctx.modality),
      note: `the composer resolved this as ${ctx.modality.toUpperCase()}.`,
    },
    {
      name: "figure type resolution",
      passed: Boolean(ctx.figureType),
      note: `the prompt maps best to a ${ctx.figureType}.`,
    },
    {
      name: "target cue",
      passed: ctx.concepts.targetBinding || ctx.concepts.expressionSelectivity || ctx.concepts.muscleTargeting,
      note: ctx.concepts.targetBinding || ctx.concepts.expressionSelectivity || ctx.concepts.muscleTargeting ? "there is enough biological context to draw a real entry point." : "target language is weak, so the figure uses a generic target placeholder.",
    },
    {
      name: "delivery route consistency",
      passed: !(ctx.modality === "oligo" && ctx.concepts.radiometal) && !(ctx.modality === "rdc" && ctx.concepts.geneEffect),
      note: "the selected modality and the delivery story do not obviously contradict each other.",
    },
    {
      name: "release logic consistency",
      passed: ctx.figureType !== "mechanism figure" || ctx.concepts.payloadRelease || ctx.concepts.geneEffect || ctx.concepts.radiometal || ctx.concepts.catalytic,
      note: "the mechanism panel has a clear endpoint: release, gene effect, isotope logic, or catalytic activation.",
    },
    {
      name: "compartment logic",
      passed: !ctx.concepts.internalization || ctx.figureType === "cell trafficking figure" || ctx.figureType === "mechanism figure",
      note: "internalization cues are mapped into a figure type that can actually show compartments.",
    },
    {
      name: "disease relevance cue",
      passed: ctx.concepts.diseaseLabel.length > 2,
      note: `the figure keeps ${ctx.concepts.diseaseLabel} as the disease context anchor.`,
    },
    {
      name: "disease-specific grounding",
      passed: !ctx.concepts.muscleTargeting || ctx.concepts.geneEffect || ctx.concepts.exonSkipping,
      note: ctx.concepts.muscleTargeting
        ? "muscle-directed prompts should also show what biology changes after delivery."
        : "no disease-specific visual override is required here.",
    },
    {
      name: "risk cue availability",
      passed: ctx.figureType !== "expression / risk figure" || ctx.concepts.kidneyRisk || ctx.concepts.normalTissueRisk || ctx.concepts.expressionSelectivity,
      note: "risk figures need a real safety or selectivity cue to avoid becoming decorative.",
    },
    {
      name: "label fit",
      passed: ctx.title.join(" ").length < 180,
      note: "the title and labels are short enough to fit the template cleanly.",
    },
    {
      name: "step completeness",
      passed: ctx.steps.length === 4,
      note: "the bottom strip has a full 4-step logic path.",
    },
    {
      name: "visual balance",
      passed: true,
      note: "the figure uses fixed panels and spacing, so it should stay readable even when the prompt changes.",
    },
    {
      name: "15-20 second readability",
      passed:
        ctx.blueprint.lanes.length >= 3 &&
        ctx.blueprint.plainLanguageLabels.length >= 3 &&
        ctx.title.join(" ").length < 90,
      note:
        ctx.blueprint.focus === "biology"
          ? "the figure should explain the normal node, the pathogenic change, and the resulting consequence within a short read."
          : "the figure should let a new reader follow target, transition step, and endpoint without needing the raw prompt.",
    },
    {
      name: "entity coverage",
      passed: ctx.blueprint.entities.length >= 3,
      note: "the blueprint needs enough named pieces to tell a real story instead of showing a generic placeholder scene.",
    },
    {
      name: "relationship coverage",
      passed: ctx.blueprint.relationships.length >= 2,
      note: "the figure should include at least two explicit biological or construct relationships, not only isolated labels.",
    },
  ];

  return checks;
}

function drawMechanismScene(ctx: FigureContext) {
  const { accent, modality, concepts } = ctx;

  if (ctx.blueprint.sceneFamily === "adc-lysine-conjugation") {
    return `
      <rect x="112" y="214" rx="34" ry="34" width="1030" height="298" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
      ${drawCaptionPill(154, 200, 198, "antibody scaffold", accent.fill, accent.border, accent.label)}
      ${drawCaptionPill(494, 200, 196, "lysine conjugation", accent.fill, accent.border, accent.label)}
      ${drawCaptionPill(840, 200, 170, "dar outcome", accent.fill, accent.border, accent.label)}
      ${drawYAntibody(256, 322, accent.border)}
      ${drawYAntibody(336, 366, accent.border)}
      <circle cx="226" cy="288" r="6" fill="#fb923c"/>
      <circle cx="290" cy="284" r="6" fill="#fb923c"/>
      <circle cx="352" cy="308" r="6" fill="#fb923c"/>
      <circle cx="374" cy="382" r="6" fill="#fb923c"/>
      ${drawLabelPlaceholder(164, 446, 232, 34, "#ffffff", accent.border)}
      <line x1="412" y1="326" x2="510" y2="326" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="510,326 492,314 492,338" fill="#0f172a"/>
      <circle cx="594" cy="326" r="22" fill="#dbeafe" stroke="${accent.border}" stroke-width="4"/>
      ${drawLabelPlaceholder(564, 308, 60, 32, "#ffffff", accent.border)}
      <line x1="616" y1="326" x2="710" y2="326" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="710,326 692,314 692,338" fill="#0f172a"/>
      <rect x="728" y="284" rx="24" ry="24" width="164" height="84" fill="#fff7ed" stroke="#fb923c" stroke-width="4"/>
      ${drawLabelPlaceholder(756, 306, 110, 34, "#ffffff", "#fb923c")}
      ${drawLabelPlaceholder(560, 372, 186, 32, "#ffffff", accent.border)}
      <line x1="892" y1="326" x2="974" y2="326" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="974,326 956,314 956,338" fill="#0f172a"/>
      <rect x="990" y="270" rx="24" ry="24" width="112" height="112" fill="#eff6ff" stroke="${accent.border}" stroke-width="4"/>
      ${drawLabelPlaceholder(1008, 304, 76, 30, "#ffffff", accent.border)}
      ${drawLabelPlaceholder(974, 370, 144, 30, "#ffffff", accent.border)}
    `;
  }

  if (modality === "rdc") {
    return `
      ${drawCell(118, 226, 340, 268, "#f5f3ff", "#c4b5fd")}
      ${drawMembrane(170, 300, 245)}
      ${drawReceptor(260, 258, accent.border)}
      ${drawCaptionPill(140, 186, 176, "tumor surface", accent.fill, accent.border, accent.label)}
      <circle cx="582" cy="276" r="38" fill="#ede9fe" stroke="${accent.border}" stroke-width="4"/>
      <text x="582" y="286" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${accent.label}">lu-177</text>
      <line x1="455" y1="276" x2="544" y2="276" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="544,276 526,264 526,288" fill="#0f172a"/>
      ${drawRadiationBurst(900, 276, accent.border)}
      ${drawCaptionPill(504, 186, 168, "chelator load", accent.fill, accent.border, accent.label)}
      ${drawCaptionPill(824, 186, 178, "radiation zone", accent.fill, accent.border, accent.label)}
      ${concepts.kidneyRisk ? drawInfoPanel(872, 378, 258, "caution", "kidney exposure still needs a hard pk check.", accent) : ""}
    `;
  }

  if (modality === "oligo") {
    if (concepts.muscleTargeting || concepts.exonSkipping || /duchenne|dmd/i.test(ctx.prompt)) {
      return `
        ${drawMuscleFiber(108, 234, 356, 248, accent.border, "#ecfeff")}
        ${drawCaptionPill(162, 202, 204, "muscle fiber target", accent.fill, accent.border, accent.label)}
        <circle cx="552" cy="318" r="28" fill="#ccfbf1" stroke="${accent.border}" stroke-width="4"/>
        <text x="552" y="326" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${accent.label}">oligo</text>
        <line x1="464" y1="318" x2="522" y2="318" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
        <polygon points="522,318 504,306 504,330" fill="#0f172a"/>
        <rect x="710" y="220" rx="28" ry="28" width="214" height="196" fill="#f8fafc" stroke="${accent.border}" stroke-width="4"/>
        <text x="817" y="256" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" letter-spacing="3" font-weight="700" fill="${accent.label}">PRE-MRNA</text>
        <line x1="760" y1="296" x2="874" y2="296" stroke="#0ea5e9" stroke-width="8" stroke-linecap="round"/>
        <rect x="792" y="278" width="28" height="36" rx="8" ry="8" fill="#14b8a6"/>
        <rect x="824" y="278" width="28" height="36" rx="8" ry="8" fill="#fb7185"/>
        <rect x="856" y="278" width="28" height="36" rx="8" ry="8" fill="#14b8a6"/>
        <line x1="760" y1="364" x2="874" y2="364" stroke="#0ea5e9" stroke-width="8" stroke-linecap="round"/>
        <rect x="792" y="346" width="28" height="36" rx="8" ry="8" fill="#14b8a6"/>
        <rect x="856" y="346" width="28" height="36" rx="8" ry="8" fill="#14b8a6"/>
        <line x1="580" y1="318" x2="680" y2="318" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
        <polygon points="680,318 662,306 662,330" fill="#0f172a"/>
        ${drawCaptionPill(470, 202, 188, "cell entry", accent.fill, accent.border, accent.label)}
        ${drawCaptionPill(730, 202, 174, "exon skipping", accent.fill, accent.border, accent.label)}
        ${drawInfoPanel(936, 234, 190, "biology shift", "restore the splice pattern instead of delivering a classical cytotoxic payload.", accent)}
      `;
    }

    if (ctx.blueprint.sceneFamily === "oligo-rna-delivery") {
      if (ctx.layoutVariant === 0) {
        return `
          <rect x="120" y="226" rx="28" ry="28" width="238" height="124" fill="${accent.fill}" stroke="${accent.border}" stroke-width="4"/>
          ${drawLabelPlaceholder(160, 248, 158, 30, "#ffffff", accent.border)}
          ${drawYAntibody(238, 314, accent.border)}
          ${drawCaptionPill(150, 188, 176, "carrier entry", accent.fill, accent.border, accent.label)}
          <rect x="430" y="250" rx="30" ry="30" width="228" height="82" fill="#ffffff" stroke="${accent.border}" stroke-width="4"/>
          ${drawLabelPlaceholder(470, 274, 148, 34, "#ffffff", accent.border)}
          <line x1="358" y1="292" x2="430" y2="292" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
          <polygon points="430,292 412,280 412,304" fill="#0f172a"/>
          <rect x="748" y="220" rx="28" ry="28" width="250" height="164" fill="#ecfeff" stroke="${accent.border}" stroke-width="4"/>
          ${drawLabelPlaceholder(802, 238, 140, 32, "#ffffff", accent.border)}
          ${drawDoubleHelix(876, 286, 116)}
          <line x1="658" y1="292" x2="748" y2="292" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
          <polygon points="748,292 730,280 730,304" fill="#0f172a"/>
          ${drawCaptionPill(458, 188, 176, "productive handoff", accent.fill, accent.border, accent.label)}
          ${drawCaptionPill(784, 188, 176, "rna effect", accent.fill, accent.border, accent.label)}
        `;
      }

      if (ctx.layoutVariant === 1) {
        return `
          ${drawCell(118, 226, 316, 260, "#ecfeff", "#99f6e4")}
          ${drawMembrane(176, 306, 220)}
          <circle cx="470" cy="306" r="26" fill="#ccfbf1" stroke="${accent.border}" stroke-width="4"/>
          ${drawLabelPlaceholder(438, 288, 64, 30, "#ffffff", accent.border)}
          <line x1="434" y1="306" x2="444" y2="306" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
          <polygon points="444,306 426,294 426,318" fill="#0f172a"/>
          <rect x="560" y="226" rx="26" ry="26" width="186" height="120" fill="#ffffff" stroke="${accent.border}" stroke-width="4"/>
          ${drawLabelPlaceholder(584, 260, 138, 34, "#ffffff", accent.border)}
          <line x1="496" y1="306" x2="560" y2="306" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
          <polygon points="560,306 542,294 542,318" fill="#0f172a"/>
          <rect x="810" y="236" rx="24" ry="24" width="236" height="148" fill="#f8fafc" stroke="${accent.border}" stroke-width="4"/>
          ${drawLabelPlaceholder(858, 252, 140, 34, "#ffffff", accent.border)}
          ${drawLabelPlaceholder(842, 310, 172, 34, "#ffffff", accent.border)}
          <line x1="746" y1="306" x2="810" y2="306" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
          <polygon points="810,306 792,294 792,318" fill="#0f172a"/>
          ${drawCaptionPill(146, 188, 176, "entry surface", accent.fill, accent.border, accent.label)}
          ${drawCaptionPill(566, 188, 184, "productive traffic", accent.fill, accent.border, accent.label)}
          ${drawCaptionPill(838, 188, 164, "gene effect", accent.fill, accent.border, accent.label)}
        `;
      }

      return `
        <rect x="138" y="228" rx="30" ry="30" width="260" height="140" fill="${accent.fill}" stroke="${accent.border}" stroke-width="4"/>
        <text x="268" y="274" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" letter-spacing="2" font-weight="700" fill="${accent.label}">AOC CARRIER</text>
        ${drawYAntibody(268, 326, accent.border)}
        <rect x="480" y="246" rx="24" ry="24" width="162" height="92" fill="#ffffff" stroke="${accent.border}" stroke-width="4"/>
        ${drawLabelPlaceholder(520, 274, 82, 34, "#ffffff", accent.border)}
        <line x1="398" y1="292" x2="480" y2="292" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
        <polygon points="480,292 462,280 462,304" fill="#0f172a"/>
        <circle cx="806" cy="296" r="70" fill="#ecfeff" stroke="${accent.border}" stroke-width="4"/>
        ${drawLabelPlaceholder(756, 278, 100, 36, "#ffffff", accent.border)}
        <line x1="642" y1="292" x2="736" y2="292" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
        <polygon points="736,292 718,280 718,304" fill="#0f172a"/>
        <rect x="920" y="240" rx="24" ry="24" width="160" height="116" fill="#f8fafc" stroke="${accent.border}" stroke-width="4"/>
        ${drawLabelPlaceholder(948, 268, 104, 34, "#ffffff", accent.border)}
        ${drawLabelPlaceholder(936, 314, 128, 34, "#ffffff", accent.border)}
        <line x1="876" y1="292" x2="920" y2="292" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
        <polygon points="920,292 902,280 902,304" fill="#0f172a"/>
        ${drawCaptionPill(170, 188, 164, "targeted carrier", accent.fill, accent.border, accent.label)}
        ${drawCaptionPill(500, 188, 136, "rna cargo", accent.fill, accent.border, accent.label)}
        ${drawCaptionPill(952, 188, 118, "effect", accent.fill, accent.border, accent.label)}
      `;
    }

    return `
      ${drawCell(116, 212, 360, 302, "#ecfeff", "#99f6e4")}
      ${drawMembrane(174, 302, 250)}
      ${drawCaptionPill(146, 226, 180, "entry surface", accent.fill, accent.border, accent.label)}
      <circle cx="552" cy="280" r="26" fill="#ccfbf1" stroke="${accent.border}" stroke-width="4"/>
      <text x="552" y="288" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${accent.label}">oligo</text>
      <line x1="472" y1="280" x2="522" y2="280" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="522,280 504,268 504,292" fill="#0f172a"/>
      ${drawDoubleHelix(868, 218, 188)}
      <line x1="580" y1="280" x2="790" y2="280" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="790,280 772,268 772,292" fill="#0f172a"/>
      ${drawCaptionPill(470, 226, 202, "productive trafficking", accent.fill, accent.border, accent.label)}
      ${drawCaptionPill(792, 226, 156, "rna effect", accent.fill, accent.border, accent.label)}
    `;
  }

  if (modality === "enzyme") {
    return `
      ${drawCell(130, 225, 320, 270, "#fffbeb", "#fcd34d")}
      ${drawCaptionPill(148, 188, 192, "local target zone", accent.fill, accent.border, accent.label)}
      <rect x="522" y="235" rx="26" ry="26" width="200" height="110" fill="#fef3c7" stroke="${accent.border}" stroke-width="4"/>
      <text x="622" y="286" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${accent.label}">enzyme</text>
      <line x1="452" y1="290" x2="522" y2="290" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="522,290 504,278 504,302" fill="#0f172a"/>
      <rect x="845" y="240" rx="28" ry="28" width="230" height="100" fill="#fff7ed" stroke="#fb923c" stroke-width="4"/>
      <text x="960" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#c2410c">activated drug</text>
      <line x1="722" y1="290" x2="845" y2="290" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="845,290 827,278 827,302" fill="#0f172a"/>
      ${drawCaptionPill(538, 188, 162, "catalytic step", accent.fill, accent.border, accent.label)}
      ${drawCaptionPill(860, 188, 178, "local activation", accent.fill, accent.border, accent.label)}
    `;
  }

  if (modality === "pdc") {
    return `
      ${drawCell(120, 230, 330, 260, "#eff6ff", "#93c5fd")}
      ${drawMembrane(180, 300, 250)}
      ${drawCaptionPill(152, 188, 170, "surface target", accent.fill, accent.border, accent.label)}
      ${drawPayloadDots(552, 282, 5, accent.border)}
      <line x1="452" y1="300" x2="538" y2="300" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="538,300 520,288 520,312" fill="#0f172a"/>
      <circle cx="860" cy="300" r="62" fill="#dbeafe" stroke="${accent.border}" stroke-width="4"/>
      <text x="860" y="292" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${accent.label}">peptide</text>
      <text x="860" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="${accent.label}">payload</text>
      <line x1="648" y1="300" x2="790" y2="300" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="790,300 772,288 772,312" fill="#0f172a"/>
      ${drawCaptionPill(496, 188, 194, "compact linker load", accent.fill, accent.border, accent.label)}
      ${drawCaptionPill(786, 188, 222, "peptide-guided delivery", accent.fill, accent.border, accent.label)}
    `;
  }

  if (modality === "smdc") {
    return `
      ${drawCell(120, 230, 330, 260, "#f0fdf4", "#86efac")}
      ${drawMembrane(180, 300, 250)}
      ${drawCaptionPill(146, 188, 172, "target ligand", accent.fill, accent.border, accent.label)}
      <circle cx="560" cy="300" r="20" fill="#bbf7d0" stroke="${accent.border}" stroke-width="4"/>
      <circle cx="610" cy="300" r="20" fill="#dcfce7" stroke="${accent.border}" stroke-width="4"/>
      <circle cx="660" cy="300" r="20" fill="#bbf7d0" stroke="${accent.border}" stroke-width="4"/>
      <line x1="450" y1="300" x2="530" y2="300" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="530,300 512,288 512,312" fill="#0f172a"/>
      <rect x="840" y="250" rx="28" ry="28" width="220" height="100" fill="#dcfce7" stroke="${accent.border}" stroke-width="4"/>
      <text x="950" y="292" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="${accent.label}">ligand-linker</text>
      <text x="950" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="${accent.label}">payload</text>
      <line x1="690" y1="300" x2="840" y2="300" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
      <polygon points="840,300 822,288 822,312" fill="#0f172a"/>
      ${drawCaptionPill(504, 188, 182, "compact chemistry", accent.fill, accent.border, accent.label)}
      ${drawCaptionPill(812, 188, 198, "small-format delivery", accent.fill, accent.border, accent.label)}
    `;
  }

  return `
    ${drawCell(150, 220, 360, 300, "#eff6ff", "#93c5fd")}
    ${drawMembrane(215, 300, 240)}
    ${drawReceptor(285, 258, accent.border)}
    ${drawReceptor(390, 258, accent.border)}
    ${drawCaptionPill(170, 188, 170, "target receptor", accent.fill, accent.border, accent.label)}
    ${drawYAntibody(610, 265, accent.border)}
    <line x1="455" y1="276" x2="560" y2="276" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
    <polygon points="560,276 542,264 542,288" fill="#0f172a"/>
    <circle cx="855" cy="276" r="26" fill="#dbeafe" stroke="${accent.border}" stroke-width="4"/>
    <circle cx="910" cy="276" r="12" fill="#fb7185"/>
    <line x1="660" y1="276" x2="825" y2="276" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/>
    <polygon points="825,276 807,264 807,288" fill="#0f172a"/>
    ${concepts.internalization ? `<line x1="915" y1="318" x2="915" y2="420" stroke="#0f172a" stroke-width="7" stroke-linecap="round"/><polygon points="915,420 903,402 927,402" fill="#0f172a"/><circle cx="915" cy="486" r="68" fill="#eff6ff" stroke="#93c5fd" stroke-width="4"/><circle cx="915" cy="486" r="18" fill="#fb7185"/>` : ""}
    ${drawCaptionPill(540, 188, 184, "antibody + linker", accent.fill, accent.border, accent.label)}
    ${drawCaptionPill(812, 188, 174, concepts.internalization ? "payload release" : "payload logic", accent.fill, accent.border, accent.label)}
  `;
}

function drawArchitectureScene(ctx: FigureContext) {
  const { accent, modality } = ctx;
  const left = modality === "adc" ? "targeting antibody" : modality === "oligo" ? "delivery handle" : modality === "rdc" ? "ligand / carrier" : "targeting module";
  const middle = modality === "rdc" ? "chelator / spacer" : "linker logic";
  const right = modality === "oligo" ? "oligo cargo" : modality === "rdc" ? "isotope payload" : "active payload";

  return `
    <rect x="116" y="236" rx="32" ry="32" width="270" height="150" fill="${accent.fill}" stroke="${accent.border}" stroke-width="4"/>
    <text x="251" y="294" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="${accent.label}">${escapeXml(left)}</text>
    <rect x="500" y="256" rx="28" ry="28" width="220" height="110" fill="#ffffff" stroke="${accent.border}" stroke-width="4"/>
    <text x="610" y="321" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="${accent.label}">${escapeXml(middle)}</text>
    <rect x="834" y="236" rx="32" ry="32" width="270" height="150" fill="#fff7ed" stroke="#fb923c" stroke-width="4"/>
    <text x="969" y="294" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#c2410c">${escapeXml(right)}</text>
    <line x1="386" y1="311" x2="500" y2="311" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
    <polygon points="500,311 478,297 478,325" fill="#0f172a"/>
    <line x1="720" y1="311" x2="834" y2="311" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
    <polygon points="834,311 812,297 812,325" fill="#0f172a"/>
    ${drawInfoPanel(126, 430, 294, "why this shape", "the parts are separated so each job stays readable before chemistry details pile up.", accent)}
    ${drawInfoPanel(492, 430, 250, "key decision", "the middle block decides whether the construct stays stable, releases, or just positions the cargo.", accent)}
    ${drawInfoPanel(812, 430, 310, "watchout", "payload class has to match both the biology and what the carrier can realistically tolerate.", accent)}
  `;
}

function drawTraffickingScene(ctx: FigureContext) {
  const { accent, modality } = ctx;
  return `
    <rect x="116" y="220" rx="28" ry="28" width="228" height="120" fill="${accent.fill}" stroke="${accent.border}" stroke-width="4"/>
    <text x="230" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="${accent.label}">surface binding</text>
    <rect x="404" y="220" rx="28" ry="28" width="228" height="120" fill="#ffffff" stroke="${accent.border}" stroke-width="4"/>
    <text x="518" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="${accent.label}">cell entry</text>
    <rect x="692" y="220" rx="28" ry="28" width="228" height="120" fill="${accent.fill}" stroke="${accent.border}" stroke-width="4"/>
    <text x="806" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="${accent.label}">sorting</text>
    <rect x="980" y="220" rx="28" ry="28" width="168" height="120" fill="#fff7ed" stroke="#fb923c" stroke-width="4"/>
    <text x="1064" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#c2410c">${escapeXml(modality === "oligo" ? "rna" : "effect")}</text>
    <line x1="344" y1="280" x2="404" y2="280" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
    <polygon points="404,280 382,266 382,294" fill="#0f172a"/>
    <line x1="632" y1="280" x2="692" y2="280" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
    <polygon points="692,280 670,266 670,294" fill="#0f172a"/>
    <line x1="920" y1="280" x2="980" y2="280" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
    <polygon points="980,280 958,266 958,294" fill="#0f172a"/>
    ${drawInfoPanel(150, 410, 298, "productive vs non-productive", "entry is not enough. the real question is whether trafficking lands in the compartment the modality needs.", accent)}
    ${drawInfoPanel(500, 410, 300, "what to watch", "lysosomal release, nuclear access, or isotope retention can each be the actual make-or-break step.", accent)}
    ${drawInfoPanel(850, 410, 290, "why this matters", "a good target with the wrong trafficking route can still kill the whole construct idea.", accent)}
  `;
}

function drawBiologyScene(ctx: FigureContext) {
  const { accent, concepts, blueprint } = ctx;
  if (blueprint.sceneFamily === "neuromuscular-blockade") {
    return `
      <rect x="118" y="214" rx="36" ry="36" width="1020" height="284" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
      ${drawCaptionPill(154, 202, 186, blueprint.lanes[0]?.label ?? "normal signaling", "#eff6ff", accent.border, accent.label)}
      ${drawCaptionPill(500, 202, 220, blueprint.lanes[1]?.label ?? "pathogenic mechanism", "#fef2f2", "#fb7185", "#be123c")}
      ${drawCaptionPill(860, 202, 194, blueprint.lanes[2]?.label ?? "persistence node", accent.fill, accent.border, accent.label)}
      <rect x="138" y="234" rx="28" ry="28" width="280" height="116" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="3"/>
      ${drawLabelPlaceholder(160, 246, 132, 30, "#ffffff", "#7dd3fc")}
      <circle cx="216" cy="304" r="14" fill="#a855f7"/>
      <circle cx="252" cy="292" r="14" fill="#a855f7"/>
      <circle cx="288" cy="304" r="14" fill="#a855f7"/>
      <circle cx="324" cy="292" r="14" fill="#a855f7"/>
      <circle cx="360" cy="304" r="14" fill="#a855f7"/>
      ${drawLabelPlaceholder(412, 302, 118, 30, "#ffffff", "#8b5cf6")}
      ${drawPayloadDots(462, 286, 5, "#a855f7")}
      <line x1="138" y1="382" x2="1138" y2="382" stroke="#94a3b8" stroke-width="3" stroke-dasharray="8 8"/>
      ${drawLabelPlaceholder(912, 346, 150, 30, "#ffffff", "#94a3b8")}
      <rect x="138" y="404" rx="28" ry="28" width="1000" height="72" fill="#dbeafe" stroke="#93c5fd" stroke-width="3"/>
      ${drawLabelPlaceholder(908, 426, 150, 30, "#ffffff", "#93c5fd")}
      <g>
        <rect x="244" y="380" rx="14" ry="14" width="38" height="78" fill="#60a5fa"/>
        <rect x="288" y="380" rx="14" ry="14" width="38" height="78" fill="#60a5fa"/>
        <rect x="332" y="380" rx="14" ry="14" width="38" height="78" fill="#60a5fa"/>
        ${drawLabelPlaceholder(224, 488, 164, 30, "#ffffff", "#60a5fa")}
      </g>
      <g>
        <circle cx="654" cy="370" r="22" fill="#fda4af" stroke="#e11d48" stroke-width="3"/>
        <circle cx="694" cy="356" r="22" fill="#fda4af" stroke="#e11d48" stroke-width="3"/>
        <circle cx="734" cy="370" r="22" fill="#fda4af" stroke="#e11d48" stroke-width="3"/>
        ${drawLabelPlaceholder(598, 488, 192, 30, "#ffffff", "#e11d48")}
      </g>
      <g>
        <rect x="892" y="310" rx="22" ry="22" width="118" height="52" fill="#ecfeff" stroke="${accent.border}" stroke-width="3"/>
        ${drawLabelPlaceholder(918, 321, 66, 30, "#ffffff", accent.border)}
        <line x1="951" y1="362" x2="951" y2="404" stroke="${accent.border}" stroke-width="5" stroke-linecap="round"/>
        ${drawLabelPlaceholder(872, 488, 158, 30, "#ffffff", accent.border)}
      </g>
    `;
  }

  if (blueprint.sceneFamily === "receptor-blockade") {
    const target = blueprint.entities[0] ?? concepts.targetLabel;
    return `
      <rect x="118" y="214" rx="36" ry="36" width="1020" height="284" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
      ${drawCaptionPill(164, 202, 214, blueprint.lanes[0]?.label ?? "normal ligand signaling", "#eff6ff", accent.border, accent.label)}
      ${drawCaptionPill(504, 202, 198, blueprint.lanes[1]?.label ?? "blocking event", "#fef2f2", "#fb7185", "#be123c")}
      ${drawCaptionPill(844, 202, 220, blueprint.lanes[2]?.label ?? "downstream consequence", accent.fill, accent.border, accent.label)}
      <rect x="152" y="284" rx="24" ry="24" width="230" height="150" fill="#eff6ff" stroke="#93c5fd" stroke-width="3"/>
      <circle cx="232" cy="334" r="24" fill="#38bdf8"/>
      <rect x="274" y="304" rx="16" ry="16" width="70" height="64" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
      <text x="267" y="466" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#1d4ed8">${escapeXml(target)}</text>
      <line x1="256" y1="334" x2="274" y2="334" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
      <polygon points="274,334 258,324 258,344" fill="#0f172a"/>
      <text x="232" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#0369a1">native ligand</text>

      <rect x="474" y="270" rx="24" ry="24" width="260" height="176" fill="#fef2f2" stroke="#fb7185" stroke-width="3"/>
      <circle cx="548" cy="334" r="26" fill="#fda4af" stroke="#e11d48" stroke-width="3"/>
      <rect x="620" y="304" rx="16" ry="16" width="72" height="64" fill="#fee2e2" stroke="#e11d48" stroke-width="3"/>
      <line x1="574" y1="334" x2="620" y2="334" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
      <line x1="598" y1="314" x2="638" y2="354" stroke="#e11d48" stroke-width="6" stroke-linecap="round"/>
      <line x1="598" y1="354" x2="638" y2="314" stroke="#e11d48" stroke-width="6" stroke-linecap="round"/>
      <text x="604" y="394" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#be123c">blocking agent prevents access</text>

      <rect x="832" y="270" rx="24" ry="24" width="236" height="176" fill="#ecfeff" stroke="${accent.border}" stroke-width="3"/>
      <circle cx="950" cy="334" r="42" fill="#ccfbf1" stroke="${accent.border}" stroke-width="4"/>
      <text x="950" y="344" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${accent.label}">reduced</text>
      <text x="950" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${accent.label}">signal</text>
      <text x="950" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#334155">${escapeXml(blueprint.lanes[2]?.summary ?? "")}</text>
    `;
  }

  if (blueprint.sceneFamily === "recycling-biology") {
    return `
      <rect x="118" y="214" rx="36" ry="36" width="1020" height="284" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
      ${drawCaptionPill(154, 202, 224, blueprint.lanes[0]?.label ?? "circulating antibody pool", accent.fill, accent.border, accent.label)}
      ${drawCaptionPill(500, 202, 186, blueprint.lanes[1]?.label ?? "recycling node", "#eff6ff", accent.border, accent.label)}
      ${drawCaptionPill(818, 202, 248, blueprint.lanes[2]?.label ?? "downstream consequence", "#fef2f2", "#fb7185", "#be123c")}
      <rect x="146" y="276" rx="26" ry="26" width="248" height="170" fill="#fdf2f8" stroke="#f9a8d4" stroke-width="3"/>
      <circle cx="220" cy="338" r="24" fill="#fb7185"/>
      <circle cx="278" cy="320" r="24" fill="#fb7185"/>
      <circle cx="316" cy="356" r="24" fill="#fb7185"/>
      <text x="270" y="412" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#be123c">pathogenic igg pool</text>
      <rect x="472" y="264" rx="26" ry="26" width="258" height="184" fill="#eff6ff" stroke="${accent.border}" stroke-width="3"/>
      <ellipse cx="601" cy="330" rx="74" ry="54" fill="#dbeafe" stroke="${accent.border}" stroke-width="4"/>
      <rect x="564" y="304" rx="18" ry="18" width="74" height="46" fill="#ffffff" stroke="${accent.border}" stroke-width="3"/>
      <text x="601" y="333" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="${accent.label}">FcRn</text>
      <text x="601" y="408" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#334155">rescues igg from degradation</text>
      <line x1="394" y1="350" x2="472" y2="350" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
      <polygon points="472,350 456,340 456,360" fill="#0f172a"/>
      <line x1="730" y1="350" x2="818" y2="350" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
      <polygon points="818,350 802,340 802,360" fill="#0f172a"/>
      <rect x="820" y="276" rx="26" ry="26" width="248" height="170" fill="#fef2f2" stroke="#fb7185" stroke-width="3"/>
      <circle cx="944" cy="344" r="52" fill="#fee2e2" stroke="#e11d48" stroke-width="4"/>
      <text x="944" y="338" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="#be123c">longer igg</text>
      <text x="944" y="362" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="#be123c">exposure</text>
      <text x="944" y="418" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#334155">${escapeXml(blueprint.lanes[2]?.summary ?? "")}</text>
    `;
  }

  return `
    <rect x="116" y="214" rx="30" ry="30" width="310" height="150" fill="${accent.fill}" stroke="${accent.border}" stroke-width="4"/>
    <text x="146" y="258" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" font-weight="700" fill="${accent.label}">DISEASE</text>
    <text x="146" y="300" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#0f172a">${escapeXml(concepts.diseaseLabel)}</text>
    ${drawInfoPanel(116, 408, 310, "driver", concepts.geneEffect ? "the biology reads like mechanism correction rather than broad payload delivery." : "the biology still depends on whether the target is actually disease-driving or only present.", accent)}
    <rect x="488" y="214" rx="30" ry="30" width="310" height="150" fill="#ffffff" stroke="${accent.border}" stroke-width="4"/>
    <text x="518" y="258" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" font-weight="700" fill="${accent.label}">TARGET</text>
    <text x="518" y="300" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#0f172a">${escapeXml(concepts.targetLabel)}</text>
    ${drawInfoPanel(488, 408, 310, "selectivity", concepts.expressionSelectivity ? "the prompt already hints that expression window matters here." : "expression selectivity still needs to be proven before chemistry becomes believable.", accent)}
    <rect x="860" y="214" rx="30" ry="30" width="288" height="150" fill="#fff7ed" stroke="#fb923c" stroke-width="4"/>
    <text x="890" y="258" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" font-weight="700" fill="#c2410c">DELIVERY NEED</text>
    <text x="890" y="300" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#0f172a">${escapeXml(ctx.modality.toUpperCase())}</text>
    ${drawInfoPanel(860, 408, 288, "biology consequence", concepts.internalization ? "internalization is part of the story, so compartment logic matters." : "the real constraint may be exposure window or tissue reach rather than entry alone.", accent)}
  `;
}

function drawRiskScene(ctx: FigureContext) {
  const { accent, concepts } = ctx;
  return `
    <rect x="136" y="226" rx="32" ry="32" width="300" height="240" fill="${accent.fill}" stroke="${accent.border}" stroke-width="4"/>
    <text x="286" y="274" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" font-weight="700" fill="${accent.label}">TARGET TISSUE</text>
    <circle cx="286" cy="350" r="72" fill="#ffffff" stroke="${accent.border}" stroke-width="4"/>
    <text x="286" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="${accent.label}">on-target</text>
    <rect x="492" y="226" rx="32" ry="32" width="300" height="240" fill="#ffffff" stroke="#fbbf24" stroke-width="4"/>
    <text x="642" y="274" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" font-weight="700" fill="#b45309">NORMAL TISSUE</text>
    <circle cx="642" cy="350" r="72" fill="#fff7ed" stroke="#f59e0b" stroke-width="4"/>
    <text x="642" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#b45309">${escapeXml(concepts.normalTissueRisk ? "watchout" : "unknown")}</text>
    <rect x="848" y="226" rx="32" ry="32" width="300" height="240" fill="#fef2f2" stroke="#fb7185" stroke-width="4"/>
    <text x="998" y="274" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" letter-spacing="3" font-weight="700" fill="#be123c">MAIN RISK</text>
    <text x="998" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#be123c">${escapeXml(concepts.kidneyRisk ? "kidney uptake" : concepts.bystander ? "bystander spill" : "window mismatch")}</text>
    <text x="998" y="378" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#334155">${escapeXml(concepts.expressionSelectivity ? "expression gap still matters" : "target separation still unclear")}</text>
    ${drawInfoPanel(164, 520, 280, "why it can still work", "good target biology can still win if the usable exposure window is real.", accent)}
    ${drawInfoPanel(510, 520, 280, "what kills it", "normal tissue overlap and carrier mismatch usually show up before the chemistry does.", accent)}
    ${drawInfoPanel(856, 520, 280, "best next test", "expression mapping plus first biodistribution read usually tells you if this class deserves more work.", accent)}
  `;
}

function buildScene(ctx: FigureContext) {
  if (ctx.blueprint.focus === "biology") return drawBiologyScene(ctx);
  if (ctx.figureType === "construct architecture") return drawArchitectureScene(ctx);
  if (ctx.figureType === "cell trafficking figure") return drawTraffickingScene(ctx);
  if (ctx.figureType === "disease biology figure") return drawBiologyScene(ctx);
  if (ctx.figureType === "expression / risk figure") return drawRiskScene(ctx);
  return drawMechanismScene(ctx);
}

function buildComposedSvg(ctx: FigureContext, checks: FigureCheck[]) {
  const titleText = ctx.title
    .map(
      (line, index) =>
        `<tspan x="70" dy="${index === 0 ? 0 : 28}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  const subtitleText = ctx.subtitle
    .map(
      (line, index) =>
        `<tspan x="70" dy="${index === 0 ? 0 : 22}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const scene = buildScene(ctx);
  const outerStroke = ctx.highContrast ? "#94a3b8" : "#dbeafe";
  const frameStrokeWidth = ctx.highContrast ? 4 : 3;
  const sceneStroke = ctx.highContrast ? "#cbd5e1" : "#e2e8f0";
  const legendX = ctx.layoutVariant % 2 === 0 ? 1010 : 970;
  const legendY = ctx.layoutVariant >= 2 ? 78 : 68;
  const relationshipStrip = ctx.blueprint.relationships
    .slice(0, 3)
    .map((relationship, index) => {
      const x = 86 + index * 366;
      return `
        <rect x="${x}" y="618" rx="18" ry="18" width="332" height="76" fill="#ffffff" stroke="${outerStroke}" stroke-width="2"/>
        <text x="${x + 20}" y="645" font-family="Arial, sans-serif" font-size="11" letter-spacing="2" font-weight="700" fill="${ctx.accent.label}">KEY RELATIONSHIP</text>
        <text x="${x + 20}" y="675" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">${escapeXml(
          `${relationship.from} ${relationship.label} ${relationship.to}`,
        )}</text>
      `;
    })
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="744" viewBox="0 0 1280 744" role="img" aria-label="${escapeXml(ctx.prompt)}">
      <rect width="1280" height="744" fill="#f8fafc" />
      <rect x="28" y="28" width="1224" height="688" rx="34" ry="34" fill="#ffffff" stroke="${outerStroke}" stroke-width="${frameStrokeWidth}"/>
      <text x="70" y="86" font-family="Arial, sans-serif" font-size="18" letter-spacing="6" font-weight="700" fill="#0284c7">FIGURE STUDIO</text>
      <text x="70" y="120" font-family="Arial, sans-serif" font-size="16" font-weight="800" fill="#0f172a">${titleText}</text>
      <text x="70" y="156" font-family="Arial, sans-serif" font-size="13" fill="#475569">${subtitleText}</text>
      <g transform="translate(${legendX - 1010} ${legendY - 68})">
        ${drawLegend(ctx.accent, ctx.modality, ctx.figureType)}
      </g>
      <rect x="68" y="184" width="1144" height="394" rx="30" ry="30" fill="#fcfdff" stroke="${sceneStroke}" stroke-width="2"/>
      ${scene}
      ${relationshipStrip}
      <text x="70" y="708" font-family="Arial, sans-serif" font-size="16" fill="#334155">${escapeXml(ctx.style)} · deterministic scientific figure composer · ${checks.filter((check) => check.passed).length}/${checks.length} checks passed</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function tryOpenAiImage(prompt: string, style?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const styledPrompt = `${prompt}. style: ${style || "scientific schematic"}. clean scientific figure, white background, no watermark, no extra paragraph text.`;

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: styledPrompt,
      size: "1536x1024",
      quality: "medium",
    }),
  });

  if (!response.ok) {
    throw new Error("openai image generation failed");
  }

  const data = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };

  const first = data.data?.[0];
  if (!first) return null;
  if (first.b64_json) {
    return {
      imageUrl: `data:image/png;base64,${first.b64_json}`,
      source: "openai image api",
      note: "generated through a real image api.",
    };
  }
  if (first.url) {
    return {
      imageUrl: first.url,
      source: "openai image api",
      note: "generated through a real image api.",
    };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FigureRequest;
    const prompt = clean(body.prompt ?? "");
    const style = clean(body.style ?? "scientific schematic");
    const requestedType = body.figureType ?? "auto";
    const requestedRenderMode = body.renderMode ?? "auto";
    const nonce = clean(body.nonce ?? "");

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    let context = buildFigureContext(prompt, style, requestedType, nonce);
    let checks = runFigureChecks(context);
    let review = reviewRenderedFigure(context, checks);
    let reviewPasses = 1;

    while (!review.pass && reviewPasses < 3 && review.next) {
      context = applyReviewTuning(context, review.next);
      checks = runFigureChecks(context);
      review = reviewRenderedFigure(context, checks);
      reviewPasses += 1;
    }

    const failingChecks = checks.filter((check) => !check.passed);

    const canUseAiImage = Boolean(process.env.OPENAI_API_KEY);
    const shouldTryAiImage =
      requestedRenderMode === "ai-image" ||
      (requestedRenderMode === "auto" &&
        requestedType === "auto" &&
        context.blueprint.focus !== "biology" &&
        checks.filter((check) => check.passed).length > 8);

    if (requestedRenderMode !== "composer" && canUseAiImage && shouldTryAiImage) {
      try {
        const openAiResult = await tryOpenAiImage(prompt, style);
        if (openAiResult) {
          return NextResponse.json({
            ...openAiResult,
            figureType: context.figureType,
            renderMode: "ai-image",
            review: {
              passes: reviewPasses,
              score: review.score,
              notes: review.notes,
            },
            checks,
            interpretation: buildInterpretationPayload(context),
          });
        }
      } catch {
        // fall back to deterministic composer
      }
    }

    const payload: FigureResponsePayload = {
      imageUrl: buildComposedSvg(context, checks),
      source: "deterministic scientific figure composer",
      note:
        requestedRenderMode === "ai-image" && !canUseAiImage
          ? "ai image mode was requested, but no openai image key is configured here yet, so figure studio used the structured composer instead."
          : failingChecks.length > 0
          ? `the figure was still generated from a ${context.blueprint.focus} blueprint, but ${failingChecks.length} checks stayed soft, so this is best used as a concept figure rather than a final mechanism panel.`
          : `the figure passed the internal composition checks and was built from a deterministic ${context.blueprint.focus} blueprint.`,
      figureType: context.figureType,
      renderMode: "composer",
      review: {
        passes: reviewPasses,
        score: review.score,
        notes: review.notes,
      },
      checks,
      interpretation: buildInterpretationPayload(context),
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "figure generation failed" }, { status: 500 });
  }
}
