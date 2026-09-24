import Image from "next/image";
import Trailer from "@/components/Trailer";
import s from "./Tunebox.module.css";

const PHOTOS = [
  { src: "/images/tunebox/stage.jpg", alt: "The Tunebox stand at VLAJO NextGen Fest '24" },
  { src: "/images/tunebox/pitch.jpg", alt: "Delivering the Tunebox pitch to the audience" },
  { src: "/images/tunebox/crowd.jpg", alt: "The full auditorium watching the Tunebox pitch" },
];

export default function Tunebox() {
  return (
    <section id="tunebox" className="box tone-yellow sheet story" data-tone="yellow">
      <h2 className="hd">
        Did my own <span className="hl">startup</span> in my first year of university.
      </h2>

      <Trailer />

      <figure>
        <div className={s.photos}>
          {PHOTOS.map((p, i) => (
            <div key={p.src} className={`media ${s.photo}`}>
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes={i === 0 ? "(width < 48rem) 100vw, 300px" : "(width < 48rem) 50vw, 300px"}
              />
            </div>
          ))}
        </div>
        <figcaption className={s.caption}>Pitch day at VLAJO NextGen Fest - finalist</figcaption>
      </figure>

      <p className="copy">
        <b>Tunebox</b>, a hardware startup: a more creative, hands-on project than anything I’d done before, and the
        thing that first lit the <b>drive to build startups</b>.
      </p>
      <p className="copy">
        We entered the startup competition Start Academy and placed <b>2nd out of 120 startups</b>
      </p>
      <p className="copy">
        I’ve since moved on from the hardware, (luckily) but not the itch. Ever since, my focus has been{" "}
        <b>100% startups</b>.
      </p>
    </section>
  );
}
