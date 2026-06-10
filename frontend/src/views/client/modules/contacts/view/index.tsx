import { Button } from "@atoms/button/button";
import { DocumentBar } from "@components/document-bar";
import { withModel } from "@components/search-bar/utils/as-model";
import { useHasAccess } from "@features/access";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { useParamsOrContextId } from "@features/ctrlk";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { ContactsDetailsPage } from "../components/contact-details";

export const ContactsViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParamsOrContextId();
  const { contact, isPending, remove, restore, isPendingModification } =
    useContact(id || "");
  const hasAccess = useHasAccess();

  return (
    <Page
      loading={isPendingModification}
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
          onRemove={
            contact?.id && hasAccess("CONTACTS_WRITE")
              ? async () => remove.mutateAsync(contact?.id)
              : undefined
          }
          onRestore={
            contact?.id && hasAccess("CONTACTS_WRITE")
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
