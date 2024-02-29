import { Base, Info, Section } from "@atoms/text";
import { Page } from "../../_layout/page";
import { useClients } from "@features/clients/state/use-clients";
import { Tag } from "@atoms/badge/tag";

export const CompanyPlanPage = () => {
  const { client } = useClients();
  return (
    <Page title={[{ label: "Paramètres" }, { label: "Votre Abonnement" }]}>
      <Section>Abonnement</Section>
      <Tag>{client?.client?.configuration?.plan || "Aucun plan"}</Tag>
      <br />
      <Info>
        Vous ne pouvez pas changer votre plan. Contactez le support de
        L'inventaire pour faire des modifications.
      </Info>
    </Page>
  );
};
