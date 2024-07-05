import { Button } from "@atoms/button/button";
import {
  InputOutlinedDefault,
  InputOutlinedHighlight,
} from "@atoms/styles/inputs";
import { Base, Info } from "@atoms/text";
import { AnimatedHeight } from "@components/animated-side/height";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useCtrlKAsSelect } from "@features/ctrlk/use-ctrlk-as-select";
import { useRest } from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import { TrashIcon } from "@heroicons/react/16/solid";
import _ from "lodash";
import { ReactNode, useEffect } from "react";
import { twMerge } from "tailwind-merge";

type RestDocumentProps<T> = {
  label?: string;
  placeholder?: string;
  entity: string;
  filter?: Partial<T>;
  icon?: (props: { className: string }) => ReactNode;
  render?: (value: T) => ReactNode | JSX.Element;
  size?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
} & (
  | {
      value?: string | null;
      onEntityChange?: (value: T | null) => void;
      onChange?: (id: string, value: T | null) => void;
      max?: undefined | false | null;
    }
  | {
      value?: string[] | null | never[];
      onEntityChange?: (value: T[]) => void;
      onChange?: (id: string[], value: T[]) => void;
      max: number;
    }
);

export const RestDocumentsInput = <T extends RestEntity>(
  props: RestDocumentProps<T>
) => {
  const select = useCtrlKAsSelect();
  const size = props.size || "sm";

  const { items } = useRest<T>(props.entity, {
    query: buildQueryFromMap({ id: props.value }),
    limit: _.isArray(props.value) ? props.max || 1 : 1,
  });
  const valuesList = items?.data?.list;

  useEffect(() => {
    if (typeof props.max !== "number") {
      props.onEntityChange?.(valuesList?.[0] || null);
    } else {
      props.onEntityChange?.(valuesList || []);
    }
  }, [valuesList]);

  const onClick = () =>
    !props.disabled &&
    select<T>(
      props.entity,
      props.filter || {},
      (items: T[]) => {
        if (typeof props.max !== "number") {
          props.onChange?.(items[0]?.id || "", items[0] || null);
        } else {
          props.onChange?.(
            (items || []).map((a) => a.id),
            items || []
          );
        }
      },
      props.max || 1
    );

  if (size === "xs" && !props.value) {
    return <Button theme="invisible" icon={props.icon} onClick={onClick} />;
  }

  return (
    <div
      onClick={onClick}
      className={twMerge(
        "inline-flex min-h-7 w-max",
        size === "lg" ? "w-full" : props.value && "w-72",
        "text-black dark:text-white text-opacity-80",
        InputOutlinedDefault,
        !props.disabled &&
          "dark:hover:bg-slate-800 hover:bg-gray-100 dark:hover:border-slate-700 dark:active:bg-slate-700 active:bg-gray-200",
        !!props.value && InputOutlinedHighlight
      )}
    >
      <div
        className={twMerge(
          "grow inline-flex flex-row items-center",
          !props.disabled && "cursor-pointer",
          size === "sm" && "py-1 px-1.5 space-x-1",
          size === "md" && "p-2 space-x-2",
          size === "lg" && "p-2 space-x-2"
        )}
      >
        {props.icon &&
          props.icon({
            className: twMerge("h-4 w-4 opacity-90 shrink-0"),
          })}
        <div className="flex flex-col grow">
          <div className="flex items-center space-x-1 w-full -my-1">
            <div className={twMerge("grow")}>
              <Info
                className={twMerge(
                  "block w-full transition-all",
                  !props.value && size !== "lg" ? "h-0 opacity-0" : "h-4"
                )}
              >
                {props.label}
              </Info>
              <Base
                className={twMerge(
                  "block w-full transition-all opacity-75",
                  props.value ? "h-0 opacity-0" : "min-h-5"
                )}
              >
                {props.placeholder || props.label || props.entity}
              </Base>
            </div>
            {!props.disabled && (
              <div>
                <div className="-mr-0.5 mt-0.5">
                  <Button
                    data-tooltip="Supprimer"
                    className={twMerge(
                      "text-red-500 dark:text-red-500 w-0 ml-0.5 overflow-hidden",
                      props.value && "w-6 ml-0.5 transition-all delay-200"
                    )}
                    theme="invisible"
                    size="xs"
                    icon={(p) => <TrashIcon {...p} />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof props.max !== "number") {
                        !props.disabled && props.onChange?.("", null);
                      } else {
                        !props.disabled && props.onChange?.([], []);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <AnimatedHeight className="pr-4">
            {props.value && !!valuesList?.[0] && (
              <Base className="leading-5 block">
                {props.render
                  ? props.render(valuesList[0])
                  : (valuesList[0] as any)._label}
              </Base>
            )}
          </AnimatedHeight>
        </div>
      </div>
    </div>
  );
};
