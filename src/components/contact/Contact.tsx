import Arrow from "@/components/Arrow";
import TrackedLink, { external } from "@/components/TrackedLink";
import { site } from "@/data/site";
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
        <TrackedLink
          href={site.linkedin}
          {...external}
          className="link"
          data-primary
          event="contact_link_clicked"
          properties={{ link_type: "linkedin" }}
        >
          LinkedIn
          <Arrow />
        </TrackedLink>{" "}
        and{" "}
        <TrackedLink
          href={site.x}
          {...external}
          className="link"
          data-primary
          event="contact_link_clicked"
          properties={{ link_type: "x" }}
        >
          X
          <Arrow />
        </TrackedLink>
      </p>

      <Composer />

      {/* The composer's errors point here: "email me directly below". */}
      <div className="links">
        <TrackedLink
          href={`mailto:${site.email}`}
          className="link"
          event="contact_link_clicked"
          properties={{ link_type: "email" }}
        >
          or email me directly
        </TrackedLink>
      </div>
    </section>
  );
}
