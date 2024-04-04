import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";

export const ContactsEditPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: "Créer" },
      ]}
    >
      <ContactsDetailsPage readonly={false} id={id === "new" ? "" : id || ""} />
    </Page>
  );
};
