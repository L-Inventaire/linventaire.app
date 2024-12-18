import { Heading } from "@radix-ui/themes";
import { Info } from "../text";
import { twMerge } from "tailwind-merge";
import { XMarkIcon } from "@heroicons/react/16/solid";
import _ from "lodash";
import { ResetProps } from "@components/form/fields";
export interface InputLabelProps {
  label?: string | React.ReactNode;
  reset?: boolean;
  onReset?: () => void;
  resetProps?: ResetProps;
  feedback?: string;
  hasError?: boolean;
  input?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export const InputLabel = (props: InputLabelProps) => {
  return (
    <>
      <div className={props.className}>
        {props.label && (
          <Heading
            size="2"
            className={twMerge(
              "block whitespace-nowrap overflow-hidden text-ellipsis",
              props.labelClassName
            )}
          >
            {props.label}
          </Heading>
        )}
        <div className={twMerge(props.label && "mt-1", "relative")}>
          {props.input}
          {props.reset && (
            <XMarkIcon
              onClick={props.onReset}
              className={twMerge(
                "w-4 h-6 bg-white dark:bg-slate-800 text-xs text-slate-400 cursor-pointer absolute right-2 top-1/2 -translate-y-1/2",
                props.resetProps?.className
              )}
              {..._.omit(
                props.resetProps,
                "onClick",
                "className",
                "onReset",
                "onClick",
                "onCopy"
              )}
            />
          )}
        </div>
        {props.feedback && (
          <Info
            noColor
            className={twMerge(
              props.hasError && "text-red-400",
              "text-slate-400"
            )}
          >
            {props.feedback}
          </Info>
        )}
      </div>
    </>
  );
};
