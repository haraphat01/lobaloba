import "server-only";
import { Marked } from "marked";
import { escapeHtml } from "@/lib/email/templates";

// Markdown for journal articles and policies. Raw HTML in the source is
// escaped (not rendered) and links are restricted to safe protocols.
const marked = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : "#";
      const external = /^https?:/i.test(safe);
      const label = this.parser.parseInline(tokens);
      return `<a href="${escapeHtml(safe)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external ? ' rel="noopener noreferrer" target="_blank"' : ""}>${label}</a>`;
    },
    image({ href, text }) {
      const safe = /^(https?:|\/)/i.test(href) ? href : "";
      return safe ? `<img src="${escapeHtml(safe)}" alt="${escapeHtml(text)}" loading="lazy" />` : "";
    },
  },
});

export function renderMarkdown(source: string) {
  return marked.parse(source ?? "", { async: false }) as string;
}
