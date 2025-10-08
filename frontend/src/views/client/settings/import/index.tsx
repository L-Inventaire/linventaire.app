import { Info } from "@atoms/text";
import { Heading } from "@radix-ui/themes";
import { Page } from "../../_layout/page";

export const ImportExportPage = () => {
  return (
    <Page title={[{ label: "Paramètres" }, { label: "Import / Export" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Heading size="6">Import / Export</Heading>
        <Info className="mt-4 block">
          Importez et exportez vos données (contacts, articles, factures, etc.)
          depuis et vers différents formats.
        </Info>

        {/* Contenu à venir */}
        <div className="mt-8 p-8 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
          <p>Fonctionnalités d'import/export en cours de développement</p>
        </div>
      </div>
    </Page>
  );
};
