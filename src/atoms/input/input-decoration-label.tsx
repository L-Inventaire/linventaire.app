import { Info } from "../text";

export interface InputLabelProps {
  label?: string | React.ReactNode;
  feedback?: string;
  hasError?: boolean;
  input?: React.ReactNode;
  className?: string;
}

export const InputLabel = (props: InputLabelProps) => {
  return (
    <>
      {props.label && (
        <div className={props.className}>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
            {props.label}
          </label>
          <div className="mt-1">{props.input}</div>
          {props.feedback && (
            <Info
              noColor
              className={props.hasError ? "text-red-400" : "text-blue-400"}
            >
              {props.feedback}
            </Info>
          )}
        </div>
      )}
    </>
  );
};
