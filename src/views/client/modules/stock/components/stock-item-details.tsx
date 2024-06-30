import { SectionSmall } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { PageLoader } from "@components/page-loader";
import { useClients } from "@features/clients/state/use-clients";
import { StockItems } from "@features/stock/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  PageBlock,
  PageBlockHr,
  PageColumns,
} from "@views/client/_layout/page";
import { useEffect } from "react";

export const StockItemsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { isPending, ctrl, draft, setDraft } = useReadDraftRest<StockItems>(
    "stock_items",
    id || "new",
    readonly
  );

  useEffect(() => {
    if (!isPending && draft)
      setDraft((draft: StockItems) => {
        // Set auto computed values and defaults
        return draft;
      });
  }, [JSON.stringify(draft)]);

  if (isPending || (id && draft.id !== id) || !client) return <PageLoader />;

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <SectionSmall>Réception</SectionSmall>
        <FormInput
          label="Article"
          type="rest_documents"
          max={1}
          rest={{
            table: "articles",
          }}
          ctrl={ctrl("article")}
          size="lg"
        />
        <FormInput
          label="Type"
          type="select"
          options={[
            {
              value: "product",
              label: "Produit",
            },
            {
              value: "service",
              label: "Service",
            },
            {
              value: "consumable",
              label: "Consommable",
            },
          ]}
          ctrl={ctrl("type")}
        />
        <FormInput
          label="Numéro de série"
          type="text"
          ctrl={ctrl("serial_number")}
        />
        <PageBlockHr />
        <SectionSmall>Usage</SectionSmall>
        <FormInput label="Quantité" type="number" ctrl={ctrl("quantity")} />
        <FormInput
          label="Client"
          type="rest_documents"
          max={1}
          rest={{
            table: "contacts",
            filter: {
              is_client: true,
            },
          }}
          ctrl={ctrl("client")}
        />
        <FormInput
          label="Commande fournisseur"
          type="rest_documents"
          max={1}
          rest={{
            table: "invoices",
            filter: {
              type: "supplier_quotes",
            },
          }}
          ctrl={ctrl("for_rel_quote")}
        />
        <FormInput
          label="Devis client"
          type="rest_documents"
          max={1}
          rest={{
            table: "invoices",
            filter: {
              type: "quotes",
            },
          }}
          ctrl={ctrl("from_rel_supplier_quote")}
        />
        <PageBlockHr />
        <PageBlock closable title="Champs additionels">
          <CustomFieldsInput
            table={"stock_items"}
            ctrl={ctrl("fields")}
            readonly={readonly}
            entityId={draft.id || ""}
          />
        </PageBlock>
      </FormContext>
    </>
  );
};
