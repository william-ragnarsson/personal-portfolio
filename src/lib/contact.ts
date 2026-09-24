// What the contact form and its server action share. A "use server" module
// can only export async functions, so the rest lives here.

export type Origin = { lat: number; lng: number; city: string | null };

export type SendState =
  | { status: "idle" }
  | { status: "sent"; email: string; origin: Origin | null }
  | { status: "error"; reason: "email" | "message" | "not-configured" | "failed"; email: string; message: string };

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MESSAGE_MAX = 5000;
