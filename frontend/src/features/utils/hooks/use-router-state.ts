import { useState } from "react";

/**
 * A state hook that uses the router state, updates the url, and make the browser back / forward working
 * @param defaultValue
 * @param stackHistoryOnChange
 */
export const useRouterState = (
  key: string,
  defaultValue?: string,
  stackHistoryOnChange = true
): [string, (value: string) => void] => {
  // Get url param value
  const url = new URL(window.location.href);
  const value = url.searchParams.get(key) || defaultValue;
  const [state, setState] = useState(value || "");

  // Detect url change
  window.addEventListener("popstate", () => {
    const url = new URL(window.location.href);
    setState(url.searchParams.get(key) || defaultValue || "");
  });

  // Update url and state
  return [
    state,
    (value: string) => {
      const url = new URL(window.location.href);
      url.searchParams.set(key, value);
      if (stackHistoryOnChange) {
        window.history.pushState({}, "", url.toString());
        const navEvent = new Event("navigated");
        dispatchEvent(navEvent);
      } else {
        window.history.replaceState({}, "", url.toString());
      }
      setState(value);
    },
  ];
};
