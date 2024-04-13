import { ReactNode } from "react";

interface InputLabelProps {
  prefix?: (props: any) => JSX.Element;
  suffix?: (props: any) => JSX.Element;
  input: ({ className }: { className: string }) => ReactNode;
  className?: string;
  onClick?: () => void;
}

export const InputDecorationIcon = (props: InputLabelProps) => {
  return (
    <div className={"relative " + props.className} onClick={props.onClick}>
      {props.prefix && (
        <props.prefix className="h-4 w-4 absolute m-auto top-0 bottom-0 left-2.5 text-slate-500" />
      )}
      {props.input({
        className:
          (props.prefix ? "pl-8 " : "") + (props.suffix ? "pr-8 " : ""),
      })}
      {props.suffix && (
        <props.suffix className="h-4 w-4 absolute m-auto top-0 bottom-0 right-2.5 text-slate-500" />
      )}
    </div>
  );
};
