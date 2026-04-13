import { GATE_PENALTIES } from "./config";
import { EvidenceObject, GateDecision, MechanismInference, NormalizedCase, MODALITY_ORDER } from "./types";

type GateContext = {
  evidenceObjects?: EvidenceObject[];
  mechanismInference?: MechanismInference | null;
};

export function evaluateMechanisticGates(input: NormalizedCase, context: GateContext = {}): GateDecision[] {
  const evidenceObjects = context.evidenceObjects ?? [];
  const mechanismInference = context.mechanismInference;
  const hasTargetMissingEvidence = evidenceObjects.some((item) => item.label === "missing target context");
  const cnsBarrierSignal = evidenceObjects.some((item) => item.themes.includes("cns / bbb"));

  return MODALITY_ORDER.map((modality) => {
    const reasons: string[] = [];
    let penalty = 0;
    let status: GateDecision["status"] = "allowed";

    if (input.mechanismClass === "gene modulation" && (modality === "adc" || modality === "rdc")) {
      reasons.push("the prompt points to intracellular rna biology, which is not a natural fit for this class.");
      penalty += GATE_PENALTIES.gatedOut;
      status = "gated out";
    }

    if (!input.hasSelectiveSurfaceTarget && (modality === "adc" || modality === "smdc")) {
      reasons.push("there is no credible selective cell-surface or ligand target yet.");
      penalty += GATE_PENALTIES.majorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (modality === "pdc" && !input.explicitPeptideSupport) {
      reasons.push("pdc should not win without affirmative peptide-targeting support.");
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
      penalty += GATE_PENALTIES.mediumPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (
      input.chronicContext &&
      input.diseaseArea !== "oncology" &&
      input.mechanismClass !== "cytotoxic delivery" &&
      (modality === "adc" || modality === "pdc" || modality === "smdc")
    ) {
      reasons.push("classical cytotoxic payload logic is hard to justify in a chronic non-oncology setting without a much stronger argument.");
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
      penalty += GATE_PENALTIES.minorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (
      modality === "oligo conjugate" &&
      input.mechanismClass !== "gene modulation" &&
      !(input.diseaseArea === "neuromuscular" && input.diseaseSpecificity === "specific")
    ) {
      reasons.push("oligo conjugates only win when the active biology is genuinely sequence-directed or rna-mediated.");
      penalty += GATE_PENALTIES.minorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (modality === "enzyme conjugate" && input.mechanismClass !== "enzyme/prodrug") {
      reasons.push("enzyme conjugates should not lead without affirmative catalytic or prodrug activation logic.");
      penalty += GATE_PENALTIES.mediumPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (hasTargetMissingEvidence && (modality === "adc" || modality === "smdc" || modality === "pdc")) {
      reasons.push("retrieved evidence still does not identify a real target or entry handle for this class.");
      penalty += GATE_PENALTIES.minorPenalty;
      status = status === "gated out" ? status : "penalized";
    }

    if (cnsBarrierSignal && ["adc", "pdc", "enzyme conjugate"].includes(modality)) {
      reasons.push("retrieved biology highlights a cns / bbb delivery barrier, which makes large or locally activated default architectures less natural.");
      penalty += GATE_PENALTIES.minorPenalty;
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
    };
  });
}
