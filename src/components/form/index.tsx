import { Button } from "@atoms/button/button";
import { DynamicGrid } from "@atoms/layout/dynamic-grid";
import Tabs from "@atoms/tabs";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { Fragment, useState } from "react";
import { FormInput } from "./fields";
import { FormReadonly } from "./readonly";
import {
  SearchFormDiplayType,
  SearchFormFieldType,
  ValuesObjectType,
} from "./types";
import { useTranslation } from "react-i18next";

export type FormProps = {
  value: ValuesObjectType;
  onChange: (value: ValuesObjectType) => void;
  fields: SearchFormFieldType[];
  readonly?: boolean;
  original?: ValuesObjectType;
};

export const Form = (props: FormProps) => {
  const change = (key: string, value: any) => {
    props.onChange({
      ...props.value,
      [key]: value,
    });
  };

  return (
    <DynamicGrid className="grid gap-4">
      {(props.fields || []).map((field) =>
        props.readonly ? (
          <FormReadonly
            {...field}
            values={props.value}
            size="md"
            value={props.value[field?.key]}
          />
        ) : (
          <FormInput
            {...field}
            values={props.value}
            size="md"
            value={props.value[field?.key]}
            onChange={(v) => change(field?.key, v)}
            highlight={
              props.original &&
              props.value[field?.key] + "" !== props.original[field?.key] + ""
            }
          />
        )
      )}
    </DynamicGrid>
  );
};

export type FiltersProps = {
  className?: string;
  value: ValuesObjectType;
  onChange: (value: ValuesObjectType & { _advanced?: boolean }) => void;
  onSearch: () => void;
  fields: SearchFormFieldType[];
};

export const SearchForm = (props: FiltersProps) => {
  const { t } = useTranslation();

  const [_advancedFilters, setAdvancedFilters] = useState(
    props.value._advanced
  );
  const advancedValuesChanged = props.fields
    .filter(
      (e) =>
        e.position === "advanced" ||
        (e.position?.split(":")?.[0] &&
          e.position?.split(":")?.[0] ===
            props.fields.find((e) => e.position === "advanced")?.key)
    )
    .some((e) => props.value[e.key]);
  const advancedFilters = _advancedFilters || advancedValuesChanged;

  const display = buildDisplayObject(props.fields);

  const change = (key: string, value: any) => {
    props.onChange({
      ...props.value,
      [key]: value,
    });
  };

  useControlledEffect(() => {
    change("_advanced", advancedFilters);
  }, [advancedFilters]);

  const getFieldProps = (key: string, position?: string) => {
    return props.fields.find((e) => e.key === key)
      ? _.omit(
          props.fields.find(
            (e) => e.key === key && e.position === position
          ) as SearchFormFieldType,
          "key"
        )
      : ({
          label: key,
          type: "text",
        } as SearchFormFieldType);
  };

  const mainKey = (display?.default || []).filter((e) =>
    ["scan", "text"].includes(getFieldProps(e)?.type as string)
  );

  return (
    <>
      <div
        className={
          "flex flex-col space-y-2 md:space-y-0 md:space-x-4 md:flex-row md:items-end " +
          props.className
        }
      >
        {(display?.default || []).length > 3 && (
          <DynamicGrid className="grow grid gap-4 items-end">
            {(display?.default || []).map((key) => (
              <FormInput
                values={props.value}
                highlight
                key={key}
                main={mainKey.join(",") === key}
                {...getFieldProps(key)}
                size="lg"
                value={props.value[key]}
                onChange={(v) => change(key, v)}
                onSearch={() => props.onSearch()}
              />
            ))}
          </DynamicGrid>
        )}
        {(display?.default || []).length <= 3 && (
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row grow md:space-x-4 md:items-end">
            {(display?.default || []).map((key) => (
              <FormInput
                values={props.value}
                highlight
                key={key}
                main={mainKey.join(",") === key}
                {...getFieldProps(key)}
                size="lg"
                value={props.value[key]}
                onChange={(v) => change(key, v)}
                onSearch={() => props.onSearch()}
              />
            ))}
          </div>
        )}

        {mainKey.length !== 1 && (
          <Button
            size="lg"
            className="min-w-fit"
            theme="primary"
            shortcut={["enter"]}
            onClick={() => {
              props.onSearch();
            }}
          >
            {t("general.search.button")}
          </Button>
        )}

        {display?.advanced && (
          <Button
            size="lg"
            theme="outlined"
            disabled={advancedValuesChanged}
            className="shrink-0 max-w-xl"
            onClick={() => setAdvancedFilters(!advancedFilters)}
          >
            {!advancedFilters && (
              <PlusCircleIcon className="h-5 w-5 -ml-2 mr-2" />
            )}
            {!!advancedFilters && (
              <MinusCircleIcon className="h-5 w-5 -ml-2 mr-2" />
            )}
            {!advancedFilters
              ? t("general.search.filters.plus")
              : t("general.search.filters.moins")}
          </Button>
        )}
      </div>

      {!!display?.groups && (
        <>
          <Tabs
            className="mb-1 mt-1"
            value={props?.value[display?.groups?.key!] as string}
            onChange={(v) => change(display?.groups?.key!, v)}
            tabs={(display?.groups?.items || [])?.map((e) => ({
              label: e.label,
              value: e.value,
            }))}
          />
          {(display?.groups?.items || [])?.map((group, i) => (
            <Fragment key={i}>
              {group?.value === props?.value[display?.groups?.key!] && (
                <DynamicGrid className="grid gap-4">
                  {(group.fields || []).map((key) => (
                    <FormInput
                      values={props.value}
                      highlight
                      key={key}
                      {...getFieldProps(
                        key,
                        display?.groups?.key + ":" + group.value
                      )}
                      size="md"
                      value={props.value[key]}
                      onChange={(v) => change(key, v)}
                      onSearch={() => props.onSearch()}
                    />
                  ))}
                </DynamicGrid>
              )}
            </Fragment>
          ))}
        </>
      )}

      {advancedFilters && (
        <div className="p-4 pb-6 bg-wood-100 dark:bg-wood-950 border mt-4 flex flex-col space-y-4">
          {!!display?.advanced?.default?.length && (
            <DynamicGrid className="grid gap-4">
              {(display?.advanced?.default || []).map((key) => (
                <FormInput
                  values={props.value}
                  highlight
                  key={key}
                  {...getFieldProps(key, "advanced")}
                  size="md"
                  value={props.value[key]}
                  onChange={(v) => change(key, v)}
                  onSearch={() => props.onSearch()}
                />
              ))}
            </DynamicGrid>
          )}

          {!!display?.advanced?.groups && (
            <>
              <Tabs
                className="mb-1 -mt-2"
                value={props?.value[display?.advanced?.groups?.key!] as string}
                onChange={(v) => change(display?.advanced?.groups?.key!, v)}
                tabs={(display?.advanced?.groups?.items || [])?.map((e) => ({
                  label: e.label,
                  value: e.value,
                }))}
              />
              {(display?.advanced?.groups?.items || [])?.map((group, i) => (
                <Fragment key={i}>
                  {!!(
                    group?.value ===
                    props?.value[display?.advanced?.groups?.key!]
                  ) && (
                    <DynamicGrid className="grid gap-4">
                      {(group.fields || []).map((key) => (
                        <FormInput
                          values={props.value}
                          highlight
                          key={key}
                          {...getFieldProps(
                            key,
                            display?.advanced?.groups?.key + ":" + group.value
                          )}
                          size="md"
                          value={props.value[key]}
                          onChange={(v) => change(key, v)}
                        />
                      ))}
                    </DynamicGrid>
                  )}
                </Fragment>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
};

const buildDisplayObject = (
  propsFields: SearchFormFieldType[]
): SearchFormDiplayType => {
  const groups = [] as any;
  const fields = propsFields;
  const baseFields = fields.filter((e) => e.position === undefined);
  const baseGroup = groups.filter((e: any) => e.position === undefined)[0];
  const advFields = fields.filter((e: any) => e.position === "advanced");
  const advGroup = groups.filter((e: any) => e.position === "advanced")[0];
  const display: SearchFormDiplayType = {
    default: baseFields?.length ? baseFields.map((e) => e.key) : undefined,
    groups: baseGroup
      ? {
          key: baseGroup.key,
          items: (baseGroup.type === "group"
            ? baseGroup.options
            : undefined || []
          ).map((o: any) => ({
            ...o,
            fields: fields
              .filter((e) => e.position === baseGroup?.key + ":" + o.value)
              .map((e) => e.key),
          })),
        }
      : undefined,
    advanced:
      advFields?.length || advGroup
        ? {
            default: advFields?.length
              ? advFields.map((e) => e.key)
              : undefined,
            groups: advGroup
              ? {
                  key: advGroup.key,
                  items: (advGroup.type === "group"
                    ? advGroup.options
                    : undefined || []
                  ).map((o: any) => ({
                    ...o,
                    fields: fields
                      .filter(
                        (e) => e.position === advGroup?.key + ":" + o.value
                      )
                      .map((e) => e.key),
                  })),
                }
              : undefined,
          }
        : undefined,
  };
  return display;
};
