import { AnimatedHeight } from "@atoms/animated-side/height";
import { Button } from "@atoms/button/button";
import { InputOutlinedDefault } from "@atoms/styles/inputs";
import { Base, Info } from "@atoms/text";
import { FormContextContext } from "@components/form/formcontext";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { CtrlKRestEntities } from "@features/ctrlk";
import { useCtrlKAsSelect } from "@features/ctrlk/use-ctrlk-as-select";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { useRest } from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import { TrashIcon } from "@heroicons/react/16/solid";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import _ from "lodash";
import { Fragment, ReactNode, useContext, useEffect } from "react";
import { twMerge } from "tailwind-merge";

type RestDocumentProps<T> = {
  className?: string;
  noWrapper?: boolean;
  label?: string;
  placeholder?: string;
  entity: string;
  filter?: Partial<T>;
  queryFn?: (query: string) => Promise<{ total: number; list: T[] }>;
  icon?: (props: { className: string }) => ReactNode;
  render?: (value: T) => ReactNode | JSX.Element;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  "data-tooltip"?: string;
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
  const formContext = useContext(FormContextContext);
  const select = useCtrlKAsSelect();
  const edit = useEditFromCtrlK();
  const size = props.size || "md";
  const disabled =
    props.disabled || formContext.disabled || formContext.readonly || false;

  const { items } = useRest<T>(props.entity, {
    query: buildQueryFromMap({ id: props.value }),
    limit: _.isArray(props.value) ? props.value?.length : props.value ? 1 : 0,
    queryFn: props.queryFn ? () => props.queryFn!("") : undefined,
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
    !disabled &&
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

  if (props.noWrapper) {
    if (!props.value || !props.value?.length) {
      if (disabled) return <></>;

      return (
        <Button
          theme="invisible"
          icon={props.icon}
          onClick={onClick}
          className={props.className}
          size={size}
          {...[props["data-tooltip"]]}
        />
      );
    }

    return (
      <div
        onClick={onClick}
        className={twMerge(
          "inline-block",
          !disabled &&
            "hover:bg-slate-500 hover:bg-opacity-15 bg-opacity-0 transition-all cursor-pointer",
          props.className
        )}
      >
        <div
          className={twMerge(
            "-space-x-2 inline-block",
            (props.max || 1) > 1 && !disabled && "mr-1"
          )}
        >
          {(valuesList || []).map((value, i) => (
            <Fragment key={i}>
              {props.render ? props.render(value) : (valuesList as any)._label}
            </Fragment>
          ))}
        </div>
        {(props.max || 1) > 1 && !disabled && (
          <Button
            theme="invisible"
            icon={(p) => <PlusIcon {...p} />}
            onClick={onClick}
            className={props.className}
            size={size}
            {...[props["data-tooltip"]]}
          />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={twMerge(
        "inline-flex min-h-7 w-max relative group/card",
        size === "xl" ? "w-full" : props.value && "w-72",
        "text-black dark:text-white text-opacity-80",
        InputOutlinedDefault,
        !disabled &&
          "dark:hover:bg-slate-800 hover:bg-gray-100 dark:hover:border-slate-700 dark:active:bg-slate-700 active:bg-gray-200",
        disabled && !props.value && "opacity-50 border-transparent shadow-none",
        props.className
      )}
    >
      <div
        className={twMerge(
          "grow inline-flex flex-row items-center",
          !disabled && "cursor-pointer",
          size === "md" && "py-0.5 px-1.5 space-x-2",
          size === "lg" && "py-1 px-1.5 space-x-1",
          size === "xl" && "p-2 space-x-2"
        )}
      >
        {props.icon &&
          props.icon({
            className: twMerge("h-4 w-4 shrink-0"),
          })}
        <div className="flex flex-col grow">
          <div className="flex items-center space-x-1 w-full -my-1">
            <div className={twMerge("grow min-h-5")}>
              <Info
                className={twMerge(
                  "block w-full transition-all",
                  !props.value && size !== "xl" ? "h-0 opacity-0" : "h-4"
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
            {!disabled && (
              <div>
                <div className="right-0.5 top-0.5 absolute opacity-0 group-hover/card:opacity-100 transition-all">
                  {props.value?.[0] &&
                    CtrlKRestEntities[props.entity].renderEditor && (
                      <Button
                        data-tooltip="Éditer"
                        className={twMerge(
                          "w-0 ml-0.5 overflow-hidden",
                          props.value && "w-5 ml-px transition-all delay-200"
                        )}
                        theme="invisible"
                        size="xs"
                        icon={(p) => <PencilSquareIcon {...p} />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          edit(
                            props.entity,
                            _.isArray(props.value)
                              ? props.value[0]
                              : props.value || ""
                          );
                        }}
                      />
                    )}
                  <Button
                    data-tooltip="Supprimer"
                    className={twMerge(
                      "text-red-500 dark:text-red-500 w-0 ml-0.5 overflow-hidden",
                      props.value && "w-5 ml-px transition-all delay-200"
                    )}
                    theme="invisible"
                    size="xs"
                    icon={(p) => <TrashIcon {...p} />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof props.max !== "number") {
                        !disabled && props.onChange?.("", null);
                      } else {
                        !disabled && props.onChange?.([], []);
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
