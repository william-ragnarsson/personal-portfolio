import Section, { Prose } from "@/components/ui/Section";
import MapJourney from "@/components/MapJourney";
import { mapData } from "@/lib/hackathonMap";

export default function Hackathons() {
  return (
    <Section
      kicker="02 — Hackathons"
      accent="coral"
      title={
        <>
          Looooove doing <span className="text-accent-2">hackathons</span>!!!
        </>
      }
      bleed={<MapJourney data={mapData} />}
    >
      <Prose delay={0.1} className="mt-6 max-w-xl">
        Don&apos;t care where, just with whom :)
      </Prose>
    </Section>
  );
}
