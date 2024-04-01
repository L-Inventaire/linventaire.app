import { twMerge } from "tailwind-merge";
import { InputDecorationIcon } from "./input-decoration-icon";
import { Input, defaultInputClassName } from "./input-text";
import { RefreshIcon } from "@heroicons/react/solid";
import { useEffect } from "react";

const getRandom = () => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

export default function InputColor(props: {
  disabled?: boolean;
  value: string;
  size: "sm" | "md" | "lg";
  onChange: (phone: string) => void;
}) {
  useEffect(() => {
    if (!props.value) {
      props.onChange(getRandom());
    } else {
      if (!props.value.startsWith("#")) {
        props.onChange("#" + props.value.toUpperCase());
      } else {
        props.value.toUpperCase();
      }
    }
  }, [props.value]);

  return (
    <InputDecorationIcon
      suffix={(p) => (
        <div
          className={twMerge(
            p.className,
            "rounded-full bg-slate-500 cursor-pointer flex items-center justify-center"
          )}
          style={{
            backgroundColor: props.value,
          }}
          onClick={() => props.onChange(getRandom())}
        >
          <RefreshIcon className="w-3 h-3 text-white" />
        </div>
      )}
      input={(p) => (
        <Input
          {...p}
          disabled={props.disabled}
          className={
            defaultInputClassName() +
            " shadow-sm bg-white rounded-md border overflow-hidden pl-3"
          }
          onChange={(e) => props.onChange(e.target.value)}
          value={props.value}
          placeholder="#000000"
        />
      )}
    />
  );
}
