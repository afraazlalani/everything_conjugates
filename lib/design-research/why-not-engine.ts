import { WhyNotResult, ModalityScore } from "./types";

export function buildWhyNotResults(scores: ModalityScore[]): WhyNotResult[] {
  const winner = scores[0];
  if (!winner) return [];

  return scores.slice(1).map((score, index) => {
    const weakest = score.components.slice().sort((a, b) => a.weighted - b.weighted)[0];
    return {
      modality: score.modality,
      outcome:
        score.gate.status === "gated out"
          ? "not viable"
          : index === 0
            ? "runner-up"
            : score.gate.status === "penalized"
              ? "not viable"
              : "viable but weaker",
      primaryReason: score.gate.status !== "allowed" ? score.gate.reasons[0] : weakest?.rationale ?? "it had a weaker total evidence fit than the winner.",
      secondaryReason: weakest && weakest.rationale !== score.gate.reasons[0] ? weakest.rationale : undefined,
    };
  });
}

