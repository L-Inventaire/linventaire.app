import { Tooltip as RdxTooltip } from "@radix-ui/themes";
import { ReactNode } from "react";

export const Tooltip = (props: {
  content?: ReactNode;
  children: ReactNode;
}) => {
  if (!props.content) {
    return props.children;
  }

  return (
    <RdxTooltip
      content={
        typeof props.content === "string"
          ? props.content
              .split("`")
              .map((a, i) =>
                i % 2 === 0 ? (
                  a
                ) : (
                  <span className="font-mono border-[0.5px] border-slate-100 dark:border-slate-800 rounded px-1 shadow-sm">
                    {a}
                  </span>
                )
              )
          : props.content
      }
    >
      {props.children}
    </RdxTooltip>
  );
};

export const ConditionalTooltip = (props: {
  content?: ReactNode;
  children: ReactNode;
}) => {
  if (!props.content) {
    return props.children;
  }
  return <Tooltip content={props.content}>{props.children}</Tooltip>;
};
