import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";

export const ContactsViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { contact } = useContact(id || "");
  const navigate = useNavigate();

  if (!contact) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: getContactName(contact || {}) },
      ]}
    >
      <div className="float-right space-x-2">
        <Button
          onClick={async () => navigate(getRoute(ROUTES.ContactsEdit, { id }))}
        >
          Modifier
        </Button>
      </div>
      <Title>{getContactName(contact) || ""}</Title>
      <div className="mt-4" />
      <ContactsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
