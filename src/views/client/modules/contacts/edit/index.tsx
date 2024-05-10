import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";
import { PageLoader } from "@components/page-loader";

export const ContactsEditPage = ({ readonly }: { readonly?: boolean }) => {
  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const {
    draft: contact,
    isPending,
    isInitiating,
    save,
  } = useDraftRest<Contacts>(
    "contacts",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.ContactsView, { id: item.id }));
    },
    {
      type: "company",
      delivery_address: null,
    } as Contacts
  );

  if (isInitiating) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: id ? "Modifier" : "Créer" },
      ]}
    >
      <div className="float-right space-x-2">
        <Button
          theme="outlined"
          onClick={async () =>
            navigate(
              !id
                ? getRoute(ROUTES.Contacts)
                : getRoute(ROUTES.ContactsView, { id })
            )
          }
        >
          Annuler
        </Button>
        <Button
          disabled={!getContactName(contact)}
          loading={isPending}
          onClick={async () => await save()}
        >
          Sauvegarder
        </Button>
      </div>
      {!id && (
        <Title>Création de {getContactName(contact) || "<nouveau>"}</Title>
      )}
      {id && <Title>Modification de {getContactName(contact) || ""}</Title>}
      <div className="mt-4" />
      <ContactsDetailsPage readonly={false} id={id} />
    </Page>
  );
};
