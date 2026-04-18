import { SCORE_WEIGHTS } from "./config";
import {
  BiologicalAbstraction,
  EvidenceObject,
  GateDecision,
  LiteratureSignal,
  MechanismInference,
  ModalityName,
  ModalityScore,
  NormalizedCase,
  ScoreCategory,
  ScoreComponent,
} from "./types";

function makeComponent(category: ScoreCategory, raw: number, rationale: string): ScoreComponent {
  const weight = SCORE_WEIGHTS[category];
  return {
    category,
    raw,
    weight,
    weighted: raw * weight,
    rationale,
  };
}

function literatureFor(modality: ModalityName, literatureSignals: LiteratureSignal[]) {
  return literatureSignals.find((item) => item.modality === modality);
}

function evidenceBonusFor(modality: ModalityName, evidenceObjects: EvidenceObject[]) {
  return evidenceObjects.reduce((sum, item) => {
    if (!item.modalityHints?.includes(modality)) {
      return sum;
    }
    if (item.direction === "supports") {
      return sum + (item.strength === "high" ? 2 : item.strength === "medium" ? 1 : 0.5);
    }
    if (item.direction === "penalizes") {
      return sum - (item.strength === "high" ? 2 : item.strength === "medium" ? 1 : 0.5);
    }
    return sum;
  }, 0);
}

export function scoreModalities(
  input: NormalizedCase,
  gates: GateDecision[],
  literatureSignals: LiteratureSignal[],
  context: {
    evidenceObjects?: EvidenceObject[];
    mechanismInference?: MechanismInference | null;
    abstraction?: BiologicalAbstraction | null;
  } = {},
): ModalityScore[] {
  const evidenceObjects = context.evidenceObjects ?? [];
  const mechanismInference = context.mechanismInference;
  const abstraction = context.abstraction;
  const cnsBarrierSignal = (mechanismInference?.themes.includes("cns / bbb") ?? false) || abstraction?.deliveryAccessibility === "barrier-limited";
  const neurodegenerationSignal = (mechanismInference?.themes.includes("neurodegeneration") ?? false) || abstraction?.pathologyType === "neurodegeneration";
  const pathwayModulation =
    mechanismInference?.mechanismClass === "pathway modulation" || abstraction?.therapeuticIntent === "pathway modulation";
  const chronicNonOncology = abstraction?.treatmentContext === "chronic" && abstraction?.pathologyType !== "oncology";

  return gates
    .map((gate) => {
      const modality = gate.modality;
      const literature = literatureFor(modality, literatureSignals);
      const literatureScore = literature ? Math.max(-1, Math.min(3, literature.literatureStrength)) : 0;
      const evidenceBonus = Math.max(-3, Math.min(3, evidenceBonusFor(modality, evidenceObjects)));

      const components: ScoreComponent[] = [];

      if (modality === "oligo conjugate") {
        const neuromuscularSpecificProvisional =
          input.diseaseArea === "neuromuscular" &&
          input.diseaseSpecificity === "specific" &&
          input.mechanismClass === "unknown";
        const cnsPathwayProvisional = pathwayModulation && cnsBarrierSignal;
        components.push(
          makeComponent(
            "biology fit",
            input.mechanismClass === "gene modulation" ? 3 : cnsPathwayProvisional ? 1 : neuromuscularSpecificProvisional ? 1 : -2,
            input.mechanismClass === "gene modulation"
              ? "the disease read points toward rna-directed biology."
              : cnsPathwayProvisional
                ? "the disease read is cns-constrained and pathway-modulatory, so non-cytotoxic oligo or delivery-handle logic stays biologically plausible at a provisional level."
              : neuromuscularSpecificProvisional
                ? "this is a specific neuromuscular disease prompt, so sequence-directed oligo biology remains a plausible provisional fit even before the exact rna mechanism is spelled out."
              : "this class only makes sense when the active mechanism is sequence-directed.",
          ),
          makeComponent(
            "payload mechanism compatibility",
            input.mechanismClass === "gene modulation" ? 3 : cnsPathwayProvisional ? 1 : neuromuscularSpecificProvisional ? 1 : -2,
            cnsPathwayProvisional
              ? "in a cns pathway-modulation case, oligo payload logic is still biologically plausible because the active job is more likely pathway or transcript modulation than released warhead killing."
              : neuromuscularSpecificProvisional
              ? "in a named neuromuscular disease setting, oligo payload logic is still a live provisional route while mechanism evidence is being clarified."
              : "the payload is the oligo scaffold itself rather than a classical warhead.",
          ),
          makeComponent(
            "linker/release feasibility",
            input.mechanismClass === "gene modulation" ? 2 : cnsPathwayProvisional ? 1 : neuromuscularSpecificProvisional ? 1 : -1,
            cnsPathwayProvisional
              ? "for transport-aware cns strategies, scaffold-preserving delivery is still more plausible than free-payload release."
              : "the preferred design is usually stable scaffold preservation rather than free-payload release.",
          ),
          makeComponent(
            "target internalization/trafficking",
            input.needsIntracellularAccess ? 1 : 0,
            "productive trafficking is usually the main bottleneck for oligo programs.",
          ),
          makeComponent(
            "intracellular compartment access",
            abstraction?.compartmentNeed === "nuclear" ||
            abstraction?.compartmentNeed === "cytosolic" ||
            input.needsNuclearAccess ||
            input.needsIntracellularAccess
              ? 2
              : 0,
            "the class is built around intracellular sequence-directed biology, even if delivery remains hard.",
          ),
        );
      } else if (modality === "adc") {
        components.push(
          makeComponent(
            "biology fit",
            input.mechanismClass === "cytotoxic delivery"
              ? 3
              : input.mechanismClass === "gene modulation"
                ? -3
                : pathwayModulation && cnsBarrierSignal
                  ? -2
                : input.broadOncologyNoTarget
                  ? 2
                  : 0,
            pathwayModulation && cnsBarrierSignal
              ? "in a cns / neurodegeneration case, adc looks less natural at disease level because barrier access and non-cytotoxic biology matter more than classical antibody warhead delivery."
              : input.broadOncologyNoTarget
              ? "for a broad oncology prompt with no target-conditioned biology yet, adc is the more defensible provisional default than peptide-first classes."
              : "adc only truly wins when the therapeutic event is intracellular payload delivery.",
          ),
          makeComponent(
            "payload mechanism compatibility",
            input.mechanismClass === "cytotoxic delivery" ? 3 : pathwayModulation && neurodegenerationSignal ? -2 : input.broadOncologyNoTarget ? 1 : -2,
            pathwayModulation && neurodegenerationSignal
              ? "the disease biology reads more like chronic pathway modulation than released cytotoxic payload delivery."
              : input.broadOncologyNoTarget
              ? "broad oncology still maps more naturally to established cytotoxic-delivery playbooks than to peptide-specific targeting by default."
              : "antibody-drug conjugates are optimized for warhead delivery, not sequence rescue.",
          ),
          makeComponent(
            "linker/release feasibility",
            input.needsInternalization ? 2 : 0,
            "adc linker logic usually depends on a believable internalization and release story.",
          ),
          makeComponent(
            "target internalization/trafficking",
            input.targetInternalizationKnown === "fast" ? 2 : input.targetInternalizationKnown === "slow" ? -2 : input.broadOncologyNoTarget ? 0 : 0,
            input.broadOncologyNoTarget
              ? "internalization is still unknown here, so adc should stay provisional rather than confident."
              : "internalization quality matters much more here than for classes driven by localization or scaffold preservation.",
          ),
          makeComponent(
            "intracellular compartment access",
            abstraction?.compartmentNeed === "nuclear" ? -2 : input.needsNuclearAccess ? -2 : 0,
            "adc can reach lysosomal release contexts more naturally than nuclear oligo biology.",
          ),
        );
      } else if (modality === "rdc") {
        components.push(
          makeComponent(
            "biology fit",
            input.mechanismClass === "radiobiology" ? 3 : pathwayModulation && cnsBarrierSignal ? -3 : input.mechanismClass === "gene modulation" ? -3 : 0,
            pathwayModulation && cnsBarrierSignal
              ? "rdc is not a natural disease-level fit here because the grounded biology is about barrier-limited pathway modulation, not isotope localization."
              : "rdc only wins when isotope localization is the real mechanism.",
          ),
          makeComponent(
            "payload mechanism compatibility",
            input.mechanismClass === "radiobiology" ? 3 : pathwayModulation && neurodegenerationSignal ? -3 : -2,
            pathwayModulation && neurodegenerationSignal
              ? "the disease biology is chronic neurodegeneration and pathway modulation, which is a poor match for isotope-first payload logic."
              : "the payload is the radiometal system, not a classic released small-molecule payload.",
          ),
          makeComponent(
            "linker/release feasibility",
            input.mechanismClass === "radiobiology" ? 2 : pathwayModulation && cnsBarrierSignal ? -2 : -1,
            pathwayModulation && cnsBarrierSignal
              ? "chelator-and-isotope logic does not line up naturally with a cns transport problem unless there is a very specific localization rationale."
              : "rdc logic cares more about chelator stability than free-drug release.",
          ),
          makeComponent(
            "target internalization/trafficking",
            0,
            "internalization can help, but localization and retention are usually more important.",
          ),
          makeComponent(
            "intracellular compartment access",
            abstraction?.compartmentNeed === "nuclear" ? -2 : input.needsNuclearAccess ? -2 : 0,
            "rdc is usually not solving deep intracellular or nuclear access directly.",
          ),
        );
      } else if (modality === "smdc") {
        components.push(
          makeComponent(
            "biology fit",
            abstraction?.targetClass === "small-molecule ligand handle"
              ? 1
              : pathwayModulation && cnsBarrierSignal
                ? 0
                : input.hasSelectiveSurfaceTarget
                  ? 1
                  : -2,
            pathwayModulation && cnsBarrierSignal
              ? "small-format logic is more biologically plausible here than large cytotoxic carriers, but smdc still needs a real transport handle or ligand to move beyond disease-level plausibility."
              : "smdc needs a believable compact ligand or pharmacophore entry point.",
          ),
          makeComponent(
            "payload mechanism compatibility",
            input.mechanismClass === "cytotoxic delivery" ? 2 : input.mechanismClass === "gene modulation" ? -2 : 0,
            "smdc is still a small-molecule payload architecture, not an oligo scaffold architecture.",
          ),
          makeComponent(
            "linker/release feasibility",
            1,
            "linker tuning matters a lot because compact chemistries feel polarity and bulk penalties early.",
          ),
          makeComponent(
            "target internalization/trafficking",
            input.targetInternalizationKnown === "fast" ? 1 : 0,
            "trafficking helps, but ligand tolerance and biodistribution often dominate first.",
          ),
          makeComponent(
            "intracellular compartment access",
            abstraction?.compartmentNeed === "nuclear" ? -2 : input.needsNuclearAccess ? -2 : 0,
            "smdc does not naturally solve the same intracellular sequence biology as oligo conjugates.",
          ),
        );
      } else if (modality === "pdc") {
        components.push(
          makeComponent(
            "biology fit",
            pathwayModulation && cnsBarrierSignal ? 0 : input.explicitPeptideSupport ? 2 : input.broadOncologyNoTarget ? -2 : input.hasSelectiveSurfaceTarget ? 1 : -1,
            pathwayModulation && cnsBarrierSignal
              ? "peptide-directed transport or shuttle logic is not ruled out in a cns case, but it still needs affirmative binder or transport evidence before it can lead."
              : input.explicitPeptideSupport
              ? "the prompt includes affirmative peptide-targeting support, so pdc deserves real consideration."
              : input.broadOncologyNoTarget
                ? "nothing in this broad oncology prompt positively supports peptide-directed targeting."
                : "pdc is usually a middle-ground class that only helps when peptide targeting adds something real.",
          ),
          makeComponent(
            "payload mechanism compatibility",
            input.mechanismClass === "cytotoxic delivery" ? 2 : input.mechanismClass === "gene modulation" ? -1 : input.broadOncologyNoTarget ? 0 : 0,
            input.broadOncologyNoTarget
              ? "without a peptide-specific rationale, pdc should not get extra credit just because oncology is broad."
              : "pdc still usually lives in a linker-plus-payload world rather than a scaffold-preservation world.",
          ),
          makeComponent(
            "linker/release feasibility",
            input.explicitPeptideSupport ? 1 : input.broadOncologyNoTarget ? -1 : 1,
            input.broadOncologyNoTarget
              ? "linker and stability burden should count against pdc when there is no peptide-first targeting case yet."
              : "peptide stability and release logic have to survive real payload load.",
          ),
          makeComponent(
            "target internalization/trafficking",
            input.targetInternalizationKnown === "fast" ? 1 : 0,
            "cellular uptake helps if peptide targeting is being used to reach an intracellular payload event.",
          ),
          makeComponent(
            "intracellular compartment access",
            abstraction?.compartmentNeed === "nuclear" ? -1 : input.needsNuclearAccess ? -1 : 0,
            "pdc is rarely the cleanest solution for nuclear or splice-rescue biology.",
          ),
        );
      } else {
        components.push(
          makeComponent(
            "biology fit",
            input.mechanismClass === "enzyme/prodrug" ? 3 : -2,
            "enzyme conjugates only win when local catalysis or prodrug activation is the real source of selectivity.",
          ),
          makeComponent(
            "payload mechanism compatibility",
            input.mechanismClass === "enzyme/prodrug" ? 2 : -2,
            "the mechanism depends on activation chemistry rather than a standard warhead or oligo scaffold.",
          ),
          makeComponent(
            "linker/release feasibility",
            1,
            "release logic is usually tied to activation chemistry rather than classical cleavage motifs.",
          ),
          makeComponent(
            "target internalization/trafficking",
            0,
            "trafficking may matter, but catalytic competence often matters just as much.",
          ),
          makeComponent(
            "intracellular compartment access",
            0,
            "the key issue is local activation fit, not always deep intracellular access.",
          ),
        );
      }

      components.push(
        makeComponent(
          "target density/turnover",
          abstraction?.targetClass === "none yet"
            ? 0
            : input.targetDensityKnown === "high"
              ? 2
              : input.targetDensityKnown === "low"
                ? -1
                : 0,
          "target abundance and persistence can change how much delivery leverage the class really has.",
        ),
        makeComponent(
          "conjugation/DAR/platform feasibility",
          modality === "adc" ? 2 : modality === "oligo conjugate" ? 1 : abstraction?.targetClass === "none yet" ? -1 : 0,
          "platform maturity and conjugation tractability are better in some classes than others.",
        ),
        makeComponent(
          "PK/BD constraints",
          pathwayModulation && cnsBarrierSignal
            ? modality === "adc"
              ? -2
              : modality === "smdc" || modality === "oligo conjugate"
                ? 1
                : 0
            : modality === "adc"
              ? 1
              : modality === "smdc"
                ? -1
                : 0,
          pathwayModulation && cnsBarrierSignal
            ? "biodistribution and barrier access are central here, so formats with better transport logic stay more plausible than large default carriers."
            : "biodistribution and exposure constraints can become the real limiter even when mechanism fit looks good.",
        ),
        makeComponent(
          "translational/species tractability",
          modality === "adc" || modality === "rdc" || modality === "oligo conjugate" ? 1 : 0,
          "some classes have clearer translational playbooks and cross-species tooling than others.",
        ),
        makeComponent(
          "CMC/manufacturability complexity",
          modality === "adc" ? 1 : modality === "enzyme conjugate" ? -1 : 0,
          "manufacturing burden matters, especially when the scientific lead is only modest.",
        ),
        makeComponent(
          "precedent/evidence strength",
          modality === "pdc" && input.broadOncologyNoTarget
            ? Math.min(literatureScore + evidenceBonus, 0)
            : modality === "rdc" && pathwayModulation && cnsBarrierSignal
              ? Math.min(literatureScore + evidenceBonus, 0)
              : literatureScore + evidenceBonus,
          evidenceObjects.some((item) => item.modalityHints?.includes(modality))
            ? `retrieved evidence objects plus live literature currently shift this class by ${Number((literatureScore + evidenceBonus).toFixed(1))}.`
            : literature?.hitCount
              ? `this class has ${literature.hitCount} relevant literature hits with a normalized strength of ${literature.literatureStrength.toFixed(1)}.`
              : "live evidence for this class is still thin in the current retrieval pass.",
        ),
        makeComponent(
          "safety/therapeutic-window fit",
          chronicNonOncology && ["adc", "pdc", "smdc"].includes(modality)
            ? -2
            : cnsBarrierSignal && ["adc", "pdc", "enzyme conjugate"].includes(modality)
              ? -1
              : 1,
          cnsBarrierSignal
            ? "retrieved disease grounding points to a cns/barrier context, so safety and exposure constraints should stay front and center."
            : "the safety window depends on disease context, payload mechanism, and whether chronic exposure is acceptable.",
        ),
      );

      const positive = components.filter((component) => component.weighted > 0).reduce((sum, component) => sum + component.weighted, 0);
      const negative = components.filter((component) => component.weighted < 0).reduce((sum, component) => sum + component.weighted, 0);
      const total = positive + negative + gate.penalty;

      return {
        modality,
        total,
        gate,
        components,
        explainableTotal: {
          positive,
          negative,
          gatePenalty: gate.penalty,
        },
      };
    })
    .sort((left, right) => right.total - left.total);
}
