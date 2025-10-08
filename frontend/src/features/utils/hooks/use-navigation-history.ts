import { useLocation } from "react-router-dom";
import { useGlobalEffect } from "./use-global-effect";
import { useEffect } from "react";

const saveStack = (stack: string[]) => {
  localStorage.setItem("navigation-history", JSON.stringify(stack.slice(-50)));
};

/**
 * Each time navigation changes, we save the last 50 urls in order to make back button works from app
 * Use localstorage to store this
 */
export const useNavigationHistory = () => {
  // Detect history stack changes or page load
  const currentStack = JSON.parse(
    localStorage.getItem("navigation-history") || "[]"
  );

  const location = useLocation();

  useEffect(() => {
    const navEvent = new Event("navigated");
    dispatchEvent(navEvent);
  }, [location.pathname, location.search]);

  // Detect page change
  useGlobalEffect(
    "useNavigationHistory",
    () => {
      const currentUrl = window.location.pathname + window.location.search;
      currentStack.push(currentUrl);
      saveStack(currentStack);

      window.addEventListener("navigated", () => {
        // Custom event created by useRouterState
        const currentStack = JSON.parse(
          localStorage.getItem("navigation-history") || "[]"
        );
        const currentUrl = window.location.pathname + window.location.search;
        if (currentStack[currentStack.length - 1] === currentUrl) {
          return;
        }
        currentStack.push(currentUrl);
        saveStack(currentStack);
      });
    },
    []
  );
};

export const useLastLocations = () => {
  return {
    getLastLocations: (): string[] =>
      JSON.parse(localStorage.getItem("navigation-history") || "[]").slice(
        0,
        -1
      ),
    popState: (n: number) => {
      const currentStack = JSON.parse(
        localStorage.getItem("navigation-history") || "[]"
      );
      for (let i = 0; i < n; i++) {
        currentStack.pop();
      }
      localStorage.setItem(
        "navigation-history",
        JSON.stringify(currentStack.slice(-50))
      );
    },
  };
};
