import { InputLabel } from "@atoms/input/input-decoration-label";
import Link from "@atoms/link";
import { Base, BaseSmall, Info } from "@atoms/text";
import { formatTime } from "@features/utils/format/dates";
import { formatAmount } from "@features/utils/format/strings";
import { memo } from "react";
import { SearchFormFieldType } from "./types";
import { TagsInput } from "@components/input-rest/tags";
import InputPhone from "@atoms/input/input-phone";
import { UsersInput } from "@components/deprecated-users-input";
import { FilesInput } from "@components/input-rest/files";
import { RestDocumentsInput } from "@components/input-rest";

export const FormReadonly = memo(
  (
    props: Omit<SearchFormFieldType, "key"> & {
      size: "md" | "sm" | "lg";
      value:
        | string
        | number
        | true
        | Date
        | string[]
        | { label: string; value: string };
      values: any;
    }
  ) => {
    if (!props.value && !props.alwaysVisible) return <></>;

    if (!props.value && props.alwaysVisible)
      return (
        <InputLabel
          className="select-text"
          labelClassName="opacity-50"
          label={props.label || ""}
          input={<Info className="whitespace-nowrap">-</Info>}
        />
      );

    return (
      <InputLabel
        className="select-text"
        labelClassName="opacity-50"
        label={props.label || ""}
        input={
          <>
            {(!props.type ||
              props.type === "text" ||
              props.type === "scan" ||
              props.type === "number") && (
              <Base>
                {props.render?.(props.value, props.values) ||
                  (props.value as string)}
              </Base>
            )}
            {props.type === "tags" && (
              <TagsInput
                value={(props.value as string[]) || []}
                disabled={true}
              />
            )}
            {props.type === "users" && (
              <UsersInput
                className="w-full"
                value={(props.value as string[]) || []}
                disabled={true}
              />
            )}
            {props.type === "files" && (
              <FilesInput
                className="w-full"
                value={(props.value as string[]) || []}
                disabled={true}
              />
            )}
            {props.type === "rest_documents" && (
              <RestDocumentsInput
                value={(props.value as string[]) || []}
                disabled={true}
                max={props.max || 1}
                entity={props.rest?.table || ""}
              />
            )}
            {props.type === "phone" && (
              <InputPhone
                value={(props.value as string) || ""}
                readonly={true}
              />
            )}
            {props.type === "date" && (
              <Base className="whitespace-nowrap">
                {props.render?.(props.value, props.values) ||
                  formatTime(props.value as string, {
                    keepTime: false,
                    keepSeconds: false,
                    keepDate: true,
                    hideTime: true,
                  })}
              </Base>
            )}
            {props.type === "modal" && (
              <BaseSmall>
                <Link
                  className="cursor-pointer flex items-center underline"
                  onClick={() => {
                    props.onClick &&
                      props.onClick({ readonly: true, values: props.values });
                  }}
                >
                  {props.render?.(props.value, props.values) ||
                    (props.value as string)}
                </Link>
              </BaseSmall>
            )}
            {(props.type === "boolean" || props.type === "select_boolean") && (
              <Base>
                {props.render?.(props.value, props.values) || props.value
                  ? "OUI"
                  : "NON"}
              </Base>
            )}
            {props.type === "formatted" && props.format === "price" && (
              <Base>
                {props.render?.(props.value, props.values) ||
                  formatAmount(parseFloat(props.value as string))}
              </Base>
            )}
            {props.type === "formatted" && props.format === "percentage" && (
              <Base>
                {props.render?.(props.value, props.values) ||
                  parseFloat(props.value as string).toFixed(2)}{" "}
                %
              </Base>
            )}

            {props.type === "formatted" && props.format === "mail" && (
              <Link href={`mailto:${props.value}`}>
                {props.render?.(props.value, props.values) ||
                  (props.value as string)}{" "}
              </Link>
            )}

            {props.type === "formatted" && props.format === "phone" && (
              <Link href={`tel:${props.value}`}>
                {props.render?.(props.value, props.values) ||
                  (props.value as string)}{" "}
              </Link>
            )}
            {(props.type === "multiselect" ||
              props.type === "select" ||
              props.type === "searchselect") && (
              <Base>
                {(() => {
                  return false;
                })()}
                {props.render?.(props.value, props.values) ||
                  (
                    (typeof props.options === "object" ? props.options : []) ||
                    []
                  ).find((v) => v.value === props.value)?.label ||
                  (props.value as string)}
              </Base>
            )}
          </>
        }
      />
    );
  }
);
