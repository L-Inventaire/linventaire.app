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
  icon?: (p: { className: string }) => React.ReactNode;
}) => {
  const renderSwitch = () => {
    const className = props.className || "";

    return (
      <div
        className={twMerge(
          "overflow-hidden transition-all shrink-0 flex justify-center items-center border rounded text-white " +
            (props.value
              ? "border-blue-600 bg-blue-600 hover:border-blue-500 hover:bg-blue-500"
              : "border-blue-200 bg-blue-50 dark:bg-blue-800 dark:border-blue-700 " +
                (props.disabled
                  ? ""
                  : "hover:border-slate-200 dark:hover:border-slate-600")) +
            " " +
            (props.disabled ? "opacity-50" : "cursor-pointer"),
          className,
          props.size === "sm" ? "w-4 h-4" : "w-5 h-5 "
        )}
        onClick={(e) =>
          !props.disabled &&
          props.onChange &&
          props.onChange(!props.value, e as React.MouseEvent<HTMLInputElement>)
        }
      >
        {!props.icon && (
          <CheckIcon
            className={twMerge(
              "m-icon-small translate-y-full transition-all",
              props.value && "translate-y-0"
            )}
          />
        )}
        {!!props.icon &&
          props.icon({
            className: twMerge(
              "w-4 h-4 translate-y-full transition-all",
              props.value && "translate-y-0"
            ),
          })}
      </div>
    );
  };

  if (props.label) {
    return (
      <div className={"flex flex-row items-center"}>
        {renderSwitch()}
        <BaseSmall
          className={
            "ml-2 shrink-0 " +
            (props.disabled ? "opacity-50" : "cursor-pointer")
          }
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
          {props.label}
        </BaseSmall>
      </div>
    );
  } else {
    return renderSwitch();
  }
};
