import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let client: Resend | null = null;

export async function sendEmail(input: { to: string | string[]; subject: string; html: string; text?: string; replyTo?: string }) {
  const key = env.resendApiKey();
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${input.subject}" to ${[input.to].flat().length} recipient(s)`);
    return { skipped: true as const };
  }
  client ??= new Resend(key);
  const { data, error } = await client.emails.send({
    from: env.emailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });
  if (error) {
    console.error(`[email] failed "${input.subject}"`, error.message);
    return { error: error.message };
  }
  return { id: data?.id };
}
