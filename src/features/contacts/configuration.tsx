import { Button } from "@atoms/button/button";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { RestFieldsNames } from "@features/utils/rest/configuration";
import {
  BuildingOfficeIcon,
  ShareIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  BuildingStorefrontIcon,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";
import { Column } from "@molecules/table/table";
import { ContactsDetailsPage } from "@views/client/modules/contacts/components/contact-details";
import { Contacts, getContactName } from "./types/types";

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
        <UsersInput value={contact.assigned} disabled />
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

export const ContactsFieldsNames = () => ({
  has_parents: {
    label: "A une relation",
    keywords: "Contact ayant une relation",
  },
  email: "Email",
  address: "Adresse",
  phone: "Téléphone",
  is_supplier: "Fournisseur",
  is_client: "Client",
  favorite: "Favoris",
  parents: "Relations",
  "parents_roles.any.role": "Rôle",
  "parents_roles.any.notes": "Notes",
  type: "Type d'entité",
  business_name: "Nom de l'entreprise",
  business_registered_name: "Nom enregistré",
  business_registered_id: "Numéro d'identification",
  business_tax_id: "Numéro de TVA",
  person_first_name: "Prénom",
  person_last_name: "Nom",
  language: "Langue",
  currency: "Devise",
  emails: "Autre emails",
  phones: "Autres téléphones",
  "address.address_line_1": "Adresse - Ligne 1",
  "address.address_line_2": "Adresse - Ligne 2",
  "address.region": "Adresse - Région",
  "address.country": "Adresse - Pays",
  "address.zip": "Adresse - Code postal",
  "address.city": "Adresse - Ville",
  "delivery_address.address_line_1": "Adresse de livraison - Ligne 1",
  "delivery_address.address_line_2": "Adresse de livraison - Ligne 2",
  "delivery_address.region": "Adresse de livraison - Région",
  "delivery_address.country": "Adresse de livraison - Pays",
  "delivery_address.zip": "Adresse de livraison - Code postal",
  "delivery_address.city": "Adresse de livraison - Ville",
  "billing.iban": "Paiements - IBAN",
  "billing.bic": "Paiements - BIC",
  "billing.name": "Paiements - Nom",
  "billing.payment_method": "Paiements - Méthode de paiement",
  documents: false,
  ...RestFieldsNames(),
});
