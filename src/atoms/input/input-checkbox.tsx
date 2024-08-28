import { CheckIcon } from "@heroicons/react/16/solid";
import { BaseSmall } from "../text";
import { twMerge } from "tailwind-merge";

export const Checkbox = (props: {
  label?: string;
  onChange?: (status: boolean, e: React.MouseEvent<HTMLInputElement>) => void;
  value?: boolean;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}) => {
  const renderSwitch = () => {
    const className = props.className || "";

    return (
      <div
        className={twMerge(
          "overflow-hidden transition-all shrink-0 flex justify-center items-center border rounded text-white " +
            (props.value
              ? "border-slate-400 bg-slate-400 hover:border-slate-500 hover:bg-slate-500"
              : "border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 " +
                (props.disabled
                  ? ""
                  : "hover:border-slate-200 dark:hover:border-slate-600")) +
            " " +
            (props.disabled ? "opacity-50" : "cursor-pointer"),
          className,
          props.size === "sm" ? "w-4 h-4" : "w-5 h-5 "
        )}
        onClick={(e) =>
          !props.label &&
          !props.disabled &&
          props.onChange &&
          props.onChange(!props.value, e as React.MouseEvent<HTMLInputElement>)
        }
      >
        <CheckIcon
          className={twMerge(
            "m-icon-small translate-y-full transition-all",
            props.value && "translate-y-0"
          )}
        />
      </div>
    );
  };

  if (props.label) {
    return (
      <div
        className={"flex flex-row items-center"}
        onClick={(e) => {
          if (!props.disabled) {
            props.onChange &&
              props.onChange(
                !props.value,
                e as React.MouseEvent<HTMLInputElement>
              );
          }
        }}
      >
        {renderSwitch()}
        <BaseSmall
          className={
            "ml-2 shrink-0 " +
            (props.disabled ? "opacity-50" : "cursor-pointer")
          }
        >
          {props.label}
        </BaseSmall>
      </div>
    );
  } else {
    return renderSwitch();
  }
};
