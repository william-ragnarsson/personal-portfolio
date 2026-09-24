import AppPreview from "@/components/AppPreview";
import Arrow from "@/components/Arrow";
import { site } from "@/data/site";
import { external } from "@/lib/links";
import s from "./PlugAndPlay.module.css";

const PIPELINE = [
  "Deck ingestion",
  "structured extraction",
  "a logistic-regression classifier trained on the 900+ labeled evaluations",
  "automated due diligence",
  "drafted investment memo.",
];

export default function PlugAndPlay() {
  return (
    <section id="plug-and-play" className="box tone-blue sheet" data-tone="blue">
      <h2 className="hd">
        Trained an <span className="hl">AI VC analyst</span> on a proprietary dataset of 900+ pitch decks
      </h2>

      <AppPreview src={site.vcDemo} title="the VC analyst" />

      <div className="links">
        <a href={site.vcDemo} {...external} className="link" data-primary>
          Try it out yourself
          <Arrow />
        </a>
        <a href={site.vcRepo} {...external} className="link">
          Source
          <Arrow />
        </a>
      </div>

      <p className="copy">
        During my time at Plug and Play I ran first-pass review on <b>900+ pitch decks</b>, I reviewed each one and
        kept these verdicts in a structured spreadsheet. This process was very repetitive, and as I looked at my growing
        dataset I thought: <b>I can self-train an AI model on this data.</b>
      </p>
      <p className="copy">
        The result is an end-to-end VC analyst pipeline that <b>cut down my review-time by 40%</b>.
      </p>
      <ol className={s.pipe} aria-label="The pipeline">
        {PIPELINE.map((step, i) => (
          // Spaces either side of each arrow, so lines can break there.
          <li key={step}>{`${i > 0 ? " " : ""}${step}${i < PIPELINE.length - 1 ? " " : ""}`}</li>
        ))}
      </ol>
      <p className="copy">
        The classifier is still in progress: I’m benchmarking methods and documenting the work for a paper.
      </p>
    </section>
  );
}
