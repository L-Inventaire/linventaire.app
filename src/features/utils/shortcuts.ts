import { useRef, useEffect, useCallback } from "react";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";

export type Shortcut =
  | ShortcutKeys
  | ConcatenatedString<"shift+", ShortcutKeys>
  | ConcatenatedString<"cmd+", ShortcutKeys>
  | ConcatenatedString<"cmd+shift+", ShortcutKeys>;

/* Do not use preferably
  | ConcatenatedString<"ctrl+", ShortcutKeys>
  | ConcatenatedString<"alt+", ShortcutKeys>
  | ConcatenatedString<"ctrl+shift+", ShortcutKeys>
  | ConcatenatedString<"ctrl+alt+", ShortcutKeys>
  | ConcatenatedString<"ctrl+alt+shift+", ShortcutKeys>
  | ConcatenatedString<"alt+shift+", ShortcutKeys>
  | ConcatenatedString<"ctrl+shift+", ShortcutKeys>
  | ConcatenatedString<"ctrl+alt+", ShortcutKeys>
  | ConcatenatedString<"ctrl+alt+shift+", ShortcutKeys>
  */

type ConcatenatedString<T extends string, S extends string> = `${T}${S}`;

type ShortcutKeys =
  | "del"
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z"
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "space"
  | "esc"
  | "enter"
  | "right"
  | "left"
  | "up"
  | "down";

//Store history of callbacks, per context
const shortcutsCallbacks: {
  [key: string]: {
    [key: string]: { id: string; cb: (e: any, shortcut: Shortcut) => void }[];
  };
} = {};

(window as any).shortcutsCallbacks = shortcutsCallbacks;

// Isolate contexts for instance when in modal everything behind should not be able to listen to shortcuts
const contextsStack: string[] = ["default"];
export const useShortcutsContext = (context: string) => {
  useEffect(() => {
    contextsStack.push(context);
    return () => {
      contextsStack.pop();
    };
  }, []);
};

let scids = 0;
export const useShortcuts = (
  shortcuts: Shortcut[],
  _callback: (e: React.MouseEvent, shortcut: Shortcut) => void,
  deps: any[] = []
) => {
  const componentId = useRef(scids++);
  const currentShortcuts = useRef<string[]>([]);

  const callback = useCallback(_callback, [_callback, ...deps]);

  const removeShortcuts = () => {
    for (const context of Object.keys(shortcutsCallbacks)) {
      for (const shortcut of currentShortcuts.current) {
        if (shortcutsCallbacks?.[context]?.[shortcut]?.length > 0) {
          // Remove the callback from the list at the current index
          shortcutsCallbacks[context][shortcut] = shortcutsCallbacks[context][
            shortcut
          ].filter((a) => a.id !== componentId.current.toString());
        }
      }
    }
    currentShortcuts.current = [];
  };

  useControlledEffect(() => {
    //Remove old shortcuts
    removeShortcuts();

    const context = contextsStack[contextsStack.length - 1];
    for (const shortcut of shortcuts) {
      if (!shortcutsCallbacks[context]) shortcutsCallbacks[context] = {};
      shortcutsCallbacks[context][shortcut] =
        shortcutsCallbacks[context][shortcut] || [];
      shortcutsCallbacks[context][shortcut].push({
        cb: callback,
        id: componentId.current.toString(),
      });
    }

    currentShortcuts.current = shortcuts;
  }, [shortcuts.join(","), ...deps, callback]);

  useEffect(() => {
    return () => {
      removeShortcuts();
    };
  }, []);
};

let shortcutPaused = false;
export const useToggleShortcuts = () => {
  return {
    pause: () => {
      shortcutPaused = true;
    },
    resume: () => {
      shortcutPaused = false;
    },
  };
};

export const useListenForShortcuts = () => {
  useEffect(() => {
    const listener = (e: any) => {
      if (shortcutPaused) return;

      const context = contextsStack[contextsStack.length - 1];
      if (!e.key) return;

      let shortcut = e.key
        .toLocaleLowerCase()
        .replace(/^key/, "")
        .toLowerCase();
      if (shortcut === " ") shortcut = "space";
      if (shortcut === "escape") shortcut = "esc";
      if (shortcut === "delete") shortcut = "del";
      if (shortcut === "backspace") shortcut = "del";
      if (shortcut === "arrowright") shortcut = "right";
      if (shortcut === "arrowleft") shortcut = "left";
      if (shortcut === "arrowup") shortcut = "up";
      if (shortcut === "arrowdown") shortcut = "down";

      if (e.shiftKey) {
        shortcut = "shift+" + shortcut;
      }
      if (e.altKey) {
        shortcut = "alt+" + shortcut;
      }

      const activeShortcuts = [shortcut];

      if (e.ctrlKey || e.metaKey) {
        activeShortcuts[0] = "ctrl+" + shortcut;
        activeShortcuts.push("cmd+" + shortcut);
      }

      for (const shortcut of activeShortcuts) {
        //Ignore if input, textarea or select is focused
        if (
          // Cmd+S and cmd+K are exceptions, we still want to enable save on document while input is focused
          !activeShortcuts.includes("cmd+s") &&
          !activeShortcuts.includes("cmd+k") &&
          document.activeElement &&
          ["input", "textarea", "select"].includes(
            document.activeElement.tagName?.toLowerCase()
          ) &&
          !(
            shortcut === "enter" &&
            document.activeElement.tagName?.toLowerCase() !== "textarea"
          )
        ) {
          if (shortcut === "esc") {
            // If active elements has a data-release-escape then we want to allow the escape key
            if (!document.activeElement.getAttribute("data-release-escape")) {
              (document.activeElement as any)?.blur();
              return;
            } else {
              (document.activeElement as any)?.blur();
            }
          } else {
            return;
          }
        }

        if (
          shortcutsCallbacks[context] &&
          shortcutsCallbacks[context][shortcut] &&
          shortcutsCallbacks[context][shortcut].length
        ) {
          e.preventDefault();
          shortcutsCallbacks[context][shortcut][
            shortcutsCallbacks[context][shortcut].length - 1
          ].cb(e, shortcut);
          return;
        }
      }
    };

    document.addEventListener("keydown", listener);

    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, []);
};

export const showShortCut = (shortcut: string[]) => {
  const hasCmdKey = navigator.userAgent.indexOf("Mac OS X") !== -1;
  return shortcut
    .filter((a) =>
      navigator.userAgent.indexOf("Mac OS X") !== -1
        ? true
        : a.indexOf("cmd") === -1
    )
    .map((a) =>
      a
        .replace("cmd", hasCmdKey ? "⌘" : "ctrl+")
        .replace("ctrl", "ctrl+")
        .replace("alt", "⌥")
        .replace("enter", "↵")
        .replace("up", "↑")
        .replace("down", "↓")
        .replace("left", "←")
        .replace("right", "→")
        .replace("shift", "⇧")
        .replace("del", "⌫")
        .replace(/\+/g, "")
        .toLocaleUpperCase()
    )[0];
};
