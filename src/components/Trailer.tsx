"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { capture } from "@/lib/analytics";
import s from "./sections/Tunebox.module.css";

const VIDEO_ID = "JGS_X_n-Gvs";

/**
 * The Tunebox trailer. Until it's pressed this is a thumbnail and a button:
 * nothing from YouTube loads (no player, no cookies) unless someone asks for
 * the video. Pressing it swaps in the nocookie player, already playing.
 */
export default function Trailer() {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);

  return (
    <div className={`media ${s.vid}`}>
      {playing ? (
        <iframe
          ref={frame}
          className={s.frame}
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&autoplay=1&playsinline=1`}
          title="Tunebox trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className={s.poster}
          onClick={() => {
            capture("tunebox_trailer_played");
            setPlaying(true);
          }}
        >
          <Image
            src={`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
            alt=""
            fill
            sizes="(width < 48rem) 100vw, min(1228px, 86vw)"
            className={s.thumb}
          />
          <span className={s.play}>Play the trailer</span>
        </button>
      )}
    </div>
  );
}
