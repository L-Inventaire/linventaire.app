import { Tag } from "@atoms/badge/tag";
import { Info, Section } from "@atoms/text";
import { useClients } from "@features/clients/state/use-clients";
import { Page, PageBlock } from "../../_layout/page";

export const CompanyPlanPage = () => {
  const { client } = useClients();
  return (
    <Page title={[{ label: "Paramètres" }, { label: "Votre Abonnement" }]}>
      <PageBlock>
        <Section>Abonnement</Section>
        <Tag>{client?.client?.configuration?.plan || "Aucun plan"}</Tag>
        <Info className="mt-4 block">
          Vous ne pouvez pas changer votre plan. Contactez le support de
          L'inventaire pour faire des modifications.
        </Info>
      </PageBlock>
    </Page>
  );
};
