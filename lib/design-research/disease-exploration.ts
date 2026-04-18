import {
  BiologicalAbstraction,
  DiseaseExploration,
  DiseaseExplorationStrategyBucket,
  EvidenceObject,
  MechanismInference,
  NormalizedCase,
} from "./types";

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function findEvidenceIds(
  evidenceObjects: EvidenceObject[],
  matcher: (item: EvidenceObject) => boolean,
): string[] {
  return evidenceObjects
    .filter(matcher)
    .map((item) => item.id)
    .slice(0, 4);
}

function textIncludesAny(value: string | undefined, patterns: RegExp[]): boolean {
  const source = value ?? "";
  return patterns.some((pattern) => pattern.test(source));
}

function evidenceMentions(
  evidenceObjects: EvidenceObject[],
  patterns: RegExp[],
): boolean {
  return evidenceObjects.some((item) =>
    textIncludesAny(
      [
        item.label,
        item.claim,
        item.rationale,
        ...item.mechanismHints,
        ...item.themes,
        ...(item.modalityHints ?? []),
      ].join(" "),
      patterns,
    ),
  );
}

function buildConstraintList(abstraction: BiologicalAbstraction): string[] {
  return uniqueStrings([
    abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : undefined,
    abstraction.deliveryAccessibility === "intracellular difficult" ? "productive intracellular routing" : undefined,
    abstraction.compartmentNeed === "nuclear" ? "nuclear access" : undefined,
    abstraction.compartmentNeed === "cytosolic" ? "cytosolic delivery" : undefined,
    abstraction.compartmentNeed === "extracellular" ? "extracellular accessibility" : undefined,
    abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : undefined,
    abstraction.pathologyType === "neurodegeneration" ? "neurodegeneration / cns biology" : undefined,
    abstraction.pathologyType === "autoimmune/inflammatory" ? "immune-inflammatory selectivity" : undefined,
    abstraction.pathologyType === "oncology" ? "tumor selectivity and target window" : undefined,
    abstraction.cytotoxicFit === "discouraged" ? "non-cytotoxic fit" : undefined,
  ]);
}

function buildBucket(
  bucket: DiseaseExplorationStrategyBucket,
  abstraction: BiologicalAbstraction,
): DiseaseExplorationStrategyBucket {
  return {
    ...bucket,
    diseaseSpecificConstraints: uniqueStrings([
      ...bucket.diseaseSpecificConstraints,
      ...buildConstraintList(abstraction),
    ]).slice(0, 4),
  };
}

function addBucket(
  buckets: DiseaseExplorationStrategyBucket[],
  bucket: DiseaseExplorationStrategyBucket,
): void {
  if (buckets.some((item) => item.label === bucket.label)) {
    return;
  }

  buckets.push(bucket);
}

function buildDiseaseFrame(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
  mechanismInference: MechanismInference,
): string {
  const diseaseLabel = input.disease?.canonical ?? input.parsed.diseaseMention ?? "this disease";
  const parts = [
    abstraction.pathologyType !== "unknown" ? abstraction.pathologyType : undefined,
    abstraction.therapeuticIntent !== "unknown" ? abstraction.therapeuticIntent : undefined,
    abstraction.deliveryAccessibility !== "unknown" ? abstraction.deliveryAccessibility : undefined,
  ].filter(Boolean);

  const lead =
    parts.length > 0
      ? `${diseaseLabel} currently reads like a ${parts.join(" / ")} case.`
      : `${diseaseLabel} has enough disease-level biology to explore strategy buckets, even though the final construct choice is still open.`;

  const mechanismNote =
    mechanismInference.mechanismClass !== "unknown"
      ? ` the current mechanism read leans toward ${mechanismInference.mechanismClass}.`
      : "";

  const barrierNote =
    abstraction.deliveryBarriers.length > 0
      ? ` the main delivery constraints right now are ${abstraction.deliveryBarriers.join(", ")}.`
      : "";

  return `${lead}${mechanismNote}${barrierNote}`.trim();
}

function buildStrategyBuckets(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
  mechanismInference: MechanismInference,
  evidenceObjects: EvidenceObject[],
): DiseaseExplorationStrategyBucket[] {
  const buckets: DiseaseExplorationStrategyBucket[] = [];
  const isNeuroBarrierCase = Boolean(
    abstraction.pathologyType === "neurodegeneration" ||
    abstraction.deliveryAccessibility === "barrier-limited" ||
    abstraction.deliveryBarriers.some((item) => /bbb|blood-brain|cns/i.test(item)),
  );
  const hasGeneOrTranscriptSignals = Boolean(
    abstraction.therapeuticIntent === "gene/rna modulation" ||
    abstraction.compartmentNeed === "nuclear" ||
    abstraction.compartmentNeed === "cytosolic" ||
    abstraction.mechanismLocation === "intracellular" ||
    mechanismInference.mechanismClass === "gene modulation" ||
    evidenceMentions(evidenceObjects, [
      /\bgene modulation\b/i,
      /\brna\b/i,
      /\boligo/i,
      /\btranscript\b/i,
      /\bsplice\b/i,
      /\bexon\b/i,
    ])
  );
  const hasExtracellularNeuroSignals = Boolean(
    abstraction.targetClass === "soluble/extracellular factor" ||
    abstraction.compartmentNeed === "extracellular" ||
    abstraction.mechanismLocation === "extracellular" ||
    evidenceMentions(evidenceObjects, [
      /\bextracellular\b/i,
      /\bsoluble\b/i,
      /\baggregate\b/i,
      /\bplaque\b/i,
      /\bspreading\b/i,
      /\binterception\b/i,
    ])
  );
  const hasProteostasisSignals = evidenceMentions(evidenceObjects, [
    /\bmitochond/i,
    /\bproteostasis\b/i,
    /\bautophagy\b/i,
    /\blysosom/i,
    /\baggregat/i,
    /\bneuroinflamm/i,
  ]);

  if (isNeuroBarrierCase) {
    addBucket(
      buckets,
      buildBucket(
        {
          label: hasGeneOrTranscriptSignals
            ? "bbb-shuttled oligo / gene-modulation delivery"
            : "bbb-shuttled non-cytotoxic delivery",
          whyPlausible:
            hasGeneOrTranscriptSignals
              ? "the grounded disease frame points to chronic cns biology where delivery is the bottleneck, so a shuttle-enabled oligo or gene-modulation lane is more plausible than free-warhead logic."
              : "the grounded disease frame points to a chronic cns case where transport is the gating problem, so a shuttle-enabled non-cytotoxic delivery lane is more plausible than classical warhead release.",
          entryHandleLogic:
            "this bucket needs a believable receptor-mediated transport route, brain-endothelial shuttle, or other uptake handle that can create productive cns exposure instead of only peripheral binding.",
          requiredAssumptions: uniqueStrings([
            "there is a believable brain-entry route or transport receptor to exploit",
            hasGeneOrTranscriptSignals
              ? "the disease mechanism can actually be shifted by an oligo or gene/rna payload once it reaches the relevant compartment"
              : "the disease mechanism can be shifted without relying on cytotoxic cell killing",
            input.target?.canonical ? undefined : "a specific target or entry handle can later be chosen without breaking the disease-level frame",
          ]),
          mainFailureMode:
            hasGeneOrTranscriptSignals
              ? "this lane collapses if the shuttle improves blood exposure but still does not deliver enough active oligo into the relevant cns cells or compartment."
              : "this lane collapses if the transport concept never produces useful cns exposure where the disease biology actually lives.",
          diseaseSpecificConstraints: [
            "bbb / barrier-limited exposure",
            "neurodegeneration / cns biology",
            "chronic dosing tolerability",
            "non-cytotoxic fit",
          ],
          supportingEvidenceIds: findEvidenceIds(
            evidenceObjects,
            (item) =>
              item.themes.some((theme) =>
                ["cns / bbb", "neurodegeneration", "transport-aware implications", "chronic non-oncology"].includes(theme),
              ) || item.mechanismHints.includes("gene modulation"),
          ),
          suggestedModalities: hasGeneOrTranscriptSignals
            ? ["oligo conjugate", "pdc", "adc"]
            : ["pdc", "adc", "smdc"],
        },
        abstraction,
      ),
    );

    if (
      hasExtracellularNeuroSignals ||
      abstraction.mechanismLocation === "extracellular" ||
      abstraction.targetClass === "soluble/extracellular factor"
    ) {
      addBucket(
        buckets,
        buildBucket(
          {
            label: "bbb-enhanced biologic / extracellular pathology interception",
            whyPlausible:
              "part of the biology may be reachable outside the cell, so a brain-penetrant biologic or extracellular-interception lane can be explored before committing to intracellular-only architectures.",
            entryHandleLogic:
              "this lane needs either a bbb-enhancing shuttle or a compact biologic format plus an extracellularly reachable target, aggregate, or spreading pathology species.",
            requiredAssumptions: uniqueStrings([
              "the important disease-driving species is extracellularly reachable long enough for the construct to matter",
              "brain exposure can be improved enough for a biologic or fragment-based format to engage the target",
            ]),
            mainFailureMode:
              "this lane weakens if the real driver is mostly intracellular or if the extracellular species is too indirect to change disease progression meaningfully.",
            diseaseSpecificConstraints: [
              "bbb / barrier-limited exposure",
              "extracellular accessibility",
              "neurodegeneration / cns biology",
            ],
            supportingEvidenceIds: findEvidenceIds(
              evidenceObjects,
              (item) =>
                item.themes.some((theme) =>
                  ["cns / bbb", "neurodegeneration", "extracellular", "transport-aware implications"].includes(theme),
                ),
            ),
            suggestedModalities: ["adc", "pdc"],
          },
          abstraction,
        ),
      );
    }

    addBucket(
      buckets,
      buildBucket(
        {
          label: "small-format pathway-modulating conjugates",
          whyPlausible:
            "the disease frame looks more like chronic pathway control than cell ablation, so a compact pathway-modulating conjugate is a plausible lane if there is a tractable entry handle.",
          entryHandleLogic:
            "this lane needs a compact target, receptor, or tissue-localizing handle that can bias exposure toward the disease-setting cells without depending on broad cytotoxic payload release.",
          requiredAssumptions: uniqueStrings([
            "the relevant disease driver can be shifted by pathway modulation rather than cell killing",
            "a compact entry handle exists that does not make the construct too large for the access problem",
            abstraction.deliveryAccessibility === "barrier-limited"
              ? "the chosen format can still preserve enough exposure across the barrier"
              : undefined,
          ]),
          mainFailureMode:
            "this lane fails if the entry handle is too weak or the construct becomes too large or too systemically exposed to create a useful therapeutic window.",
          diseaseSpecificConstraints: [
            "bbb / barrier-limited exposure",
            "non-cytotoxic fit",
            "chronic dosing tolerability",
          ],
          supportingEvidenceIds: findEvidenceIds(
            evidenceObjects,
            (item) =>
              item.mechanismHints.includes("pathway modulation") ||
              item.themes.some((theme) =>
                ["pathway modulation", "chronic non-oncology", "transport-aware implications"].includes(theme),
              ),
          ),
          suggestedModalities: ["smdc", "pdc", "oligo conjugate"],
        },
        abstraction,
      ),
    );

    if (hasProteostasisSignals) {
      addBucket(
        buckets,
        buildBucket(
          {
            label: "mitochondrial / proteostasis support conjugates",
            whyPlausible:
              "the evidence surface includes stress-response biology such as proteostasis, mitochondrial, lysosomal, or aggregate-control pressure, so a supportive targeted-conjugate lane is worth keeping conditional rather than treating every neuro case the same way.",
            entryHandleLogic:
              "this lane needs either a compact cell-entry route, organelle-biased motif, or tissue-localizing handle that can deliver a supportive payload into the stressed compartment without adding too much systemic burden.",
            requiredAssumptions: [
              "the stress-response biology is upstream enough to matter therapeutically and not only a downstream marker",
              "the construct can reach the relevant subcellular setting without overwhelming chronic tolerability",
            ],
            mainFailureMode:
              "this lane fails if the stress-response biology is mostly secondary and the conjugate never reaches the relevant compartment with enough activity to change disease progression.",
            diseaseSpecificConstraints: [
              "neurodegeneration / cns biology",
              "chronic dosing tolerability",
              "productive intracellular routing",
            ],
            supportingEvidenceIds: findEvidenceIds(
              evidenceObjects,
              (item) =>
                textIncludesAny(
                  [
                    item.label,
                    item.claim,
                    item.rationale,
                    ...item.themes,
                    ...item.mechanismHints,
                  ].join(" "),
                  [/\bmitochond/i, /\bproteostasis\b/i, /\bautophagy\b/i, /\blysosom/i, /\baggregat/i, /\bneuroinflamm/i],
                ),
            ),
            suggestedModalities: ["smdc", "pdc", "oligo conjugate"],
          },
          abstraction,
        ),
      );
    }

    if (abstraction.cytotoxicFit === "discouraged") {
      addBucket(
        buckets,
        buildBucket(
          {
            label: "classical cytotoxic conjugates are a weak-fit comparator",
            whyPlausible:
              "it is still useful to state this lane explicitly because the disease frame is chronic, non-oncologic, and neurodegenerative, which makes classical cell-killing payload logic a generally weak default fit unless the hypothesis changes to selective cell ablation.",
            entryHandleLogic:
              "this lane would only become viable if the biology actually shifted toward a harmful cell population that should be ablated and there were a selective entry handle to do that safely.",
            requiredAssumptions: [
              "the real therapeutic intent has changed from protection or modulation to selective ablation",
              "a target exists that can support cytotoxic delivery without worsening vulnerable tissue loss",
            ],
            mainFailureMode:
              "this lane is usually the wrong fit because the same payload logic that works in oncology can worsen chronic neurodegeneration if it is applied without a true cell-ablation rationale.",
            diseaseSpecificConstraints: [
              "non-cytotoxic fit",
              "neurodegeneration / cns biology",
              "chronic dosing tolerability",
            ],
            supportingEvidenceIds: findEvidenceIds(
              evidenceObjects,
              (item) =>
                item.themes.some((theme) =>
                  ["neurodegeneration", "chronic non-oncology", "non-cytotoxic fit"].includes(theme),
                ),
            ),
            suggestedModalities: ["adc", "rdc", "smdc"],
          },
          abstraction,
        ),
      );
    }
  }

  if (!isNeuroBarrierCase && (
    abstraction.pathologyType === "neurodegeneration" ||
    abstraction.deliveryAccessibility === "barrier-limited" ||
    abstraction.deliveryBarriers.some((item) => /bbb|blood-brain|cns/i.test(item))
  )) {
    addBucket(buckets, buildBucket({
      label: "transport-aware non-cytotoxic targeting",
      whyPlausible:
        "the grounded biology points to a barrier-limited chronic disease context, so transport-aware delivery and non-cytotoxic mechanism logic are more plausible than classical free-warhead release.",
      entryHandleLogic:
        "this bucket only becomes real if there is a believable receptor-mediated transport route, shuttle handle, or uptake mechanism that can move the construct into the relevant cns compartment.",
      requiredAssumptions: uniqueStrings([
        "there is a believable brain-entry route or uptake handle",
        "the therapeutic mechanism is non-cytotoxic and compatible with chronic dosing",
        input.target?.canonical ? undefined : "a target or entry handle can be specified later without breaking the disease-level frame",
      ]),
      mainFailureMode:
        "this bucket falls apart if there is no workable transport route across the barrier or if the chosen target cannot support useful exposure where the biology lives.",
      diseaseSpecificConstraints: [
        "bbb / barrier-limited exposure",
        "chronic dosing tolerability",
        "non-cytotoxic fit",
      ],
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.themes.some((theme) =>
            ["cns / bbb", "neurodegeneration", "transport-aware implications", "chronic non-oncology"].includes(theme),
          ),
      ),
      suggestedModalities: ["oligo conjugate", "smdc", "pdc"],
    }, abstraction));
  }

  if (
    !isNeuroBarrierCase &&
    (
      abstraction.therapeuticIntent === "pathway modulation" ||
      mechanismInference.mechanismClass === "pathway modulation" ||
      (
        abstraction.treatmentContext === "chronic" &&
        abstraction.cytotoxicFit === "discouraged" &&
        abstraction.pathologyType !== "oncology"
      )
    )
  ) {
    addBucket(buckets, buildBucket({
      label: "non-cytotoxic pathway-matched targeting",
      whyPlausible:
        "the disease frame looks more like chronic pathway control than kill-and-release payload logic, so a non-cytotoxic targeted architecture is a more plausible starting bucket.",
      entryHandleLogic:
        "this bucket needs a target, receptor, or tissue-localizing handle that can bias exposure toward the relevant pathway-setting cells without relying on classical cell-killing payload logic.",
      requiredAssumptions: uniqueStrings([
        "the relevant biology can be shifted by pathway modulation rather than cell killing",
        input.target?.canonical ? undefined : "a target or entry handle can later be chosen without breaking the non-cytotoxic strategy",
        abstraction.deliveryAccessibility === "barrier-limited"
          ? "the delivery format can still reach the relevant tissue despite the barrier"
          : undefined,
      ]),
      mainFailureMode:
        "this bucket weakens if the actual disease driver cannot be moved enough by pathway-level intervention or if there is no tractable way to localize the construct to the right cells or tissue.",
      diseaseSpecificConstraints: [
        abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : "",
        abstraction.cytotoxicFit === "discouraged" ? "non-cytotoxic fit" : "",
        abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.mechanismHints.includes("pathway modulation") ||
          item.themes.some((theme) =>
            ["pathway modulation", "chronic non-oncology", "non-cytotoxic fit", "transport-aware implications"].includes(theme),
          ),
      ),
      suggestedModalities: ["pdc", "smdc", "oligo conjugate"],
    }, abstraction));
  }

  if (
    !isNeuroBarrierCase &&
    (
      abstraction.therapeuticIntent === "gene/rna modulation" ||
      abstraction.compartmentNeed === "nuclear" ||
      abstraction.compartmentNeed === "cytosolic" ||
      abstraction.mechanismLocation === "intracellular"
    )
  ) {
    addBucket(buckets, buildBucket({
      label: "intracellular gene / pathway modulation delivery",
      whyPlausible:
        "the current biological state points toward an active species that has to work inside the cell, so productive trafficking matters more than classical extracellular payload release.",
      entryHandleLogic:
        abstraction.compartmentNeed === "nuclear"
          ? "this bucket needs an entry handle and trafficking route that can deliver the active construct far enough to support nuclear biology, not only surface binding or bulk uptake."
          : "this bucket needs an uptake handle and intracellular routing path that create productive delivery where the active species actually has to work.",
      requiredAssumptions: uniqueStrings([
        abstraction.compartmentNeed === "nuclear"
          ? "the construct can reach the nucleus with enough productive delivery"
          : "the construct can achieve productive intracellular delivery",
        "the mechanism really is sequence- or pathway-directed rather than simple extracellular occupancy",
        input.target?.canonical ? undefined : "a compatible entry handle or uptake route can be identified",
      ]),
      mainFailureMode:
        "this bucket fails if uptake looks good on paper but productive intracellular routing is too weak to create real biology at the relevant compartment.",
      diseaseSpecificConstraints: [
        abstraction.compartmentNeed === "nuclear" ? "nuclear access" : "productive intracellular routing",
        abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : "",
        abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.mechanismHints.includes("gene modulation") ||
          item.themes.some((theme) =>
            ["gene modulation", "pathway modulation", "productive trafficking", "intracellular delivery"].includes(theme),
          ),
      ),
      suggestedModalities: ["oligo conjugate", "pdc", "smdc"],
    }, abstraction));
  }

  if (
    !isNeuroBarrierCase &&
    (
      abstraction.targetClass === "soluble/extracellular factor" ||
      abstraction.compartmentNeed === "extracellular" ||
      abstraction.mechanismLocation === "extracellular"
    )
  ) {
    addBucket(buckets, buildBucket({
      label: "extracellular neutralization / localization",
      whyPlausible:
        "the wording and abstraction state both point to biology that can be addressed outside the cell, so extracellular engagement can be explored before committing to intracellular-delivery architectures.",
      entryHandleLogic:
        "this bucket only makes sense if the biologically important target or deposited material is extracellularly reachable without needing productive intracellular release.",
      requiredAssumptions: uniqueStrings([
        "the key biology really is extracellular and accessible to the conjugate format",
        "payload logic does not require productive intracellular release",
      ]),
      mainFailureMode:
        "this bucket weakens quickly if the true driver turns out to be intracellular pathway control rather than extracellular occupancy or localization.",
      diseaseSpecificConstraints: [
        "extracellular accessibility",
        abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.themes.some((theme) =>
            ["extracellular", "soluble factor", "amyloid plaque clearance", "transport-aware implications"].includes(theme),
          ),
      ),
      suggestedModalities: ["adc", "pdc", "smdc", "rdc"],
    }, abstraction));
  }

  if (
    abstraction.pathologyType === "autoimmune/inflammatory" ||
    abstraction.therapeuticIntent === "immune modulation" ||
    (
      input.diseaseArea === "autoimmune" &&
      abstraction.treatmentContext === "chronic" &&
      abstraction.cytotoxicFit === "discouraged"
    )
  ) {
    addBucket(buckets, buildBucket({
      label: "non-cytotoxic immune-targeted modulation",
      whyPlausible:
        "the current biology reads like chronic inflammatory control rather than cytotoxic elimination, so the useful strategy space is immune-modulatory targeting rather than warhead-first delivery.",
      entryHandleLogic:
        "this bucket needs a selective immune-cell, stromal, or soluble-factor handle that can bias modulation toward the disease-driving compartment instead of broad systemic exposure.",
      requiredAssumptions: uniqueStrings([
        "the disease can be improved by modulating immune signaling or cell-state biology instead of killing tissue broadly",
        input.target?.canonical ? undefined : "a target, cell subset, or delivery handle can be identified later for selective modulation",
      ]),
      mainFailureMode:
        "this bucket fails if the eventual target does not create enough selectivity or if the construct cannot shift immune biology without creating broader systemic toxicity.",
      diseaseSpecificConstraints: [
        "immune-inflammatory selectivity",
        abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : "",
        abstraction.cytotoxicFit === "discouraged" ? "non-cytotoxic fit" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.mechanismHints.includes("immune modulation") ||
          item.themes.some((theme) =>
            ["immune modulation", "autoimmune/inflammatory", "chronic non-oncology", "non-oncology"].includes(theme),
          ),
      ),
      suggestedModalities: ["pdc", "smdc", "adc"],
    }, abstraction));
  }

  if (abstraction.pathologyType === "oncology" && abstraction.cytotoxicFit !== "discouraged") {
    addBucket(buckets, buildBucket({
      label: "targeted cytotoxic delivery",
      whyPlausible:
        "the disease context still supports a targeted-cytotoxic hypothesis if a real accessible target and payload logic can be justified.",
      entryHandleLogic:
        "this bucket needs a selective tumor-associated target or ligand handle with enough accessibility and, when relevant, internalization to justify released-payload logic.",
      requiredAssumptions: uniqueStrings([
        "there is a selective and usable tumor-associated target",
        abstraction.internalizationRequirement === "required"
          ? "the target can support productive internalization"
          : undefined,
        "the therapeutic window can tolerate cytotoxic payload logic",
      ]),
      mainFailureMode:
        "this bucket drops away if selectivity, internalization, or safety window logic does not hold once the target is made explicit.",
      diseaseSpecificConstraints: [
        "tumor selectivity and target window",
        abstraction.internalizationRequirement === "required" ? "productive internalization" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.mechanismHints.includes("cytotoxic delivery") ||
          item.themes.some((theme) => ["oncology", "cell-surface targeting", "internalization"].includes(theme)),
      ),
      suggestedModalities: ["adc", "pdc", "smdc"],
    }, abstraction));
  }

  if (abstraction.therapeuticIntent === "localized radiobiology") {
    addBucket(buckets, buildBucket({
      label: "radioligand localization",
      whyPlausible:
        "the active payload logic here is localization plus isotope effect, not classical free-drug release.",
      entryHandleLogic:
        "this bucket needs a target-retention handle or ligand that can localize isotope exposure where dosimetry can actually do the therapeutic work.",
      requiredAssumptions: [
        "the biology benefits from localization and dosimetry rather than pathway modulation alone",
        "a suitable ligand or target handle exists for isotope delivery",
      ],
      mainFailureMode:
        "this bucket fails if isotope localization is not actually aligned with the disease mechanism or tissue-access problem.",
      diseaseSpecificConstraints: [
        abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : "",
        "localization and dosimetry fit",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) => item.mechanismHints.includes("radiobiology"),
      ),
      suggestedModalities: ["rdc"],
    }, abstraction));
  }

  if (abstraction.therapeuticIntent === "enzyme/prodrug activation") {
    addBucket(buckets, buildBucket({
      label: "local activation / enzyme-prodrug logic",
      whyPlausible:
        "the biology suggests selectivity may come from local activation chemistry rather than the carrier alone.",
      entryHandleLogic:
        "this bucket needs a way to localize the catalytic or prodrug-activation step to the relevant tissue, microenvironment, or cell compartment.",
      requiredAssumptions: [
        "the activation step survives conjugation",
        "local activation is strong enough to beat background activity",
      ],
      mainFailureMode:
        "this bucket fails if catalytic competence or local activation selectivity does not survive real biological conditions.",
      diseaseSpecificConstraints: [
        "local activation selectivity",
        abstraction.treatmentContext === "chronic" ? "repeat-dosing tolerability" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) => item.mechanismHints.includes("enzyme/prodrug"),
      ),
      suggestedModalities: ["enzyme conjugate"],
    }, abstraction));
  }

  return buckets.slice(0, 4);
}

function buildDominantConstraints(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
): string[] {
  return uniqueStrings([
    ...abstraction.deliveryBarriers,
    abstraction.deliveryAccessibility !== "unknown"
      ? `delivery accessibility: ${abstraction.deliveryAccessibility}`
      : undefined,
    abstraction.compartmentNeed !== "unknown"
      ? `active biology location: ${abstraction.compartmentNeed}`
      : undefined,
    abstraction.treatmentContext !== "unknown"
      ? `treatment context: ${abstraction.treatmentContext}`
      : undefined,
    abstraction.cytotoxicFit !== "unknown"
      ? `cytotoxic fit: ${abstraction.cytotoxicFit}`
      : undefined,
    !input.target?.canonical ? "target or entry handle is still unresolved" : undefined,
  ]).slice(0, 6);
}

function buildMostInformativeClarifier(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
): string {
  if (!input.target?.canonical && abstraction.deliveryAccessibility === "barrier-limited") {
    return "what brain-entry route or transport handle do you actually want to leverage?";
  }

  if (!input.target?.canonical && abstraction.mechanismLocation === "intracellular") {
    return "what target or uptake handle do you want to use for productive intracellular delivery?";
  }

  if (!input.target?.canonical && abstraction.mechanismLocation === "extracellular") {
    return "is the real plan extracellular occupancy/localization, or do you actually need intracellular pathway control?";
  }

  if (abstraction.therapeuticIntent === "unknown") {
    return "what therapeutic mechanism matters most here: pathway modulation, gene/rna modulation, cytotoxic delivery, radioligand localization, or local activation?";
  }

  return "what single target or entry handle would collapse the most uncertainty in this case?";
}

export function buildDiseaseExploration(
  input: NormalizedCase,
  context: {
    abstraction: BiologicalAbstraction;
    mechanismInference: MechanismInference;
    evidenceObjects: EvidenceObject[];
  },
): DiseaseExploration | null {
  if (input.recommendationScope !== "disease-level") {
    return null;
  }

  const { abstraction, mechanismInference, evidenceObjects } = context;
  const strategyBuckets = buildStrategyBuckets(input, abstraction, mechanismInference, evidenceObjects);

  if (!strategyBuckets.length && abstraction.source === "fallback") {
    return null;
  }

  const source =
    strategyBuckets.some((bucket) => bucket.supportingEvidenceIds.length > 0) || abstraction.source === "evidence-driven"
      ? "evidence-driven"
      : abstraction.source === "normalized-context"
        ? "normalized-context"
        : "fallback";

  return {
    diseaseFrame: buildDiseaseFrame(input, abstraction, mechanismInference),
    strategyBuckets,
    dominantConstraints: buildDominantConstraints(input, abstraction),
    mostInformativeClarifier: buildMostInformativeClarifier(input, abstraction),
    source,
  };
}
