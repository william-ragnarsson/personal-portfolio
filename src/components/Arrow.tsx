// Arrows drawn rather than typed: the font's Latin subset has no ↗ or →, and a
// fallback font's arrow never matches the weight of the words around it.

const PATHS = {
  "up-right": "M4 12 12 4M5.5 4H12v6.5",
  right: "M2.5 8h11M9 3.5 13.5 8 9 12.5",
  down: "M8 2.5v11M3.5 9 8 13.5 12.5 9",
} as const;

export default function Arrow({ dir = "up-right", className }: { dir?: keyof typeof PATHS; className?: string }) {
  return (
    <svg
      className={className ? `arrow ${className}` : "arrow"}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[dir]} />
    </svg>
  );
}
