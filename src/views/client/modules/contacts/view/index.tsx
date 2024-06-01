import { Button } from "@atoms/button/button";
import { DocumentBar } from "@components/document-bar";
import { PageLoader } from "@components/page-loader";
import { withModel } from "@components/search-bar/utils/as-model";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";

export const ContactsViewPage = ({ readonly }: { readonly?: boolean }) => {
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
                to={withModel<Invoices>(
                  getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                  {
                    type: "quotes",
                    client: contact?.id,
                  }
                )}
              >
                Créer un devis
              </Button>
              <Button
                size="xs"
                shortcut={["f"]}
                to={withModel<Invoices>(
                  getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                  {
                    type: "invoices",
                    client: contact?.id,
                  }
                )}
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
