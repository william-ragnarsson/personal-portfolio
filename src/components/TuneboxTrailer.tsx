import Reveal from "@/components/Reveal";

/**
 * The Tunebox trailer — a full-width 16:9 embed. Filmed and cut overnight for
 * the Start Academy final. Leads the section, within its standard 820px measure.
 */
export default function TuneboxTrailer() {
  return (
    <Reveal delay={0.05} className="mt-10">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
        <iframe
          src="https://www.youtube-nocookie.com/embed/JGS_X_n-Gvs?rel=0"
          title="Tunebox trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </Reveal>
  );
}
