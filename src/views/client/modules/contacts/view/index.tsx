import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";

export const ContactsViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { contact } = useContact(id || "");

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: getContactName(contact || {}) },
      ]}
    >
      <ContactsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
