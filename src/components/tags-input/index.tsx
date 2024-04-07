import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { InputWithSuggestions } from "@atoms/input/input-with-suggestion";
import { Loader } from "@atoms/loader";
import { Info } from "@atoms/text";
import { useHasAccess } from "@features/access";
import { useTags } from "@features/tags/hooks/use-tags";
import { getRandomHexColor } from "@features/utils/format/strings";
import { TrashIcon } from "@heroicons/react/outline";
import _ from "lodash";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const TagsInput = (props: {
  value: string[];
  className?: string;
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

  if (tags.isPending) return <Loader />;

  return (
    <div className={twMerge(props.className, "space-x-2")}>
      {selectedTags.map((tag) => (
        <Tag
          color={tag.color || "#000000"}
          className={
            !props.disabled ? "cursor-pointer inline-flex items-center" : ""
          }
          onClick={() =>
            !props.disabled &&
            props.onChange?.(props.value.filter((a) => a !== tag.id))
          }
          key={tag.id}
        >
          {!props.disabled && <TrashIcon className="w-3 h-3 mr-2" />}
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
                props.onChange?.([...props.value, tag.id]);
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
                <>
                  Ajouter{" "}
                  <Tag className="ml-1" color={nextColor}>
                    {e.value}
                  </Tag>
                </>
              )
            }
          />
        </>
      )}
    </div>
  );
};
