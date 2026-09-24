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

      <Composer />

      <div className="links">
        <TrackedLink
          href={site.linkedin}
          {...external}
          className="link"
          event="contact_link_clicked"
          properties={{ link_type: "linkedin" }}
        >
          LinkedIn
          <Arrow />
        </TrackedLink>
        <TrackedLink
          href={site.x}
          {...external}
          className="link"
          event="contact_link_clicked"
          properties={{ link_type: "x" }}
        >
          X
          <Arrow />
        </TrackedLink>
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
