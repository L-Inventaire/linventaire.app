import { CheckIcon } from "@heroicons/react/outline";
import { BaseSmall } from "../text";

export const Checkbox = (props: {
  label?: string;
  onChange?: (status: boolean, e: React.MouseEvent<HTMLInputElement>) => void;
  value?: boolean;
  className?: string;
  disabled?: boolean;
}) => {
  const renderSwitch = () => {
    const className = props.className || "";

    return (
      <div
        className={
          " shrink-0 flex justify-center items-center w-5 h-5 border-2 rounded text-white " +
          (props.value
            ? "border-blue-400 bg-blue-400 hover:border-blue-500 hover:bg-blue-500"
            : "border-slate-300 " +
              (props.disabled ? "" : "hover:border-blue-200")) +
          " " +
          (props.disabled ? "opacity-50" : "cursor-pointer") +
          " " +
          (className || "")
        }
        onClick={(e) =>
          !props.label &&
          !props.disabled &&
          props.onChange &&
          props.onChange(!props.value, e as React.MouseEvent<HTMLInputElement>)
        }
      >
        {props.value && <CheckIcon className="m-icon-small" />}
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
