import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";
import { PageLoader } from "@components/page-loader";
import _ from "lodash";
import { DocumentBar } from "@components/document-bar";

export const ContactsEditPage = ({ readonly }: { readonly?: boolean }) => {
  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  // TODO this must not execute if we're in a modal /!\
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as Contacts;

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
    _.merge(
      {
        type: "company",
        delivery_address: null,
      },
      initialModel
    ) as Contacts
  );

  if (isInitiating) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: id ? "Modifier" : "Créer" },
      ]}
      bar={
        <DocumentBar
          document={{ id }}
          mode={"write"}
          onSave={async () => await save()}
          backRoute={ROUTES.Contacts}
          viewRoute={ROUTES.ContactsView}
          prefix={<span>Créer un contact</span>}
        />
      }
    >
      <ContactsDetailsPage readonly={false} id={id} />
    </Page>
  );
};
