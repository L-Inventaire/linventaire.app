import { createContext } from "react";

export type DocumentMode = "read" | "write";

export type DocumentContextType = {
  changeMode: (mode: DocumentMode) => void;
  /** Internal — called by DocumentBar to register the mode-switch handler. Returns cleanup. */
  _registerChangeMode: (fn: (mode: DocumentMode) => void) => () => void;
};

export const DocumentContext = createContext<DocumentContextType>({
  changeMode: () => {},
  _registerChangeMode: () => () => {},
});
