import Image from "next/image";
import Reveal from "@/components/Reveal";

/**
 * Three Tunebox pitch photos, as a contact sheet directly under the trailer —
 * hence the tight top margin: the two read as one media block, not as a second
 * gallery competing with the video.
 *
 * They're 3:2 because the sources are: every one is 1620x1080, and two of the
 * three are wide scenes (a stand, a full auditorium) whose subject *is* their
 * width. Squaring them cropped a third off and gutted exactly what they were
 * there to show.
 */
export default function TuneboxGallery() {
  return (
    <Reveal delay={0.1} className="mt-3">
      <div className="grid grid-cols-3 gap-3">
        <Tile
          src="/images/tunebox/stage.jpg"
          alt="The Tunebox stand at VLAJO NextGen Fest '24"
          sizes="(min-width: 820px) 260px, 33vw"
        />
        <Tile
          src="/images/tunebox/pitch.jpg"
          alt="Delivering the Tunebox pitch to the audience"
          sizes="(min-width: 820px) 260px, 33vw"
        />
        <Tile
          src="/images/tunebox/crowd.jpg"
          alt="The full auditorium watching the Tunebox pitch"
          sizes="(min-width: 820px) 260px, 33vw"
        />
      </div>

      {/* Stands on its own: these photos are a different event from the trailer,
          and the paragraph naming that one comes after this. */}
      <p className="kicker mt-4 text-center text-muted">
        Pitch day at VLAJO NextGen Fest &rsquo;24 — finalist
      </p>
    </Reveal>
  );
}

function Tile({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  return (
    <div className="group relative aspect-[3/2] overflow-hidden rounded-xl border border-border">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
}
