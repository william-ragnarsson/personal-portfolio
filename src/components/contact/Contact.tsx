import Arrow from "@/components/Arrow";
import { site } from "@/data/site";
import { external } from "@/lib/links";
import Composer from "./Composer";
import s from "./Contact.module.css";

/** The yellow the NYC flight dives into: a composer you can type into straight away. */
export default function Contact() {
  return (
    <section id="contact" className={`box tone-yellow ${s.contact}`} data-tone="yellow">
      <h2 className={`hd ${s.big}`}>
        Let’s <span className="hl">Talk!</span>
      </h2>
      <p className={`copy ${s.lead}`}>
        Send me a message below, or find me on{" "}
        <a href={site.linkedin} {...external} className="link" data-primary>
          LinkedIn
          <Arrow />
        </a>{" "}
        and{" "}
        <a href={site.x} {...external} className="link" data-primary>
          X
          <Arrow />
        </a>
      </p>

      <Composer />

      {/* The composer's errors point here: "email me directly below". */}
      <div className="links">
        <a href={`mailto:${site.email}`} className="link">
          or email me directly
        </a>
      </div>
    </section>
  );
}
