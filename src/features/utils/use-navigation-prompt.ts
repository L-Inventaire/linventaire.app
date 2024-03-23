import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

export const useNavigationPrompt = (lockNavigation?: boolean) => {
  // This hook will prevent navigator page change as well as react router dom page change
  // when the lockNavigation is set to true

  useBlocker(({ currentLocation, nextLocation }) => {
    if (!lockNavigation) return false;
    const proceed = window.confirm("Are you sure you want to leave this page?");
    return (
      !proceed &&
      !!lockNavigation &&
      currentLocation.pathname !== nextLocation.pathname
    );
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (lockNavigation) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [lockNavigation]);
};
