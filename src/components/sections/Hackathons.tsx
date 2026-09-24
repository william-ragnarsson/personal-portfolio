import type { CSSProperties } from "react";
import Arrow from "@/components/Arrow";
import StretchName from "@/components/StretchName";
import TrackedLink, { external } from "@/components/TrackedLink";
import HackathonStage from "@/components/globe/HackathonStage";
import StillGlobe from "@/components/globe/StillGlobe";
import s from "@/components/globe/Stage.module.css";
import { hackathons, type Hackathon } from "@/data/content";

const where = (h: Hackathon) => (h.city === h.country ? h.city : `${h.city}, ${h.country}`);

const places = [...new Set(hackathons.map((h) => h.city))];
const GLOBE_LABEL = `A globe with the route between the hackathons: ${places.join(", ")}.`;

function Heading({ className }: { className?: string }) {
  return (
    <h2 className={className ? `hd ${className}` : "hd"}>
      7 hackathons, <span className="hl">3 awards</span>!!!
    </h2>
  );
}

const LEAD = "Don’t care where, just with whom :)";

function StopLink({ h }: { h: Hackathon }) {
  const properties = { hackathon_event: h.event, hackathon_city: h.city, project_name: h.project };
  return (
    <div className="links">
      {h.repo ? (
        <TrackedLink
          href={h.repo}
          {...external}
          className="link"
          data-primary
          event="hackathon_repo_clicked"
          properties={properties}
          aria-label={`${h.project} on GitHub`}
        >
          GitHub
          <Arrow />
        </TrackedLink>
      ) : null}
      {h.link ? (
        <TrackedLink
          href={h.link}
          {...external}
          className="link"
          data-primary
          event="hackathon_link_clicked"
          properties={properties}
        >
          {h.linkLabel ?? "View project"}
          <Arrow />
        </TrackedLink>
      ) : null}
    </div>
  );
}

function Project({ h }: { h: Hackathon }) {
  return (
    <p className={s.prj}>
      <span>{h.project}</span>
      {h.award ? <span className={s.aw}>{h.award}</span> : null}
    </p>
  );
}

/**
 * Five stops on one globe. With a mouse and room for it, the page folds into
 * the globe and the camera flies stop to stop as you scroll (HackathonStage).
 * Otherwise it's one drawn globe and the stops as a list.
 */
export default function Hackathons() {
  return (
    <section id="hackathons" className={`tone-light ${s.section}`} data-tone="light">
      <HackathonStage className={s.track}>
        <div className={s.stage} data-stage>
          <canvas className={s.canvas} data-canvas aria-hidden />
          <div className={s.col} data-col data-fold>
            <Heading className={s.stageHd} />
            <p className={s.lead}>{LEAD}</p>
            <ol className={s.cards}>
              {hackathons.map((h) => (
                <li key={h.event} className={s.card} data-card>
                  <p className={s.where}>{where(h)}</p>
                  <h3 className={s.ev}>{h.event}</h3>
                  <Project h={h} />
                  <p className={s.blurb}>{h.blurb}</p>
                  <StopLink h={h} />
                </li>
              ))}
            </ol>
          </div>
          <div className={s.prog} data-prog data-fold>
            <div className={s.ticks} style={{ "--n": hackathons.length } as CSSProperties} aria-hidden>
              {hackathons.map((h) => (
                <span key={h.event} className={s.tick}>
                  <b data-tick />
                </span>
              ))}
            </div>
            <button type="button" className={s.skip} data-skip>
              Skip
              <Arrow dir="down" />
            </button>
          </div>
        </div>
      </HackathonStage>

      <div className={`box ${s.still}`}>
        <Heading />
        <p className={`copy ${s.stillLead}`}>{LEAD}</p>
        <div className={s.stillBody}>
          <StillGlobe route="hackathons" label={GLOBE_LABEL} className={s.stillGlobe} />
          <ol className={s.list}>
            {hackathons.map((h) => (
              <li key={h.event} className={s.item}>
                <h3 className={s.city}>
                  <StretchName className={s.stretch}>{h.city}</StretchName>
                </h3>
                <p className={s.ev}>{h.event}</p>
                <Project h={h} />
                <p className={s.blurb}>{h.blurb}</p>
                <StopLink h={h} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
