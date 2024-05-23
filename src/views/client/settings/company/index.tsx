import countries from "@assets/countries.json";
import { Info, Section } from "@atoms/text";
import { Form } from "@components/form";
import { ValuesObjectType } from "@components/form/types";
import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { useEffect, useState } from "react";
import { Page, PageBlock } from "../../_layout/page";
import { Button } from "@atoms/button/button";
import { useHasAccess } from "@features/access";
import _ from "lodash";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { InputImage } from "@atoms/input/input-image";
import { getServerUri } from "@features/utils/format/strings";
import { ButtonConfirm } from "@atoms/button/confirm";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useAuth } from "@features/auth/state/use-auth";
import toast from "react-hot-toast";

export const CompanyPage = () => {
  const { user } = useAuth();
  const { update, client: clientUser } = useClients();
  const { users, remove } = useClientUsers(clientUser?.client?.id || "");
  const client = clientUser?.client;
  const hasAccess = useHasAccess();
  const readonly = !hasAccess("CLIENT_MANAGE");

  const [company, setCompany] = useState<Partial<Clients["company"]>>({});
  const [address, setAddress] = useState<Partial<Clients["address"]>>({});
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCompany({ ...client?.company });
    setAddress({ ...client?.address });
    setImageBase64(client?.preferences?.logo);
  }, [client]);

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Votre Entreprise" }]}>
      <PageBlock>
        <Section>Affichage</Section>
        <div className="max-w-xs">
          <Form
            readonly={readonly}
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
            ]}
          />

          <InputLabel
            label="Logo de l'enreprise"
            className="mt-4"
            input={
              <InputImage
                fallback={company?.name}
                value={getServerUri(imageBase64) || ""}
                onChange={(b64) => setImageBase64(b64 || "")}
              />
            }
          />

          {!readonly &&
            !_.isEqual(
              { company, imageBase64 },
              {
                company: client?.company,
                imageBase64: client?.preferences.logo,
              }
            ) && (
              <Button
                className="mt-4"
                theme="primary"
                onClick={() =>
                  update(client?.id || "", {
                    company: {
                      ...client!.company,
                      ...company,
                    },
                    preferences: {
                      ...client!.preferences,
                      logo: imageBase64 || "",
                    },
                  })
                }
              >
                Enregistrer
              </Button>
            )}
        </div>
      </PageBlock>

      <PageBlock>
        <Section>Informations légales</Section>
        <div className="max-w-xs">
          <Form
            readonly={readonly}
            value={company}
            onChange={(value: ValuesObjectType) => {
              setCompany(value);
            }}
            fields={[
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
          {!readonly && !_.isEqual(company, client?.company) && (
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
      </PageBlock>

      <PageBlock>
        <Section>Adresse</Section>
        <div className="max-w-xs">
          <Form
            readonly={readonly}
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
          {!readonly && !_.isEqual(address, client?.address) && (
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
      </PageBlock>

      {hasAccess("CLIENT_MANAGE") && (
        <PageBlock>
          <Section noColor className="text-red-500">
            Destruction de l'entreprise
          </Section>
          <Info>
            Pour détruire l'entreprise, vous devez d'abord supprimer tous les
            utilisateurs. Une fois l'entreprise détruite, vous ne pourrez pas y
            accéder. Nous pouvons récupérer les données pour une période de 30
            jours via un contact avec le support.
          </Info>
          <br />
          <ButtonConfirm
            disabled={users.length > 1}
            theme="danger"
            className="mt-4"
            confirmButtonTheme="danger"
            confirmButtonText="Détruire l'entreprise"
            onClick={async () => {
              try {
                await remove(user?.id || "");
                document.location.reload();
              } catch (e) {
                console.error(e);
                toast.error("Vous ne pouvez pas supprimer cette entreprise.");
              }
            }}
          >
            Détruire l'entreprise
          </ButtonConfirm>
        </PageBlock>
      )}
    </Page>
  );
};
