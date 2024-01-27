import { ReactNode, useEffect } from "react";
import SuperEllipse from "react-superellipse";

let squircleTimeout: any = 0;

export default (props: {
  shadow?: "light" | "large" | "none";
  children: ReactNode | ReactNode[];
  className?: string;
  outerClassName?: string;
  noColor?: boolean;
  onClick?: any;
}) => {
  const shadow = props.shadow || "large";
  const color = props.noColor
    ? ""
    : "bg-white dark:bg-slate-800 dark:text-white ";

  useEffect(() => {
    clearTimeout(squircleTimeout);
    squircleTimeout = setTimeout(
      () => window.dispatchEvent(new Event("resize")),
      250
    );
  }, []);

  return (
    <div
      onClick={props.onClick}
      className={
        (shadow === "light"
          ? "shadow-light-drop "
          : shadow === "large"
          ? "shadow-large-drop "
          : "") + (props.outerClassName || "")
      }
    >
      <SuperEllipse
        p1={6}
        p2={40}
        className={"w-full " + color + " " + (props.className || "")}
      >
        {props.children}
      </SuperEllipse>
    </div>
  );
};
