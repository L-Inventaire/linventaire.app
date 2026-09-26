import { InvoiceLine } from "@features/invoices/types/types";
import {
  generateGroupId,
  isGroupHeader,
  normalizeInvoiceGroups,
} from "@shared/invoices";
import _ from "lodash";

// A block is either a single line outside of any group, or a group header
// followed by the lines of the group.
export type InvoiceContentBlock = {
  line: InvoiceLine; // The line itself, or the header of the group
  lines: InvoiceLine[]; // Lines of the group (empty for a single line)
};

export const toBlocks = (content: InvoiceLine[]): InvoiceContentBlock[] => {
  const blocks: InvoiceContentBlock[] = [];
  for (const line of normalizeInvoiceGroups(content)) {
    const last = _.last(blocks);
    if (
      !isGroupHeader(line) &&
      line.group &&
      last &&
      isGroupHeader(last.line) &&
      last.line.group === line.group
    ) {
      last.lines.push(line);
    } else {
      blocks.push({ line, lines: [] });
    }
  }
  return blocks;
};

export const fromBlocks = (blocks: InvoiceContentBlock[]): InvoiceLine[] =>
  blocks.flatMap((b) => [b.line, ...b.lines]);

export const createGroupHeader = (name = "Nouveau groupe"): InvoiceLine =>
  ({
    _id: _.uniqueId(),
    type: "group",
    group: generateGroupId(),
    group_hide_prices: false,
    name,
    description: "",
    article: "",
    unit: "",
    unit_price: 0,
    quantity: 0,
  }) as InvoiceLine;

export const createEmptyLine = (group = ""): InvoiceLine =>
  ({
    _id: _.uniqueId(),
    type: "product",
    name: "",
    description: "",
    unit: "",
    unit_price: 0,
    quantity: 1,
    group,
  }) as InvoiceLine;

// Move a line after the element "afterId" (or at the beginning when null)
// and attach it to the given group ("" for no group).
export const moveLine = (
  content: InvoiceLine[],
  item: InvoiceLine,
  afterId: string | null,
  group: string,
): InvoiceLine[] => {
  if (item._id === afterId) return content;
  const current = content.find((a) => a._id === item._id) || item;
  const list = content.filter((a) => a._id !== item._id);
  const index = afterId ? list.findIndex((a) => a._id === afterId) + 1 : 0;
  list.splice(index, 0, { ...current, group });
  return normalizeInvoiceGroups(list);
};

// Move a whole group (header and lines) after the element "afterId"
export const moveGroup = (
  content: InvoiceLine[],
  header: InvoiceLine,
  afterId: string | null,
): InvoiceLine[] => {
  const blocks = toBlocks(content);
  const block = blocks.find((b) => b.line._id === header._id);
  if (!block) return content;
  const moved = [block.line, ...block.lines];
  if (moved.some((a) => a._id === afterId)) return content;
  const list = fromBlocks(blocks.filter((b) => b !== block));
  const index = afterId ? list.findIndex((a) => a._id === afterId) + 1 : 0;
  list.splice(index, 0, ...moved);
  return normalizeInvoiceGroups(list);
};

// Swap a block (line or group) with the previous or next one
export const moveBlock = (
  content: InvoiceLine[],
  id: string,
  direction: -1 | 1,
): InvoiceLine[] => {
  const blocks = toBlocks(content);
  const index = blocks.findIndex((b) => b.line._id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= blocks.length) return content;
  [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
  return fromBlocks(blocks);
};

// Swap a line of a group with the previous or next line of the same group
export const moveLineInGroup = (
  content: InvoiceLine[],
  id: string,
  direction: -1 | 1,
): InvoiceLine[] => {
  const blocks = toBlocks(content);
  for (const block of blocks) {
    const index = block.lines.findIndex((a) => a._id === id);
    const target = index + direction;
    if (index < 0) continue;
    if (target < 0 || target >= block.lines.length) return content;
    [block.lines[index], block.lines[target]] = [
      block.lines[target],
      block.lines[index],
    ];
  }
  return fromBlocks(blocks);
};

// Remove a group, keeping (outside of any group) or removing its lines
export const removeGroup = (
  content: InvoiceLine[],
  header: InvoiceLine,
  keepLines: boolean,
): InvoiceLine[] =>
  content
    .filter(
      (a) =>
        a._id !== header._id &&
        (keepLines || isGroupHeader(a) || a.group !== header.group),
    )
    .map((a) =>
      !isGroupHeader(a) && a.group === header.group ? { ...a, group: "" } : a,
    );

// Duplicate a group with its lines, just after the original one
export const duplicateGroup = (
  content: InvoiceLine[],
  header: InvoiceLine,
): InvoiceLine[] => {
  const blocks = toBlocks(content);
  const index = blocks.findIndex((b) => b.line._id === header._id);
  if (index < 0) return content;
  const copy = createGroupHeader();
  const block = blocks[index];
  blocks.splice(index + 1, 0, {
    line: { ..._.cloneDeep(block.line), _id: copy._id, group: copy.group },
    lines: block.lines.map((a) => ({
      ..._.cloneDeep(a),
      _id: _.uniqueId(),
      group: copy.group,
    })),
  });
  return fromBlocks(blocks);
};

// Create a group from a line: an empty line becomes the group header,
// a line with content is wrapped into a new group.
export const createGroupFromLine = (
  content: InvoiceLine[],
  line: InvoiceLine,
): InvoiceLine[] => {
  const header = createGroupHeader();
  const isEmpty = !line.article && !line.name && !line.unit_price;
  const index = content.findIndex((a) => a._id === line._id);
  const list = [...content];
  if (isEmpty) {
    list.splice(index, 1, { ...header, _id: line._id });
  } else {
    list.splice(index, 1, header, { ...line, group: header.group });
  }
  return normalizeInvoiceGroups(list);
};
