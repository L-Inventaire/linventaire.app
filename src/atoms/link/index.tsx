import { Shortcut, useShortcuts } from "@features/utils/shortcuts";
import _ from "lodash";
import { Link as L, useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";

export default function Link(
  props: any & {
    href?: string;
    to?: string;
    onClick?: () => void;
    children: React.ReactNode;
    noColor?: boolean;
    shortcut?: Shortcut[];
  }
) {
  const navigate = useNavigate();

  useShortcuts(props.shortcut || [], () => {
    if (props.onClick) props.onClick();
    if (props.href || props.to) navigate(props.href || props.to);
  });

  const colors = props.noColor
    ? ""
    : "hover:text-wood-600 active:text-wood-800 text-wood-500 hover:underline underline-offset-2";

  if (
    (props.href || "")?.startsWith("http") ||
    (props.href || "")?.startsWith("mailto:")
  ) {
    return (
      <a
        href={props.href}
        className={colors + " " + (props.className || "")}
        {..._.omit(props, "children", "className", "noColor")}
      >
        {props.children}
      </a>
    );
  }

  if (!props.onClick && (props.href || props.to)) {
    return (
      <L
        to={props.href || props.to}
        className={twMerge(colors, props.className || "")}
        {..._.omit(props, "children", "className", "noColor", "to", "href")}
      >
        {props.children}
      </L>
    );
  }

  return (
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (props.onClick) props.onClick();
      }}
      className={twMerge(colors, props.className || "")}
      {..._.omit(props, "children", "className", "noColor", "to", "href")}
    >
      {props.children}
    </span>
  );
}
