export type CMSItem = {
  id: string;
  contacts: string[];
  notes: string;
  contact_summaries: ContactSummary[];
  seller: string;
  prev: string | null;
  next: string | null;
  state: "new" | "qualified" | "proposal" | "won" | "lost";
};

export type ContactSummary = {
  person_first_name: string;
  person_last_name: string;
  business_name: string;
  business_registered_name: string;
};
