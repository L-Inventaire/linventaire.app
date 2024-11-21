import { AnimatedHeight } from "@atoms/animated-side/height";
import { Button, ButtonProps } from "@atoms/button/button";
import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { Input } from "@atoms/input/input-text";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Info } from "@atoms/text";
import {
  FormContextContext,
  FormControllerType,
} from "@components/form/formcontext";
import _ from "lodash";
import { ReactNode, useContext, useEffect, useRef } from "react";
import { atomFamily, useRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

export type InputButtonProps<T> = Omit<
  ButtonProps,
  "onChange" | "content" | "value"
> & {
  btnKey?: string;
  ctrl?: FormControllerType<string[] | null | never[]>;
  value?: T | any;
  onChange?: (value: T) => void;
  placeholder?: string;
  empty?: string;
  label?: string;
  content?: ({ close }: { close: () => void }) => ReactNode | JSX.Element;
  autoFocus?: boolean;
};

export const InputButtonIsOpenAtom = atomFamily<boolean, string>({
  key: "InputButtonIsOpenAtom",
  default: false,
});

export const InputButton = <T,>(props: InputButtonProps<T>) => {
  const key = useRef(props.btnKey || _.uniqueId());
  const [open, setOpen] = useRecoilState(InputButtonIsOpenAtom(key?.current));
  const formContext = useContext(FormContextContext);
  const disabled =
    props.disabled || formContext.disabled || formContext.readonly || false;

  const value = props.ctrl?.value || props.value;
  const onChange = props.ctrl?.onChange || props.onChange;

  useEffect(() => {
    if (props.autoFocus) setOpen(true);
  }, []);

  if (props.readonly || formContext.readonly) {
    return (
      <div
        className={twMerge(
          "h-max whitespace-normal py-0.5 text-opacity-100 text-black dark:text-white flex items-center",
          props.className
        )}
      >
        {props.icon && props.icon({ className: "mr-2 w-4 h-4 shrink-0" })}
        {props.value !== "" && (
          <AnimatedHeight>
            {!value && (
              <Info>{props.empty || props.label || props.placeholder}</Info>
            )}
            {!!value && (props.children || value)}
          </AnimatedHeight>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        theme="outlined"
        {..._.omit(
          props,
          "value",
          "onChange",
          "placeholder",
          "onClick",
          "label",
          "readonly",
          "content"
        )}
        onClick={() => {
          setOpen(true);
        }}
        readonly={disabled}
        className={twMerge(
          "h-max whitespace-normal py-[5.5px] text-opacity-100 cursor-pointer",
          props.className
        )}
      >
        {props.value !== "" && (
          <AnimatedHeight>
            {!value && (
              <Info>{props.empty || props.label || props.placeholder}</Info>
            )}
            {!!value && (props.children || value)}
          </AnimatedHeight>
        )}
      </Button>
      {!disabled && (
        <Modal open={open} closable onClose={() => setOpen(false)}>
          <ModalContent title={props.label || props.placeholder}>
            {props.content?.({
              close: () => setOpen(false),
            }) || (
              <InputDecorationIcon
                prefix={props.icon as any}
                input={(p) => (
                  <Input
                    {...p}
                    placeholder={props.placeholder}
                    autoFocus
                    autoSelect
                    value={value}
                    onChange={(e) => {
                      if (onChange) onChange(e.target.value as any);
                    }}
                  />
                )}
              />
            )}
            <div className="flex justify-end">
              <Button
                size="md"
                className="mt-4"
                onClick={() => setOpen(false)}
                shortcut={["esc", "enter"]}
              >
                Fermer
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
