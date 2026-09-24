import type { ReactNode } from "react";
import NycStage from "@/components/globe/NycStage";
import StillGlobe from "@/components/globe/StillGlobe";
import s from "@/components/globe/Stage.module.css";

function Heading({ className }: { className?: string }) {
  return (
    <h2 className={className ? `hd ${className}` : "hd"}>
      The move to <span className="hl">NYC</span>
    </h2>
  );
}

const PARAGRAPHS: ReactNode[] = [
  <>
    <b>I’m moving to New York City to go all in on startups.</b> I just finished my Bachelor’s in Computer Science,
    and I have decided I want to continue my learning in a different way.
  </>,
  <>
    From the moment I learned what a startup even was, I haven’t been able to look away. There’s a{" "}
    <b>switch in my brain I can’t turn off</b>, that get's me excited when I find a new idea I can work on, or build something that someone mentions has been annoying them.
  </>,
  <>
    {" "}<b>So why move to NYC?</b> The startup scene in Belgium is growing, but it just doesn’t compare to what’s available here. People here work
    harder, move faster, and have a completely different mindset: one I resonate with much more. I wanted to learn from more experienced people here, so that’s what I’m doing.
  </>,
  <>
    I want to join a <b>growing team with a LOT of ambition</b>. Almost everything I know, I learned by building. So
    that’s what I want to keep doing: <b>build a lot, build fast, and build big.</b>
  </>,
];

/**
 * A flight from Belgium, where the hackathons ended, to New York. On the 3D
 * stage the camera then dives into the land until its yellow is all there is,
 * and that yellow is the contact page below.
 */
export default function Nyc() {
  return (
    <section id="nyc" className={`tone-light ${s.section} ${s.nyc}`} data-tone="light">
      <NycStage className={s.track}>
        <div className={s.stage} data-stage>
          <canvas className={s.canvas} data-canvas aria-hidden />
          <div className={s.col} data-col data-fade>
            <Heading className={s.stageHd} />
            {PARAGRAPHS.map((p, i) => (
              <p key={i} className={s.p}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </NycStage>

      <div className={`box ${s.still}`}>
        <div className={s.stillBody}>
          <div>
            <Heading />
            {PARAGRAPHS.map((p, i) => (
              <p key={i} className="copy">
                {p}
              </p>
            ))}
          </div>
          <StillGlobe route="nyc" label="A globe with the route from Belgium to New York." className={s.stillGlobe} />
        </div>
      </div>
    </section>
  );
}
