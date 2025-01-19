import { AnimatedHeight } from "@atoms/animated-side/height";
import { Button } from "@atoms/button/button";
import { InputOutlinedDefault } from "@atoms/styles/inputs";
import { Base, Info } from "@atoms/text";
import {
  FormContextContext,
  FormControllerType,
} from "@components/form/formcontext";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { CtrlKRestEntities } from "@features/ctrlk";
import { useCtrlKAsSelect } from "@features/ctrlk/use-ctrlk-as-select";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { useRest } from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import { TrashIcon } from "@heroicons/react/16/solid";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import _ from "lodash";
import { Fragment, ReactNode, useCallback, useContext, useEffect } from "react";
import { twMerge } from "tailwind-merge";

export type RestDocumentProps<T> = {
  className?: string;
  noWrapper?: boolean;
  label?: string;
  placeholder?: string;
  entity: string;
  filter?: Partial<T>;
  queryFn?: (ids: string[]) => Promise<{ total: number; list: T[] }>;
  render?: (value: T, valuesList?: T[]) => ReactNode | JSX.Element;
  renderEmpty?: () => ReactNode | JSX.Element;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  "data-tooltip"?: string;
  icon?: (props: { className: string }, items: T | T[] | null) => ReactNode;
} & (
  | {
      value?: string | null;
      onChange?: (id: string, value: T | null) => void;
      ctrl?: FormControllerType<string | null>;
      onEntityChange?: (value: T | null) => void;
      max?: undefined | false | null;
    }
  | {
      value?: string[] | null | never[];
      onChange?: (id: string[], value: T[]) => void;
      ctrl?: FormControllerType<string[] | null | never[]>;
      onEntityChange?: (value: T[]) => void;
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
    props.disabled === undefined
      ? formContext.disabled || formContext.readonly
      : props.disabled || false;
  const value = props.ctrl?.value || props.value;
  const navigate = useNavigateAlt();

  const { items } = useRest<T>(props.entity, {
    query: buildQueryFromMap({ id: value }),
    limit: _.isArray(value) ? value?.length : value ? 1 : 0,
    queryFn: props.queryFn
      ? () => props.queryFn!(value ? (_.isArray(value) ? value : [value]) : [])
      : undefined,
  });
  const valuesList = items?.data?.list;

  useEffect(() => {
    if (typeof props.max !== "number") {
      props.onEntityChange?.(valuesList?.[0] || null);
    } else {
      props.onEntityChange?.(valuesList || []);
    }
  }, [valuesList]);

  const icon = props.icon
    ? (p: { className: string }) =>
        typeof props.max !== "number"
          ? props.icon!(p, items.data?.list?.[0] || null)
          : props.icon!(p, items.data?.list || [])
    : undefined;

  const archivedTag = () => {
    if (!valuesList?.some((a) => a?.is_deleted)) return null;
    return (
      <div className="absolute top-0 right-0 bg-red-700 text-white text-xs font-bold rounded-tr-md rounded-bl-md px-0.5">
        {valuesList?.length === 1
          ? "Archivé"
          : valuesList?.length + " archivé(s)"}
      </div>
    );
  };

  const onClick = useCallback(
    (e: MouseEvent | any) => {
      if (disabled && !value) return;
      e.preventDefault();
      e.stopPropagation();

      // If ctrl or cmd or middle click then navigate
      if (
        (e.ctrlKey || e.metaKey || e.button === 1) &&
        CtrlKRestEntities?.[props.entity]?.viewRoute &&
        valuesList?.[0]?.id
      ) {
        navigate(
          getRoute(CtrlKRestEntities?.[props.entity]?.viewRoute || "", {
            id: valuesList?.[0]?.id,
          }),
          { event: e }
        );
        return;
      }

      return !disabled
        ? select<T>(
            props.entity,
            props.filter || {},
            (items: T[]) => {
              if (typeof props.max !== "number") {
                const onChange = props.onChange || props.ctrl?.onChange;
                onChange?.(items[0]?.id || "", items[0] || null);
              } else {
                const onChange = props.onChange || props.ctrl?.onChange;
                onChange?.(
                  (items || []).map((a) => a.id),
                  items || []
                );
              }
            },
            props.max || 1,
            valuesList || []
          )
        : !!value
        ? edit(props.entity, _.isArray(value) ? value[0] : value || "")
        : null;
    },
    [valuesList, props.filter, props.entity, props.max, value]
  );

  if (props.noWrapper) {
    if (!value || !value?.length || (!valuesList?.length && items.isFetched)) {
      if (!disabled) {
        return (
          <Button
            theme="invisible"
            icon={icon}
            onClick={onClick}
            className={"m-0 " + props.className}
            size={size}
            readonly={disabled}
            data-tooltip={props["data-tooltip"]}
          />
        );
      } else {
        if (!props.renderEmpty) {
          return <></>;
        }
      }
    }

    return (
      <div
        onClick={onClick}
        className={twMerge(
          "inline-block relative",
          !disabled &&
            "hover:bg-slate-500 hover:bg-opacity-15 bg-opacity-0 transition-all cursor-pointer",
          props.className
        )}
        data-tooltip={props["data-tooltip"]}
      >
        {archivedTag()}
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
            className={"m-0 " + props.className}
            size={size}
            data-tooltip={props["data-tooltip"]}
          />
        )}
      </div>
    );
  }

  if (!items?.data?.list?.length && disabled && !props.renderEmpty)
    return <></>;

  return (
    <div
      onClick={onClick}
      className={twMerge(
        "inline-flex relative min-h-7 w-max relative group/card",
        size === "xl" ? "w-full" : value && "w-72",
        ["xs", "sm", "md"].includes(size) && "w-max max-w-72",
        ["xs", "sm"].includes(size) && "h-6 min-h-6",
        "text-black dark:text-white text-opacity-80",
        InputOutlinedDefault,
        !disabled &&
          "dark:hover:bg-slate-800 hover:bg-gray-100 dark:hover:border-slate-700 dark:active:bg-slate-700 active:bg-gray-200",
        disabled && !value && "opacity-50 border-transparent shadow-none",
        disabled && "shadow-none",
        props.className
      )}
      data-tooltip={props["data-tooltip"]}
    >
      {archivedTag()}
      <div
        className={twMerge(
          "grow inline-flex flex-row items-center",
          (!disabled || value) && "cursor-pointer",
          disabled && !value && "pointer-events-none",
          size === "sm" && "py-0 px-1 space-x-1",
          size === "md" && "py-0.5 px-1.5 space-x-2",
          size === "lg" && "py-1 px-1.5 space-x-1",
          size === "xl" && "p-2 space-x-2"
        )}
      >
        {icon &&
          icon({
            className: twMerge("h-4 w-4 shrink-0"),
          })}
        <div className="flex flex-col grow">
          {!["xs", "sm", "md"].includes(size) && (
            <div className="flex items-center space-x-1 w-full -my-1">
              <div className={twMerge("grow min-h-5")}>
                <Info
                  className={twMerge(
                    "block w-full transition-all",
                    !value && size !== "xl" ? "h-0 opacity-0" : "h-4"
                  )}
                >
                  {props.label}
                </Info>
                <Base
                  className={twMerge(
                    "block w-full transition-all opacity-75",
                    value ? "h-0 opacity-0" : "min-h-5"
                  )}
                >
                  {props.placeholder || props.label || props.entity}
                </Base>
              </div>
              {!disabled && (
                <div>
                  <div className="right-0.5 top-0.5 absolute opacity-0 group-hover/card:opacity-100 transition-all">
                    {value?.[0] &&
                      CtrlKRestEntities[props.entity].renderEditor && (
                        <Button
                          data-tooltip="Éditer"
                          className={twMerge(
                            "w-0 ml-0.5 overflow-hidden",
                            value && "w-5 ml-px transition-all delay-200"
                          )}
                          theme="invisible"
                          size="xs"
                          icon={(p) => <PencilSquareIcon {...p} />}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            edit(
                              props.entity,
                              _.isArray(value) ? value[0] : value || ""
                            );
                          }}
                        />
                      )}
                    {value?.[0] && (
                      <Button
                        data-tooltip="Supprimer"
                        className={twMerge(
                          "text-red-500 dark:text-red-500 w-0 ml-0.5 overflow-hidden",
                          value && "w-5 ml-px transition-all delay-200"
                        )}
                        theme="invisible"
                        size="xs"
                        icon={(p) => <TrashIcon {...p} />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (typeof props.max !== "number") {
                            const onChange =
                              props.onChange || props.ctrl?.onChange;
                            !disabled && onChange?.("", null);
                          } else {
                            const onChange =
                              props.onChange || props.ctrl?.onChange;
                            !disabled && onChange?.([], []);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <AnimatedHeight className={twMerge("pr-1")}>
            {value && !!valuesList?.[0] && (
              <Base
                className={twMerge(
                  "leading-5 block",
                  ["xs", "sm", "md"].includes(size) &&
                    "line-clamp-1 text-ellipsis"
                )}
              >
                {props.render
                  ? props.render(valuesList[0], valuesList)
                  : (valuesList[0] as any)._label}
              </Base>
            )}
            {value && !valuesList?.[0] && !!props.renderEmpty && (
              <Base
                className={twMerge(
                  "leading-5 block",
                  ["xs", "sm", "md"].includes(size) &&
                    "line-clamp-1 text-ellipsis"
                )}
              >
                {props.renderEmpty?.()}
              </Base>
            )}
          </AnimatedHeight>
        </div>
      </div>
    </div>
  );
};
