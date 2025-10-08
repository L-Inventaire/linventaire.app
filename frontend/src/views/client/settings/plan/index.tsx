import { Tag } from "@atoms/badge/tag";
import { Info } from "@atoms/text";
import { useClients } from "@features/clients/state/use-clients";
import { Heading } from "@radix-ui/themes";
import { Page } from "../../_layout/page";

export const CompanyPlanPage = () => {
  const { client } = useClients();
  return (
    <Page title={[{ label: "Paramètres" }, { label: "Votre Abonnement" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Abonnement</Heading>
        <Tag>{client?.client?.configuration?.plan || "Aucun plan"}</Tag>
        <Info className="mt-4 block">
          Vous ne pouvez pas changer votre plan. Contactez le support de
          L'inventaire pour faire des modifications.
        </Info>
      </div>
    </Page>
  );
};
