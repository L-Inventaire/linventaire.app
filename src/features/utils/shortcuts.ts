import { useRef, useEffect } from "react";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";

export type Shortcut =
  | ShortcutKeys
  | ConcatenatedString<"ctrl+", ShortcutKeys>
  | ConcatenatedString<"alt+", ShortcutKeys>
  | ConcatenatedString<"shift+", ShortcutKeys>;

type ConcatenatedString<T extends string, S extends string> = `${T}${S}`;

type ShortcutKeys =
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

//Store history of callbacks
const shortcutsCallbacks: any = {};

export const useListenForShortcuts = () => {
  useEffect(() => {
    const listener = (e: any) => {
      if (!e.key) return;

      let shortcut = e.key.toLowerCase();
      if (shortcut === " ") shortcut = "space";
      if (shortcut === "escape") shortcut = "esc";
      if (shortcut === "arrowright") shortcut = "right";
      if (shortcut === "arrowleft") shortcut = "left";
      if (shortcut === "arrowup") shortcut = "up";
      if (shortcut === "arrowdown") shortcut = "down";

      if (e.ctrlKey) {
        shortcut = "ctrl+" + shortcut;
      }
      if (e.altKey) {
        shortcut = "alt+" + shortcut;
      }
      if (e.shiftKey) {
        shortcut = "shift+" + shortcut;
      }

      //Ignore if input, textarea or select is focused
      if (
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
          (document.activeElement as any)?.blur();
        }
        return;
      }

      if (shortcutsCallbacks[shortcut] && shortcutsCallbacks[shortcut].length) {
        shortcutsCallbacks[shortcut][shortcutsCallbacks[shortcut].length - 1](
          e
        );
      }
    };

    document.addEventListener("keyup", listener);

    return () => {
      document.removeEventListener("keyup", listener);
    };
  }, []);
};

export const useShortcuts = (
  shortcuts: Shortcut[],
  callback: (e: React.MouseEvent) => void
) => {
  const currentShortcuts = useRef<string[]>([]);

  useControlledEffect(() => {
    //Remove old shortcuts
    for (const shortcut of currentShortcuts.current) {
      if (
        shortcutsCallbacks[shortcut] &&
        shortcutsCallbacks[shortcut].length > 0
      ) {
        shortcutsCallbacks[shortcut].pop();
      }
    }

    for (const shortcut of shortcuts) {
      shortcutsCallbacks[shortcut] = shortcutsCallbacks[shortcut] || [];
      shortcutsCallbacks[shortcut].push(callback);
    }

    currentShortcuts.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    return () => {
      for (const shortcut of currentShortcuts.current) {
        if (
          shortcutsCallbacks[shortcut] &&
          shortcutsCallbacks[shortcut].length > 0
        ) {
          shortcutsCallbacks[shortcut].pop();
        }
      }
    };
  }, []);
};
