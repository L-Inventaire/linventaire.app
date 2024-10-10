import { Heading } from "@radix-ui/themes";
import { Info } from "../text";

export interface InputLabelProps {
  label?: string | React.ReactNode;
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
            className={
              "block whitespace-nowrap overflow-hidden text-ellipsis " +
              props.labelClassName
            }
          >
            {props.label}
          </Heading>
        )}
        <div className={props.label ? "mt-1" : ""}>{props.input}</div>
        {props.feedback && (
          <Info
            noColor
            className={props.hasError ? "text-red-400" : "text-slate-400"}
          >
            {props.feedback}
          </Info>
        )}
      </div>
    </>
  );
};
