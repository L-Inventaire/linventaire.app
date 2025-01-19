import { ArrowUturnLeftIcon } from "@heroicons/react/16/solid";
import { Button, Heading } from "@radix-ui/themes";
import { twMerge } from "tailwind-merge";
import { Info } from "../text";
export interface InputLabelProps {
  label?: string | React.ReactNode;
  onReset?: () => void;
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
            {props.onReset && (
              <span className="relative">
                <Button
                  size="1"
                  variant="ghost"
                  className="ml-1"
                  onClick={props.onReset}
                >
                  <ArrowUturnLeftIcon className="w-3 h-3 inline-block mr-1" />
                  Par défaut
                </Button>
              </span>
            )}
          </Heading>
        )}
        <div className={twMerge(props.label && "mt-1", "relative")}>
          {props.input}
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
