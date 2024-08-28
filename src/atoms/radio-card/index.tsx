import {
  InputOutlinedDefault,
  InputOutlinedHighlight,
} from "@atoms/styles/inputs";
import { Base, Info } from "@atoms/text";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const RadioCard = (props: {
  value?: boolean;
  onClick?: () => void;
  title?: ReactNode | string;
  text?: ReactNode | string;
}) => {
  return (
    <div
      className={twMerge(
        "w-full flex items-center cursor-pointer",
        InputOutlinedDefault,
        props.value && InputOutlinedHighlight
      )}
      onClick={props.onClick}
    >
      <div>
        <div
          className={twMerge(
            "w-4 h-4 rounded-full mx-2 flex items-center justify-center",
            props.value && "border border-slate-500",
            !props.value && "border border-slate-100 dark:border-slate-700"
          )}
        >
          {props.value && (
            <div className="rounded-full bg-slate-500 w-2.5 h-2.5" />
          )}
        </div>
      </div>
      <div className="w-full py-2 text-sm">
        {props.title && <Base className="block">{props.title}</Base>}
        {props.text && <Info>{props.text}</Info>}
      </div>
    </div>
  );
};
