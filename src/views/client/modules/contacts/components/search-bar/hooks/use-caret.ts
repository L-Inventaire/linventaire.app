import { MatchedStringFilter, MatchedStringValue } from "../utils/types";
import { extractFilters } from "../utils/utils";

export type CaretPositionType = {
  caret: { before: number; current: number; after: number };
  text: { before: string; current: string; after: string; all: string };
  filter: MatchedStringFilter | null;
  value: MatchedStringValue | null;
};

let lastCaretPosition = 0;

export const useCaret = (
  inputRef: React.RefObject<HTMLInputElement>,
  setValue: (value: string) => void
) => {
  // Function to find position of cursor in input
  const getCaretPosition = (): CaretPositionType => {
    let caret = 0;
    let text = "";
    if (inputRef.current) {
      const isFocus = document.activeElement === inputRef.current;
      caret = isFocus
        ? inputRef.current.selectionStart || 0
        : lastCaretPosition;
      lastCaretPosition = caret;
      text = inputRef.current.value || "";
      const filters = extractFilters(text);
      let pos = 0;
      let before = "";
      for (const filter of filters) {
        const posBefore = pos;
        pos += filter.raw.length + 1; // +1 for the space
        if (caret < pos) {
          const keyEndPos = posBefore + filter.raw.split(":")[0].length + 1;
          let subPos = keyEndPos;
          for (let i = 0; i < filter.values_raw_array.length + 1; i++) {
            const index = filter.values_raw_array[i] !== undefined ? i : -1;
            subPos += filter.values_raw_array[i]
              ? filter.values_raw_array[i].length + 1
              : 1;
            if (caret < subPos) {
              return {
                caret: {
                  before: before.length,
                  current: caret,
                  after: pos - 1,
                },
                text: {
                  before,
                  current: filter.raw,
                  after: text.slice(pos - 1),
                  all: text,
                },
                filter,
                value: caret < keyEndPos || index < 0 ? null : { index },
              };
            }
          }
        }
        before += filter.raw + " ";
      }
    }
    return {
      caret: {
        before: caret,
        current: caret,
        after: caret,
      },
      text: {
        before: text,
        current: "",
        after: "",
        all: text,
      },
      filter: null,
      value: null,
    };
  };

  const replaceAtCursor = (replacement: string, offset = 0) => {
    const { text, caret } = getCaretPosition();
    const newText = `${text.before}${replacement}${text.after}`;
    setValue(newText);
    inputRef.current!.value = newText;
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(
      caret.before + replacement.length + offset,
      caret.before + replacement.length + offset
    );
    lastCaretPosition = caret.before + replacement.length + offset;
  };

  return { getCaretPosition, replaceAtCursor };
};
