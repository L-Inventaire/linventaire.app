import { createContext, useMemo, useRef } from "react";

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

export const useDocumentContextRef = (): DocumentContextType => {
  const changeModeRef = useRef<(mode: DocumentMode) => void>(() => {});
  return useMemo(() => ({
    changeMode: (mode) => changeModeRef.current(mode),
    _registerChangeMode: (fn) => {
      changeModeRef.current = fn;
      return () => { changeModeRef.current = () => {}; };
    },
  }), []);
};
