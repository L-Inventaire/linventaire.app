import { RestEntity } from "@features/utils/rest/types/types";

export type Files = RestEntity & {
  rel_table: string; // Even when not related to anything, this wont be empty string (used in S3 path)
  rel_id: string;
  rel_field: string;
  rel_unreferenced: boolean;

  key: string;
  name: string;
  mime: string;
  size: number;
  has_thumbnail: boolean;
};
