"use server";

import { headers } from "next/headers";
import { site } from "@/data/site";
import { EMAIL_PATTERN, MESSAGE_MAX, type Origin, type SendState } from "@/lib/contact";

// The contact form. It sends through Resend's HTTP API, so there's no SDK to
// install, and needs these env vars (see the README):
//
//   RESEND_API_KEY   required in production
//   CONTACT_FROM     a sender on your verified domain, e.g.
//                    "Portfolio <hello@williamragnarsson.com>". Resend's test
//                    sender is the fallback, and it only delivers to the
//                    address the Resend account was made with.
//   CONTACT_TO       where messages go; defaults to site.email

/** Where the visitor is, roughly, from Vercel's geo headers. Null anywhere else. */
async function origin(): Promise<Origin | null> {
  const h = await headers();
  const lat = Number.parseFloat(h.get("x-vercel-ip-latitude") ?? "");
  const lng = Number.parseFloat(h.get("x-vercel-ip-longitude") ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const raw = h.get("x-vercel-ip-city");
  let city: string | null = null;
  try {
    city = raw ? decodeURIComponent(raw) : null;
  } catch {
    city = raw;
  }
  return { lat, lng, city };
}

export async function sendMessage(_prev: SendState, form: FormData): Promise<SendState> {
  const email = String(form.get("from") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();

  // The honeypot: a field people can't see. Anything in it is a bot, which
  // gets the success screen and no email.
  if (String(form.get("company") ?? "")) return { status: "sent", email, origin: null };

  if (!EMAIL_PATTERN.test(email)) return { status: "error", reason: "email", email, message };
  if (!message || message.length > MESSAGE_MAX) return { status: "error", reason: "message", email, message };

  const from = await origin();
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[contact] RESEND_API_KEY isn't set, so nothing was sent. From ${email}:\n${message}`);
      return { status: "sent", email, origin: from };
    }
    console.error("[contact] RESEND_API_KEY isn't set; the contact form can't send.");
    return { status: "error", reason: "not-configured", email, message };
  }

  const where = from?.city ? `\n\nSent from ${from.city}.` : "";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO || site.email],
        reply_to: email,
        subject: `New message from ${email}`,
        text: `${message}\n\n— ${email}, via williamragnarsson.com${where}`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[contact] Resend answered ${res.status}: ${await res.text().catch(() => "")}`);
      return { status: "error", reason: "failed", email, message };
    }
  } catch (err) {
    console.error("[contact] Couldn't reach Resend:", err);
    return { status: "error", reason: "failed", email, message };
  }
  return { status: "sent", email, origin: from };
}
