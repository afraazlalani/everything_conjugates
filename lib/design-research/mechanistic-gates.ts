import { GATE_PENALTIES } from "./config";
import { BiologicalAbstraction, EvidenceObject, GateDecision, MechanismInference, NormalizedCase, MODALITY_ORDER } from "./types";

type GateContext = {
  evidenceObjects?: EvidenceObject[];
  mechanismInference?: MechanismInference | null;
  abstraction?: BiologicalAbstraction | null;
};

export function evaluateMechanisticGates(input: NormalizedCase, context: GateContext = {}): GateDecision[] {
  const evidenceObjects = context.evidenceObjects ?? [];
  const mechanismInference = context.mechanismInference;
  const abstraction = context.abstraction;
  const hasTargetMissingEvidence = evidenceObjects.some((item) => item.label === "missing target context");
  const cnsBarrierSignal =
    evidenceObjects.some((item) => item.themes.includes("cns / bbb")) ||
    abstraction?.deliveryAccessibility === "barrier-limited";
  const pathwayModulation = mechanismInference?.mechanismClass === "pathway modulation";

  return MODALITY_ORDER.map((modality) => {
    const reasons: string[] = [];
    const missingEvidence: string[] = [];
    const upgradeEvidence: string[] = [];
    let penalty = 0;
    let status: GateDecision["status"] = "allowed";

    const addMissing = (value: string) => {
      if (!missingEvidence.includes(value)) missingEvidence.push(value);
    };
    const addUpgrade = (value: string) => {
      if (!upgradeEvidence.includes(value)) upgradeEvidence.push(value);
    };

    if (input.mechanismClass === "gene modulation" && (modality === "adc" || modality === "rdc")) {
      reasons.push("the prompt points to intracellular rna biology, which is not a natural fit for this class.");
      if (modality === "adc") {
        addMissing("a non-cytotoxic antibody-payload logic or a real cell-ablation rationale");
        addUpgrade("show that the therapeutic engine is not transcript correction but antibody-mediated intracellular payload delivery");
      } else {
        addMissing("a localization-first radiobiology rationale");
        addUpgrade("show that isotope localization, retention, and dosimetry are the therapeutic engine");
      }
      penalty += GATE_PENALTIES.gatedOut;
      status = "gated out";
    }

    if ((!input.hasSelectiveSurfaceTarget || abstraction?.targetClass === "none yet") && (modality === "adc" || modality === "smdc")) {
      reasons.push("there is no credible selective cell-surface or ligand target yet.");
      addMissing(modality === "adc" ? "a selective internalizing surface target" : "a selective ligandable target");
      addUpgrade(
        modality === "adc"
          ? "show target expression separation plus uptake/internalization data"
          : "show a ligandable target with binding tolerance after linker-payload attachment",
      );
      penalty += GATE_PENALTIES.majorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (modality === "pdc" && !input.explicitPeptideSupport) {
      reasons.push("pdc should not win without affirmative peptide-targeting support.");
      addMissing("a peptide targeting handle with believable uptake or localization biology");
      addUpgrade("show peptide binding, stability, and internalization or tissue-localization support");
      penalty += input.broadOncologyNoTarget ? GATE_PENALTIES.majorPenalty : GATE_PENALTIES.minorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (input.broadOncologyNoTarget && modality === "pdc") {
      reasons.push("a broad oncology prompt with no target or mechanism is too under-specified to justify a peptide-directed lead.");
      penalty += GATE_PENALTIES.mediumPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (input.targetInternalizationKnown === "slow" && (modality === "adc" || modality === "pdc")) {
      reasons.push("the known internalization behavior looks weak for a release story that depends on cellular uptake.");
      addMissing("credible internalization and trafficking data");
      addUpgrade("show productive uptake into the compartment where release or activity must happen");
      penalty += GATE_PENALTIES.mediumPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (
      abstraction?.treatmentContext === "chronic" &&
      abstraction.pathologyType !== "oncology" &&
      abstraction.cytotoxicFit !== "favored" &&
      (modality === "adc" || modality === "pdc" || modality === "smdc")
    ) {
      reasons.push("classical cytotoxic payload logic is hard to justify in a chronic non-oncology setting without a much stronger argument.");
      addMissing("a non-cytotoxic payload logic or a justified cell-ablation hypothesis");
      addUpgrade("show why chronic disease biology really wants selective cell killing or a non-cytotoxic conjugate payload");
      penalty += GATE_PENALTIES.majorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (input.needsNuclearAccess && (modality === "adc" || modality === "rdc")) {
      reasons.push("the prompt likely needs nuclear or deep intracellular access, which this class usually does not solve directly.");
      penalty += GATE_PENALTIES.mediumPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (modality === "rdc" && input.mechanismClass !== "radiobiology") {
      reasons.push("radioligand logic only makes sense if localization plus isotope physics are the actual therapeutic engine.");
      addMissing("a localization and isotope rationale");
      addUpgrade("show that target retention, isotope choice, and dosimetry are central to efficacy");
      penalty += GATE_PENALTIES.minorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (
      modality === "oligo conjugate" &&
      abstraction?.therapeuticIntent !== "gene/rna modulation" &&
      !(pathwayModulation && cnsBarrierSignal) &&
      !(input.diseaseArea === "neuromuscular" && input.diseaseSpecificity === "specific")
    ) {
      reasons.push("oligo conjugates only win when the active biology is genuinely sequence-directed or rna-mediated.");
      addMissing("a transcript, pathway, or sequence-directed active biology");
      addUpgrade("show a target transcript or intracellular pathway that benefits from an oligo-class active species");
      penalty += GATE_PENALTIES.minorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (modality === "enzyme conjugate" && input.mechanismClass !== "enzyme/prodrug") {
      reasons.push("enzyme conjugates should not lead without affirmative catalytic or prodrug activation logic.");
      addMissing("a catalytic, enzyme-replacement, or local prodrug-activation rationale");
      addUpgrade("show that enzymatic turnover or activation is the real selectivity engine");
      penalty += GATE_PENALTIES.mediumPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (hasTargetMissingEvidence && (modality === "adc" || modality === "smdc" || modality === "pdc")) {
      reasons.push("retrieved evidence still does not identify a real target or entry handle for this class.");
      addMissing("a real target or entry handle");
      addUpgrade("show expression, accessibility, and entry-handle biology for this modality");
      penalty += GATE_PENALTIES.minorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (cnsBarrierSignal && ["adc", "pdc", "enzyme conjugate"].includes(modality)) {
      reasons.push("retrieved biology highlights a cns / bbb delivery barrier, which makes large or locally activated default architectures less natural.");
      addMissing("a believable brain-entry route or local administration plan");
      addUpgrade("show csf dosing, receptor-mediated transport, or another validated brain exposure route");
      penalty += GATE_PENALTIES.minorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (cnsBarrierSignal && pathwayModulation && modality === "rdc") {
      reasons.push("retrieved disease biology points toward barrier-limited pathway modulation, so isotope-localization logic should not sit near the top without a very specific target-retention case.");
      penalty += GATE_PENALTIES.mediumPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (mechanismInference?.source === "evidence" && mechanismInference.mechanismClass === "gene modulation" && modality === "oligo conjugate") {
      reasons.push("retrieved evidence directly supports sequence-directed intervention logic for this case.");
    }

    return {
      modality,
      status,
      reasons: reasons.length ? reasons : ["no hard mechanistic contradiction was detected."],
      penalty,
      missingEvidence,
      upgradeEvidence,
    };
  });
}
