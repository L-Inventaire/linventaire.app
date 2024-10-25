import { Button } from "@atoms/button/button";
import { DocumentBar } from "@components/document-bar";
import { withModel } from "@components/search-bar/utils/as-model";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";

export const ContactsViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParams();
  const { contact, isPending, remove, restore } = useContact(id || "");

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: getContactName(contact || {}) },
      ]}
      bar={
        <DocumentBar
          loading={isPending && !contact}
          entity={"contacts"}
          document={contact || { id }}
          mode={"read"}
          backRoute={ROUTES.Contacts}
          editRoute={ROUTES.ContactsEdit}
          viewRoute={ROUTES.ContactsView}
          onRemove={
            contact?.id
              ? async () => remove.mutateAsync(contact?.id)
              : undefined
          }
          onRestore={
            contact?.id
              ? async () => restore.mutateAsync(contact?.id)
              : undefined
          }
          suffix={
            <>
              <Button
                theme="outlined"
                size="sm"
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
                size="sm"
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
