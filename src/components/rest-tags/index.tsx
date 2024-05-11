import { tableToIcons } from "@views/client/settings/fields";
import { ReactNode } from "react";
import { RestCompanyTag } from "./components/company";
import { RestDocumentTag } from "./components/document";
import { RestTag as RestTagTag } from "./components/tag";
import { RestUserTag } from "./components/user";

export const RestTag = ({
  type,
  size,
  id,
  label,
  item,
}: {
  type: "tags" | "users" | "clients" | string;
  size: "md" | "sm";
  id: string;
  label?: string | ReactNode;
  item?: any;
}) => {
  if (type === "tags") {
    return <RestTagTag size={size} id={id} tag={item} />;
  }
  if (type === "users") {
    return <RestUserTag size={size} id={id} user={item} />;
  }
  if (type === "clients") {
    return <RestCompanyTag size={size} id={id} company={item} />;
  }
  return (
    <RestDocumentTag
      size={size}
      label={label || "-"}
      icon={tableToIcons(type)?.icon}
    />
  );
};
