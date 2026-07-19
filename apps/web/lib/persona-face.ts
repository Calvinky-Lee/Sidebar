// Derives a persona's facial details (eyebrows + one distinguishing accessory)
// from their actual written personality — archetype, decision style, biases,
// core values — via a deterministic hash, rather than picking randomly or
// leaving every blob with an identical face. Same persona text always yields
// the same face (stable across reconnects/replays); different personas are
// very likely to land on different combinations.

export interface PersonaTraits {
  archetype: string;
  decisionStyle: string;
  biases: string[];
  coreValues: string[];
}

export type Eyebrows = "none" | "flat" | "angled" | "raised" | "furrowed";
export type Accessory = "none" | "glasses" | "mustache" | "bow" | "star" | "monocle";

const EYEBROWS: Eyebrows[] = ["none", "flat", "angled", "raised", "furrowed"];
const ACCESSORIES: Accessory[] = ["none", "glasses", "mustache", "bow", "star", "monocle"];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function personaFace(traits: PersonaTraits): { eyebrows: Eyebrows; accessory: Accessory } {
  const seed = [
    traits.archetype,
    traits.decisionStyle,
    traits.biases.join(" "),
    traits.coreValues.join(" "),
  ].join(" | ");

  return {
    eyebrows: EYEBROWS[hashString(seed) % EYEBROWS.length],
    accessory: ACCESSORIES[hashString(`${seed}#accessory`) % ACCESSORIES.length],
  };
}
