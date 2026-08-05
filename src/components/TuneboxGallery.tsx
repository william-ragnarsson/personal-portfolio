import Image from "next/image";
import Reveal from "@/components/Reveal";

/**
 * Editorial collage of the three Tunebox pitch photos (VLAJO NextGen Fest '24).
 * Big stage shot dominant; the mic close-up and crowd shot stack beside it.
 * Sized to sit within the section's 820px text measure.
 */
export default function TuneboxGallery() {
  return (
    <Reveal delay={0.05} className="mt-12">
      <div className="grid grid-cols-1 gap-3 sm:aspect-[3/2] sm:grid-cols-3 sm:grid-rows-2">
        <Tile
          src="/images/tunebox/stage.jpg"
          alt="Pitching Tunebox on stage at VLAJO NextGen Fest '24"
          mobileAspect="aspect-[4/3]"
          className="sm:col-span-2 sm:row-span-2"
          sizes="(min-width: 640px) 540px, 100vw"
        />
        <Tile
          src="/images/tunebox/pitch.jpg"
          alt="Delivering the Tunebox pitch to the audience"
          mobileAspect="aspect-[3/4]"
          sizes="(min-width: 640px) 270px, 100vw"
        />
        <Tile
          src="/images/tunebox/crowd.jpg"
          alt="The full auditorium watching the Tunebox pitch"
          mobileAspect="aspect-[4/3]"
          sizes="(min-width: 640px) 270px, 100vw"
        />
      </div>

      <p className="kicker mt-4 text-muted">
        Tunebox — VLAJO NextGen Fest &rsquo;24 finalist
      </p>
    </Reveal>
  );
}

function Tile({
  src,
  alt,
  mobileAspect,
  className = "",
  sizes,
}: {
  src: string;
  alt: string;
  mobileAspect: string;
  className?: string;
  sizes: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border ${mobileAspect} sm:aspect-auto ${className}`}
    >
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
