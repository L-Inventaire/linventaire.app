import { Contacts } from "@features/contacts/types/types";

export const prettyContactName = (supplier: Contacts) => {
  return `${supplier.business_name ? supplier.business_name + " - " : ""} ${
    supplier.person_last_name
  } ${supplier.person_first_name}`;
};
