import { RestEntity } from "@features/utils/rest/types/types";

export type Tags = RestEntity & {
  client_id: string;
  id: string;
  name: string;
  color: string;
  description?: string;
};

/** Tooltip of a tag: its name, and its description when there is one */
export const getTagTooltip = (tag?: Partial<Tags>) =>
  [tag?.name, tag?.description].filter(Boolean).join(" — ");
