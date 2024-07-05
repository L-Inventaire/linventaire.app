import { Tag } from "@atoms/badge/tag";
import { InputOutlinedDefault } from "@atoms/styles/inputs";
import { RestDocumentsInput } from "@components/rest-documents-input";
import { useTags } from "@features/tags/hooks/use-tags";
import { Tags } from "@features/tags/types/types";
import { TagIcon } from "@heroicons/react/24/solid";
import _ from "lodash";
import { twMerge } from "tailwind-merge";

export const TagsInput = (props: {
  value: string[];
  className?: string;
  max?: number;
  size?: "xs" | "sm" | "md";
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  hideEmpty?: boolean;
}) => {
  const { tags, create } = useTags();
  const selectedTags = _.sortBy(
    (tags.data?.list || []).filter((tag) =>
      (props.value || []).includes(tag.id)
    ),
    "name"
  );

  const onChange = (ids: string[], value: Tags[]) => {
    if (value) {
      props.onChange?.(_.uniq([...(props.value || []), ...ids]));
    }
  };

  const size = props.size || "sm";

  return (
    <>
      {!props.value?.length && (
        <RestDocumentsInput
          entity={"tags"}
          size="xs"
          icon={(p) => <TagIcon {...p} />}
          onChange={onChange as any}
          max={6}
        />
      )}
      {!!props.value?.length && (
        <div className="inline-block">
          {selectedTags.map((tag, i) =>
            i !== selectedTags.length - 1 ? (
              <div
                className={twMerge(
                  "inline-block overflow-visible w-8",
                  size === "xs" && "-mr-3",
                  size === "sm" && "-mr-2",
                  size === "md" && "-mr-2"
                )}
              >
                <Tag
                  className={InputOutlinedDefault + " cursor-pointer"}
                  size={size}
                  color={tag.color}
                >
                  {tag.name}
                </Tag>
              </div>
            ) : (
              <Tag
                className={InputOutlinedDefault + " cursor-pointer"}
                size={size}
                color={tag.color}
              >
                {tag.name}
              </Tag>
            )
          )}
        </div>
      )}
    </>
  );
};
