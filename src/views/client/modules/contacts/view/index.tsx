import { DocumentBar } from "@components/document-bar";
import { PageLoader } from "@components/page-loader";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";
import { Button } from "@atoms/button/button";

export const ContactsViewPage = ({ readonly }: { readonly?: boolean }) => {
  const navigate = useNavigate();

  const { id } = useParams();
  const { contact } = useContact(id || "");

  if (!contact) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: getContactName(contact || {}) },
      ]}
      bar={
        <DocumentBar
          document={{ id }}
          mode={"read"}
          backRoute={ROUTES.Contacts}
          editRoute={ROUTES.ContactsEdit}
          suffix={
            <>
              <Button
                theme="outlined"
                size="xs"
                shortcut={["d"]}
                onClick={async () =>
                  navigate(getRoute(ROUTES.ContactsEdit || "", { id }))
                }
              >
                Créer un devis
              </Button>
              <Button
                size="xs"
                shortcut={["f"]}
                onClick={async () =>
                  navigate(getRoute(ROUTES.ContactsEdit || "", { id }))
                }
              >
                Créer une facture
              </Button>
            </>
          }
        />
      }
    >
      <ContactsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
