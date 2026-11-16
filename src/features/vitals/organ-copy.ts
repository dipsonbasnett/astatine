export type OrganId = "heart" | "lungs" | "brain";

export const ORGAN_ORDER: readonly OrganId[] = ["heart", "lungs", "brain"];

export const ORGAN_LABELS: Record<OrganId, string> = {
  heart: "Heart",
  lungs: "Lungs",
  brain: "Brain",
};

export const ORGAN_DESCRIPTIONS: Record<OrganId, string> = {
  heart:
    "Procedural heart illustration. Contraction and relaxation are timed to a simulated heart rate; this is not an ECG and not an assessment of cardiac function.",
  lungs:
    "Procedural lung illustration. Inhalation and exhalation are timed to a simulated respiratory rate; this is not spirometry or a breathing assessment.",
  brain:
    "Procedural brain illustration with abstract node activity. It is not a reading of thought, brain activity, or neurological status.",
};

export const ORGAN_ACCESSIBLE_LABELS: Record<OrganId, string> = {
  heart: "Procedural heart illustration, animated in time with a simulated heart rate",
  lungs:
    "Procedural lung illustration, animated in time with a simulated respiratory rate",
  brain: "Procedural brain illustration with abstract simulated node activity",
};
