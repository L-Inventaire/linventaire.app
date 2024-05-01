import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { InputWithSuggestions } from "@atoms/input/input-with-suggestion";
import { Loader } from "@atoms/loader";
import { Info } from "@atoms/text";
import { useHasAccess } from "@features/access";
import { useTags } from "@features/tags/hooks/use-tags";
import { getRandomHexColor } from "@features/utils/format/strings";
import { TagIcon, TrashIcon } from "@heroicons/react/solid";
import _ from "lodash";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const TagsInput = (props: {
  value: string[];
  className?: string;
  max?: number;
  size?: "sm" | "md";
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const hasAccess = useHasAccess();
  const [nextColor, setNextColor] = useState(getRandomHexColor());
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const { tags, create } = useTags();
  const selectedTags = _.sortBy(
    (tags.data?.list || []).filter((tag) => props.value.includes(tag.id)),
    "name"
  );

  const size = props.size || "md";

  if (tags.isPending) return <Loader />;

  return (
    <div className={twMerge(props.className, selectedTags.length && "-m-1")}>
      {selectedTags.map((tag) => (
        <Tag
          size={size}
          color={tag.color || "#000000"}
          className={twMerge(
            !props.disabled ? "cursor-pointer inline-flex items-center" : "",
            "m-1 group/tag",
            !props.disabled &&
              "hover:opacity-75 active:opacity-50 hover:border-red-500"
          )}
          onClick={() =>
            !props.disabled &&
            props.onChange?.(props.value.filter((a) => a !== tag.id))
          }
          icon={
            !props.disabled ? (
              <div className="w-3 h-3 relative mr-1 overflow-hidden shrink-0">
                <TrashIcon className="w-3 h-3 absolute group-hover/tag:translate-y-0 -translate-y-full transition-all" />
                <TagIcon className="w-3 h-3 absolute group-hover/tag:translate-y-full translate-y-0 transition-all" />
              </div>
            ) : undefined
          }
          key={tag.id}
          dataTooltip={!props.disabled ? "Retirer l'étiquette" : undefined}
        >
          {tag.name}
        </Tag>
      ))}
      {props.disabled && !selectedTags.length && <Info>Aucune étiquette</Info>}
      {!props.disabled && !focused && (
        <Button size="sm" theme="invisible" onClick={() => setFocused(true)}>
          + Ajouter
        </Button>
      )}
      {!props.disabled && focused && (
        <>
          <InputWithSuggestions
            placeholder="Ajouter une étiquette"
            autoFocus
            onBlur={() => setFocused(false)}
            size="sm"
            wrapperClassName="inline-block w-max"
            className="max-w-24"
            onChange={(e) => setSearch(e.target.value)}
            options={[
              ...(tags.data?.list || [])
                .filter((a) => !props.value.includes(a.id))
                .map((a) => ({
                  label: a.name,
                  value: a.id,
                })),
              ...(hasAccess("TAGS_MANAGE")
                ? [{ value: search, label: search }]
                : []),
            ]}
            onSelect={async (value: string) => {
              const tag = (tags.data?.list || [])?.find((a) => a.id === value);
              if (tag) {
                props.onChange?.([
                  ...props.value.slice(0, props.max || 100),
                  tag.id,
                ]);
              } else {
                setFocused(false);
                //Add the new tag
                setNextColor(getRandomHexColor());
                const tag = await create.mutateAsync({
                  name: value,
                  color: nextColor,
                });
                props.onChange?.([...props.value, tag.id]);
              }
            }}
            render={(e) =>
              (tags.data?.list || [])?.find((a) => a.id === e.value) ? (
                <Tag
                  className="-mx-1"
                  color={
                    (tags.data?.list || [])?.find((a) => a.id === e.value)
                      ?.color || "#000000"
                  }
                >
                  {e.label}
                </Tag>
              ) : (
                <div className="flex w-full items-center overflow-hidden">
                  <span className="shrink-0">Ajouter </span>
                  <span className="grow relative">
                    <Tag className="ml-1" color={nextColor}>
                      {e.value}
                    </Tag>
                  </span>
                </div>
              )
            }
          />
        </>
      )}
    </div>
  );
};
