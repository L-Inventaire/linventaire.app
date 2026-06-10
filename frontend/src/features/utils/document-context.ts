import { createContext, useMemo, useRef } from "react";

export type DocumentMode = "read" | "write";
export type DocumentModeState = Record<string, any>;

export type DocumentContextType = {
  changeMode: (mode: DocumentMode, state?: DocumentModeState) => void;
  subscribe: (fn: (mode: DocumentMode, state?: DocumentModeState) => void) => () => void;
};

export const DocumentContext = createContext<DocumentContextType>({
  changeMode: () => {},
  subscribe: () => () => {},
});

export const useDocumentContextRef = (): DocumentContextType => {
  const handlersRef = useRef(new Set<(mode: DocumentMode, state?: DocumentModeState) => void>());
  return useMemo(() => ({
    changeMode: (mode, state) => handlersRef.current.forEach(fn => fn(mode, state)),
    subscribe: (fn) => {
      handlersRef.current.add(fn);
      return () => { handlersRef.current.delete(fn); };
    },
  }), []);
};
