import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useContactDefaultModel } from "@features/contacts/configuration";
import { Contacts } from "@features/contacts/types/types";
import { useParamsOrContextId } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ContactsDetailsPage } from "../components/contact-details";

export const ContactsEditPage = (_props: { readonly?: boolean }) => {
  let { id } = useParamsOrContextId();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useRef(useContactDefaultModel()).current;
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as Contacts;

  const { isInitiating, save, draft, remove, restore, isPendingModification } =
    useDraftRest<Contacts>(
      "contacts",
      id || "new",
      async (item) => {
        navigate(getRoute(ROUTES.ContactsView, { id: item.id }));
      },
      _.merge(defaultModel, initialModel) as Contacts
    );

  return (
    <Page
      loading={isPendingModification}
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: id ? "Modifier" : "Créer" },
      ]}
      bar={
        <DocumentBar
          loading={isInitiating}
          entity={"contacts"}
          document={{ id }}
          mode={"write"}
          onSave={async () => await save()}
          backRoute={ROUTES.Contacts}
          viewRoute={ROUTES.ContactsView}
          prefix={<span>Créer un contact</span>}
          onRemove={draft.id ? remove : undefined}
          onRestore={draft.id ? restore : undefined}
        />
      }
    >
      {isInitiating ? (
        <PageLoader />
      ) : (
        <ContactsDetailsPage readonly={false} id={id} />
      )}
    </Page>
  );
};
