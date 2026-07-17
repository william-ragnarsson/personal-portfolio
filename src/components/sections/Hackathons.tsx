import Reveal from "@/components/Reveal";
import MapJourney from "@/components/MapJourney";
import { mapData } from "@/lib/hackathonMap";

export default function Hackathons() {
  return (
    <section>
      <div className="mx-auto max-w-[820px] px-6 py-24 sm:py-32">
        <Reveal>
          <p className="kicker text-accent-2">02 — Hackathons</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="display mt-5 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.05]">
            Looooove doing{" "}
            <span className="text-accent-2">hackathons</span>!!!
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Don&apos;t care where, just with whom :)
          </p>
        </Reveal>
      </div>

      <MapJourney data={mapData} />
    </section>
  );
}
