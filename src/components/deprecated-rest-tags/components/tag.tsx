import { Tag as TagAtom } from "@atoms/badge/tag";
import { useTags } from "@features/tags/hooks/use-tags";
import { Tags } from "@features/tags/types/types";

export const RestTag = ({
  size,
  id,
  tag,
}: {
  size: "sm" | "md";
  id: string;
  tag?: Tags;
}) => {
  if (tag) {
    return <TagRender size={size} tag={tag} />;
  }
  return <TagServer size={size} id={id} />;
};

const TagServer = ({ size, id }: { size: "sm" | "md"; id: string }) => {
  const { tags } = useTags();
  const tag = (tags.data?.list || []).find((a) => a.id === id);
  return <TagRender size={size} tag={tag} />;
};

const TagRender = ({ size, tag }: { size: "sm" | "md"; tag?: Tags }) => {
  return (
    <TagAtom size={size} color={tag?.color}>
      {tag?.name || "-"}
    </TagAtom>
  );
};
