import countries from "@assets/countries.json";
import { Section } from "@atoms/text";
import { Form } from "@components/form";
import { ValuesObjectType } from "@components/form/types";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { useEffect, useState } from "react";
import { Page } from "../../_layout/page";
import { Button } from "@atoms/button/button";
import { useHasAccess } from "@features/access";

export const CompanyPage = () => {
  const { update, client: clientUser } = useClients();
  const client = clientUser?.client;
  const hasAccess = useHasAccess();
  const readOnly = !hasAccess("CLIENT_WRITE");

  const [company, setCompany] = useState<Partial<Clients["company"]>>({});
  const [address, setAddress] = useState<Partial<Clients["address"]>>({});

  useEffect(() => {
    setCompany({ ...client?.company });
    setAddress({ ...client?.address });
  }, [client]);

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Votre Entreprise" }]}>
      <Section>Informations générales</Section>

      <div className="max-w-xs mb-6">
        <Form
          readonly={readOnly}
          value={company}
          onChange={(value: ValuesObjectType) => {
            setCompany(value);
          }}
          fields={[
            {
              label: "Nom de l'entreprise",
              key: "name",
              placeholder: "Books Inc.",
            },
            {
              label: "Nom légal",
              key: "legal_name",
              placeholder: "Books Inc.",
            },
            {
              label: "Numéro de TVA",
              key: "tax_number",
              placeholder: "BE0123456789",
            },
            {
              label: "SIRET",
              key: "registration_number",
              placeholder: "0123456789",
            },
          ]}
        />
        {!readOnly && (
          <Button
            className="mt-4"
            theme="primary"
            onClick={() =>
              update(client?.id || "", {
                company: {
                  ...client!.company,
                  ...company,
                },
              })
            }
          >
            Enregistrer
          </Button>
        )}
      </div>

      <Section>Adresse</Section>

      <div className="max-w-xs mb-6">
        <Form
          readonly={readOnly}
          value={address}
          onChange={(value: ValuesObjectType) => {
            setAddress(value);
          }}
          fields={[
            {
              label: "Adresse ligne 1",
              key: "address_line_1",
              placeholder: "Rue des Fleurs",
            },
            {
              label: "Adresse ligne 2",
              key: "address_line_2",
              placeholder: "Ligne d'adresse 2",
            },
            {
              label: "Code postal",
              key: "zip",
              placeholder: "1000",
            },
            {
              label: "Ville",
              key: "city",
              placeholder: "Bruxelles",
            },
            {
              label: "Région",
              key: "region",
              placeholder: "Région",
            },
            {
              label: "Pays",
              key: "country",
              type: "select",
              options: countries.map((c) => ({
                value: c.code,
                label: c.name,
              })),
              placeholder: "Belgique",
            },
          ]}
        />
        {!readOnly && (
          <Button
            className="mt-4"
            theme="primary"
            onClick={() =>
              update(client?.id || "", {
                address: {
                  ...client!.address,
                  ...address,
                },
              })
            }
          >
            Enregistrer
          </Button>
        )}
      </div>
    </Page>
  );
};
