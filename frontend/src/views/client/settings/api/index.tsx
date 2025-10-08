import { Info } from "@atoms/text";
import { Heading } from "@radix-ui/themes";
import { Page } from "../../_layout/page";

export const ApiPage = () => {
  return (
    <Page title={[{ label: "Paramètres" }, { label: "API et développeurs" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">API et développeurs</Heading>
        <Info className="mt-4 block">
          Cette section permettra de gérer les clés API, webhooks et autres
          outils pour développeurs.
        </Info>

        {/* Contenu à venir */}
        <div className="mt-8 p-8 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
          <p>Fonctionnalités API en cours de développement</p>
        </div>
      </div>
    </Page>
  );
};
