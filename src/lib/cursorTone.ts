// What's under the custom cursor, so it can take a colour that shows up there.
//
// Normally that's the tone of the section under the pointer (`data-tone`).
// A canvas can paint a different colour than its section, though, like the
// hackathon stage while the blue page folds into the globe, so canvases can
// register a probe that answers for a point first.

export type Tone = "blue" | "light" | "yellow";

type Probe = (clientX: number, clientY: number) => Tone | null;

const probes = new Set<Probe>();

export function addToneProbe(probe: Probe) {
  probes.add(probe);
  return () => {
    probes.delete(probe);
  };
}

export function probeTone(x: number, y: number): Tone | null {
  for (const probe of probes) {
    const tone = probe(x, y);
    if (tone) return tone;
  }
  return null;
}
