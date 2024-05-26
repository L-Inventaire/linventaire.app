import { Button } from "@atoms/button/button";
import { InputWithSuggestions } from "@atoms/input/input-with-suggestion";
import { Loader } from "@atoms/loader";
import { Info } from "@atoms/text";
import { RestDocumentTag } from "@components/rest-tags/components/document";
import {
  useRest,
  useRestSchema,
  useRestSuggestions,
} from "@features/utils/rest/hooks/use-rest";
import { tableToIcons } from "@views/client/settings/fields";
import _ from "lodash";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export const RestDocumentsInput = (props: {
  table: string;
  column: string;
  value?: string[] | string | null;
  className?: string;
  theme?: "default" | "primary" | "secondary";
  label?: string;
  size?: "sm" | "md";
  max?: number;
  onChange?: (
    value: string[] | string | null,
    objects: any[] | any | null
  ) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const value: string[] =
    props.max === 1
      ? props.value
        ? [props.value as string]
        : []
      : (props.value as string[]) || [];

  const onChange = (value: string[]) => {
    const objects = [
      ...documents,
      ...(suggestions?.data?.map((a) => a.item) || []),
    ].filter((doc) => value.includes(doc.id));
    props.onChange?.(
      props.max === 1 ? value?.[0] || null : value,
      props.max === 1 ? objects?.[0] || null : objects
    );
  };

  const [focused, setFocused] = useState(false);

  const [query, setQuery] = useState("");
  const schema = useRestSchema(props.table);
  const { suggestions } = useRestSuggestions(props.table, props.column, query);

  const refType = _.get(schema.data, props.column);
  const refTable =
    (typeof refType === "string"
      ? (refType as string)
      : (refType?.[0] as string) || ""
    )
      .split("type:")
      .pop() || props.table;

  const { items, refresh } = useRest<{ id: string; _label: string }>(refTable, {
    query: [
      {
        key: "id",
        values: (value || []).map((value) => ({
          op: "equals",
          value,
        })),
      },
    ],
    key: props.table + "_" + props.column + "_selector",
    limit: (value || []).length || 1,
  });
  const loading = items.isPending;
  const documents = (items?.data?.list || [])?.slice(0, value?.length);

  useEffect(() => {
    refresh();
  }, [JSON.stringify(value)]);

  const size = props.size || "md";

  if (loading) return <Loader />;

  return (
    <div
      className={twMerge(
        props.className,
        (documents.length || !props.disabled) && "-m-1"
      )}
    >
      {documents.map((doc) => (
        <RestDocumentTag
          size={size}
          icon={tableToIcons(refTable)?.icon}
          label={doc._label}
          className={twMerge(
            !props.disabled ? "cursor-pointer inline-flex items-center" : "",
            "m-1 group/rest_document",
            !props.disabled &&
              "hover:opacity-75 active:opacity-50 hover:border-red-500"
          )}
          onClick={() =>
            !props.disabled &&
            onChange?.((value || []).filter((a) => a !== doc.id))
          }
          key={doc.id}
          data-tooltip={!props.disabled ? "Retirer" : undefined}
        />
      ))}
      {props.disabled && !documents.length && <Info>Aucun</Info>}
      {!props.disabled &&
        !focused &&
        (value || []).length < (props.max || 100) && (
          <Button
            className="align-top m-1"
            size="sm"
            theme={props.theme || "default"}
            onClick={() => setFocused(true)}
          >
            {props.label || "+ Ajouter"}
          </Button>
        )}
      {!props.disabled && focused && (
        <>
          <InputWithSuggestions
            placeholder={props.placeholder || "Ajouter un élément"}
            autoFocus
            onBlur={() => setFocused(false)}
            size="sm"
            wrapperClassName="align-top m-1 inline-block w-max"
            className="max-w-24"
            onChange={(e) => setQuery(e.target.value)}
            options={[
              ...(suggestions?.data || [])
                .filter((a) => !(value || []).includes(a.value))
                .map((a) => ({
                  label: a.label as string,
                  value: a.value as string,
                })),
            ]}
            onSelect={async (v: string) => {
              setQuery("");
              onChange?.([
                ...(value || []).slice(0, (props.max || 100) - 1),
                v,
              ]);
            }}
            render={(e) => (
              <RestDocumentTag
                size="md"
                className="-mx-1"
                label={e.label}
                icon={tableToIcons(refTable)?.icon}
              />
            )}
          />
        </>
      )}
    </div>
  );
};
