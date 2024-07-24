import { Tag } from "@atoms/badge/tag";
import { InputOutlinedDefaultBorders } from "@atoms/styles/inputs";
import { FormControllerType } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { Tags } from "@features/tags/types/types";
import { TagIcon } from "@heroicons/react/20/solid";
import { twMerge } from "tailwind-merge";

export const TagsInput = ({
  value,
  onChange,
  size,
  max,
  disabled,
  ...props
}: {
  size?: "xs" | "sm" | "md";
  ctrl?: FormControllerType<string[] | null | never[]>;
  value?: string[];
  onChange?: (value: string[]) => void;
  max?: number;
  disabled?: boolean;
  "data-tooltip"?: string;
}) => {
  return (
    <RestDocumentsInput
      disabled={disabled}
      className="rounded-full"
      entity={"tags"}
      data-tooltip={props["data-tooltip"]}
      size={size}
      icon={(p: any) => <TagIcon {...p} />}
      ctrl={props.ctrl}
      value={value}
      onChange={onChange as any}
      max={max || 10}
      noWrapper
      render={(tag: Tags) => (
        <Tag
          className={twMerge(InputOutlinedDefaultBorders + " rounded-full")}
          size={size}
          color={tag.color}
        >
          {tag.name}
        </Tag>
      )}
    />
  );
};
