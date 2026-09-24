"use client";

import { startTransition, useActionState, useRef, useState, type CSSProperties } from "react";
import { sendMessage } from "@/app/actions";
import { EMAIL_PATTERN, MESSAGE_MAX, type SendState } from "@/lib/contact";
import { capture } from "@/lib/analytics";
import SentFlight from "./SentFlight";
import s from "./Contact.module.css";

const FAILED: Record<string, string> = {
  "not-configured": "Sending isn’t set up right now. Email me directly instead, below.",
  failed: "That didn’t go through. Try again, or email me directly below.",
};

/**
 * A mail composer that sends for real. Without JavaScript it's a plain form
 * posting to the server action; with it, the From field is checked as it's
 * typed and a sent message flies to New York (SentFlight).
 */
export default function Composer() {
  const [state, action, pending] = useActionState(sendMessage, { status: "idle" } as SendState);
  const [from, setFrom] = useState(() => (state.status === "error" ? state.email : ""));
  const [message, setMessage] = useState(() => (state.status === "error" ? state.message : ""));
  const [touched, setTouched] = useState(false);
  const [tried, setTried] = useState(false);
  const [height, setHeight] = useState<number>();
  const formRef = useRef<HTMLFormElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const serverSays = state.status === "error" ? state.reason : null;
  const emailOk = EMAIL_PATTERN.test(from.trim());
  const messageOk = message.trim().length > 0 && message.length <= MESSAGE_MAX;
  const emailError =
    ((touched || tried) && !emailOk) || (serverSays === "email" && !emailOk)
      ? from.trim()
        ? "That doesn’t look like an email address yet."
        : "Add your email, so I can reply."
      : null;
  const messageError =
    (tried || serverSays === "message") && !messageOk
      ? message.length > MESSAGE_MAX
        ? `That’s over ${MESSAGE_MAX.toLocaleString("en")} characters.`
        : "Write me something first."
      : null;

  if (state.status === "sent") {
    return (
      <div className={s.mail} style={{ "--h": height ? `${height}px` : undefined } as CSSProperties}>
        <SentFlight email={state.email} origin={state.origin} />
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className={s.mail}
      action={action}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (!emailOk || !messageOk) {
          (emailOk ? messageRef : fromRef).current?.focus();
          return;
        }
        // The sent screen keeps the form's height, so nothing below it jumps.
        setHeight(formRef.current?.offsetHeight);
        capture("contact_form_submitted");
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <div className={s.f}>
        <span className={s.label}>To</span>
        <b>William Ragnarsson</b>
      </div>

      <div className={s.f} data-invalid={emailError ? "" : undefined}>
        <label htmlFor="contact-from" className={s.label}>
          From
        </label>
        <input
          ref={fromRef}
          id="contact-from"
          className={s.input}
          type="email"
          name="from"
          placeholder="you@company.com"
          autoComplete="email"
          required
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          onBlur={() => from && setTouched(true)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "contact-from-error" : undefined}
        />
      </div>
      {emailError ? (
        <p id="contact-from-error" className={s.err}>
          {emailError}
        </p>
      ) : null}

      <div className={`${s.f} ${s.msg}`} data-invalid={messageError ? "" : undefined}>
        <label htmlFor="contact-message" className="sr-only">
          Message
        </label>
        <textarea
          ref={messageRef}
          id="contact-message"
          className={`${s.input} ${s.textarea}`}
          name="message"
          placeholder="Hi William, …"
          required
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={messageError ? true : undefined}
          aria-describedby={messageError ? "contact-message-error" : undefined}
        />
      </div>
      {messageError ? (
        <p id="contact-message-error" className={s.err}>
          {messageError}
        </p>
      ) : null}

      {/* People never see this field; bots fill it in. */}
      <div className={s.hp} aria-hidden>
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className={s.foot}>
        <button type="submit" className={s.send} disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </button>
        {serverSays && FAILED[serverSays] ? (
          <p className={s.err} role="alert">
            {FAILED[serverSays]}
          </p>
        ) : null}
      </div>
    </form>
  );
}
