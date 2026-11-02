import DOMPurify from "dompurify";

export type CRMNotesPreview = {
  /** First line of the notes, shown in bold as the card title */
  title: string;
  /** Remaining lines as plain text (list items prefixed with "• ") */
  description: string;
};

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "UL",
  "OL",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "PRE",
]);

const MAX_TITLE_LENGTH = 140;

/**
 * Turns the rich text notes of a CRM item into lines of plain text, one per
 * paragraph, <br> or list item.
 */
const notesToLines = (html: string): string[] => {
  const clean = DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS: [
      "b",
      "i",
      "u",
      "em",
      "strong",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "div",
      "span",
      "a",
    ],
    ALLOWED_ATTR: [],
  });
  const doc = new DOMParser().parseFromString(clean, "text/html");

  const lines: string[] = [];
  let current = "";
  const flush = () => {
    const line = current.replace(/\s+/g, " ").trim();
    if (line && line !== "•") lines.push(line);
    current = "";
  };

  const walk = (node: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        // Notes created through the API can be plain text with line breaks
        (child.textContent || "").split(/\r?\n/).forEach((part, index) => {
          if (index > 0) flush();
          current += part;
        });
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const tag = (child as Element).tagName;
      if (tag === "BR") {
        flush();
      } else if (tag === "LI") {
        flush();
        current = "• ";
        walk(child);
        flush();
      } else if (BLOCK_TAGS.has(tag)) {
        flush();
        walk(child);
        flush();
      } else {
        walk(child);
      }
    });
  };

  walk(doc.body);
  flush();
  return lines;
};

/**
 * The first line of the notes is the title of the opportunity, the rest is its
 * description. A title too long to be read at a glance is cut and continues in
 * the description.
 */
export const splitCRMNotes = (html: string): CRMNotesPreview => {
  const lines = notesToLines(html);
  let title = (lines[0] || "").replace(/^•\s*/, "");
  const rest = lines.slice(1);

  // Only cut when the end is long enough to be worth reading separately
  if (title.length > MAX_TITLE_LENGTH + 40) {
    const cut = title.lastIndexOf(" ", MAX_TITLE_LENGTH);
    const at = cut > MAX_TITLE_LENGTH / 2 ? cut : MAX_TITLE_LENGTH;
    rest.unshift("…" + title.slice(at).trim());
    title = title.slice(0, at).trim() + "…";
  }

  return { title, description: rest.join("\n") };
};
