export type CRMItem = {
  id: string;
  contacts: string[];
  notes: string;
  contact_summaries: ContactSummary[];
  seller: string;
  state: "new" | "qualified" | "proposal" | "won" | "lost";
};

export type ContactSummary = {
  person_first_name: string;
  person_last_name: string;
  business_name: string;
  business_registered_name: string;
};
