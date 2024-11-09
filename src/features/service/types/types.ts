import { RestEntity } from "@features/utils/rest/types/types";

export type ServiceItems = RestEntity & {
  state:
    | "backlog"
    | "todo"
    | "in_progress"
    | "in_review"
    | "done"
    | "cancelled";

  title: string;
  article: string;
  quantity_expected: number; // In hours
  quantity_spent: number; // Precomputed: In hours, computed from service times

  client: string; // The client who has this service or plan to have it
  for_rel_quote: string; // The quote or invoice this service is linked to

  from_rel_original_service_item: string; // Sub tasks

  notes: string;
  documents: string[];
  tags: string[];
  assigned: string[];
};

export type ServiceTimes = RestEntity & {
  service: string;

  description: string;
  quantity: number;
  unit: string;
  date: number;
  assigned: string[];
};
