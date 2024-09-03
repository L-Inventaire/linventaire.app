import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Input } from "@atoms/input/input-text";
import { Shortcut } from "@features/utils/shortcuts";
import { MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export const InputCounter = (props: {
  min?: number;
  max?: number;
  confirmOnZero?: boolean;
  deleteIconOnZero?: boolean;
  value: number;
  onChange: (value: number) => void;
  size?: "md" | "lg";
  shortcutAdd?: Shortcut[];
  shortcutRemove?: Shortcut[];
}) => {
  const [value, setValue] = useState(`${props.value}`);

  useEffect(() => {
    setValue(`${props.value}`);
  }, [props.value]);

  const onChange = (value: number) => {
    props.onChange(
      Math.max(
        props.min === undefined ? 0 : props.min,
        Math.min(
          props.max === undefined ? Number.MAX_SAFE_INTEGER : props.max,
          value
        )
      )
    );
  };

  const size = props.size || "md";

  return (
    <div
      className="flex flex-row"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {props.value > 1 || !props.deleteIconOnZero || !props.confirmOnZero ? (
        <Button
          size={size}
          theme={
            props.deleteIconOnZero && `${value}` === "1" ? "danger" : "primary"
          }
          className="shrink-0 z-10"
          icon={(p) =>
            props.deleteIconOnZero && `${value}` === "1" ? (
              <TrashIcon {...p} />
            ) : (
              <MinusIcon {...p} />
            )
          }
          onClick={() => onChange(props.value - 1)}
          shortcut={props.shortcutRemove}
        />
      ) : (
        <ButtonConfirm
          size={size}
          theme={props.deleteIconOnZero ? "danger" : "primary"}
          className="shrink-0 z-10"
          confirmTitle="Suppression d'un article"
          confirmMessage="Voulez-vous supprimer cet article de votre panier ?"
          confirmButtonText="Oui"
          cancelButtonText="Non"
          icon={(p) =>
            props.deleteIconOnZero ? <TrashIcon {...p} /> : <MinusIcon {...p} />
          }
          onClick={() => onChange(props.value - 1)}
          shortcut={props.shortcutRemove}
        />
      )}
      <Input
        size={size}
        className="min-w-[25%] !border-slate-500 !border !border-solid px-0 text-center -mx-px"
        type="number"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onBlur={() => {
          onChange(value ? parseInt(value) : 0);
        }}
      />
      <Button
        size={size}
        className="shrink-0"
        icon={(p) => <PlusIcon {...p} />}
        onClick={() => onChange(props.value + 1)}
        shortcut={props.shortcutAdd}
      />
    </div>
  );
};
