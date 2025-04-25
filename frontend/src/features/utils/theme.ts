import { useEffect, useState } from "react";

const isDark = () =>
  localStorage.theme === "dark" ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);

export const useTheme = () => {
  const [theme, setTheme] = useState(isDark() ? "dark" : "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const callback = (e: any) => {
      if (!localStorage.theme)
        if (e.matches) {
          setTheme("dark");
        } else {
          setTheme("light");
        }
    };
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", callback);
    return () =>
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", callback);
  }, []);

  return {
    setTheme: (theme: "dark" | "light" | "") => {
      localStorage.theme = theme;
      setTheme(
        theme ||
          (window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light")
      );
    },
    theme,
  };
};
