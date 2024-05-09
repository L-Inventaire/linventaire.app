import { Button } from "@atoms/button/button";
import { InputWithSuggestions } from "@atoms/input/input-with-suggestion";
import { Loader } from "@atoms/loader";
import { Info } from "@atoms/text";
import { RestDocumentTag } from "@components/rest-tags/components/document";
import {
  useRest,
  useRestSuggestions,
} from "@features/utils/rest/hooks/use-rest";
import { tableToIcons } from "@views/client/settings/fields";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export const RestDocumentsInput = (props: {
  table: string;
  column: string;
  value: string[];
  className?: string;
  theme?: "default" | "primary" | "secondary";
  label?: string;
  size?: "sm" | "md";
  max?: number;
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [focused, setFocused] = useState(false);

  const [query, setQuery] = useState("");
  const { suggestions } = useRestSuggestions(props.table, props.column, query);

  const { items, refresh } = useRest<{ id: string; _label: string }>(
    props.table,
    {
      query: [
        {
          key: "id",
          values: (props.value || []).map((value) => ({
            op: "equals",
            value,
          })),
        },
      ],
      key: props.table + "_" + props.column + "_selector",
      limit: props.value.length || 1,
    }
  );
  const loading = items.isPending;
  const documents = (items?.data?.list || [])?.slice(0, props.value?.length);

  useEffect(() => {
    refresh();
  }, [props.value]);

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
          icon={tableToIcons(props.table)?.icon}
          label={doc._label}
          className={twMerge(
            !props.disabled ? "cursor-pointer inline-flex items-center" : "",
            "m-1 group/rest_document",
            !props.disabled &&
              "hover:opacity-75 active:opacity-50 hover:border-red-500"
          )}
          onClick={() =>
            !props.disabled &&
            props.onChange?.(props.value.filter((a) => a !== doc.id))
          }
          key={doc.id}
          dataTooltip={!props.disabled ? "Retirer" : undefined}
        />
      ))}
      {props.disabled && !documents.length && <Info>Aucun</Info>}
      {!props.disabled &&
        !focused &&
        props.value?.length < (props.max || 100) && (
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            options={[
              ...(suggestions?.data || [])
                .filter((a) => !props.value.includes(a.value))
                .map((a) => ({
                  label: a.label as string,
                  value: a.value as string,
                })),
            ]}
            onSelect={async (value: string) => {
              props.onChange?.([
                ...props.value.slice(0, (props.max || 100) - 1),
                value,
              ]);
            }}
            render={(e) => (
              <RestDocumentTag
                size="md"
                className="-mx-1"
                label={e.label}
                icon={tableToIcons(props.table)?.icon}
              />
            )}
          />
        </>
      )}
    </div>
  );
};
