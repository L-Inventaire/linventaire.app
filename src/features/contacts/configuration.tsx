import { Button } from "@atoms/button/button";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import {
  BuildingOfficeIcon,
  ShareIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  BuildingStorefrontIcon,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";
import { ContactsDetailsPage } from "@views/client/modules/contacts/components/contact-details";
import { Contacts, getContactName } from "./types/types";
import { Column } from "@molecules/table/table";

export const useContactDefaultModel: () => Partial<Contacts> = () => ({
  type: "company",
  delivery_address: null,
});

export const ContactsColumns: Column<Contacts>[] = [
  {
    title: "Type",
    thClassName: "w-1",
    render: (contact) => (
      <div className="space-x-2 flex items-center">
        <Button
          className={
            !contact.is_supplier && !contact.is_client ? "opacity-50" : ""
          }
          size="sm"
          theme="outlined"
          data-tooltip={
            contact.is_supplier && contact.is_client
              ? "Fournisseur et client"
              : contact.is_supplier
              ? "Fournisseur"
              : contact.is_client
              ? "Client"
              : "Aucun"
          }
          icon={(p) =>
            contact.is_supplier && contact.is_client ? (
              <>
                <UserIconSolid {...p} />
                <BuildingStorefrontIcon {...p} />
              </>
            ) : contact.is_supplier ? (
              <UserIconSolid {...p} />
            ) : contact.is_client ? (
              <BuildingStorefrontIcon {...p} />
            ) : (
              <></>
            )
          }
        >
          {contact.is_supplier && contact.is_client
            ? "Tous"
            : contact.is_supplier
            ? "Fourn."
            : contact.is_client
            ? "Client"
            : "Aucun"}
        </Button>
      </div>
    ),
  },
  {
    title: "Nom",
    render: (contact) => (
      <div className="flex space-x-2 items-center">
        <Button
          size="sm"
          theme="outlined"
          data-tooltip={contact.type === "person" ? "Personne" : "Entreprise"}
          icon={(p) =>
            contact.type === "person" ? (
              <UserIcon {...p} />
            ) : (
              <BuildingOfficeIcon {...p} />
            )
          }
        />
        <span>
          {getContactName(contact)}{" "}
          <span className="opacity-50">
            {[contact.email, contact.phone].join(" ")}
          </span>
        </span>
      </div>
    ),
  },
  {
    id: "tags",
    title: "Étiquettes",
    render: (contact) => (
      <div className="w-full flex space-x-1 items-center whitespace-nowrap">
        <TagsInput size="md" value={contact.tags} disabled />
      </div>
    ),
  },
  {
    id: "relations",
    title: "Relations",
    render: (contact) => (
      <div className="w-full flex space-x-1 items-center whitespace-nowrap">
        {(contact.parents?.length || 0) > 0 && (
          <RestDocumentsInput
            value={contact.parents as any}
            entity="contacts"
            disabled
            size="md"
            icon={(p) => <ShareIcon {...p} />}
          />
        )}
      </div>
    ),
  },
];

registerCtrlKRestEntity<Contacts>("contacts", {
  renderEditor: (props) => (
    <ContactsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: ContactsColumns,
  useDefaultData: useContactDefaultModel,
  viewRoute: ROUTES.ContactsView,
});
