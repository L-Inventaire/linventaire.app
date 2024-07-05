import { Button } from "@atoms/button/button";
import { Card } from "@atoms/card";
import { Section } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { EditorInput } from "@components/editor-input";
import { FilesInput } from "@components/files-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { PageLoader } from "@components/page-loader";
import { RestDocumentsInput } from "@components/rest-documents-input";
import { Articles } from "@features/articles/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { Invoices } from "@features/invoices/types/types";
import { StockItems } from "@features/stock/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  ArrowRightIcon,
  HashtagIcon,
  InformationCircleIcon,
  MapPinIcon,
  QrCodeIcon,
  ShoppingCartIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { CubeIcon } from "@heroicons/react/24/solid";
import { PageBlock, PageBlockHr } from "@views/client/_layout/page";
import { useEffect, useState } from "react";
import { StockItemStatus } from "./stock-item-status";

export const StockItemsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const [article, setArticle] = useState<Articles | null>(null);

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
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <div className="flex flex-row mt-4 mb-2 items-center">
          <Section className="grow m-0">Élément du stock</Section>
          <StockItemStatus
            value={draft.state}
            onChange={(state) => setDraft({ ...draft, state })}
            size="lg"
          />
        </div>

        <Card
          show={!ctrl("article").value}
          title="Choisir un article"
          wrapperClassName="mb-4"
          icon={(p) => <InformationCircleIcon {...p} />}
        >
          Pour continuer, veuillez sélectionner l'article que vous ajoutez au
          stock.
        </Card>

        <RestDocumentsInput
          label="Article"
          placeholder="Sélectionner un article"
          entity="articles"
          icon={(p) => <CubeIcon {...p} />}
          size="lg"
          value={ctrl("article").value}
          onChange={(id, article: Articles | null) => {
            ctrl("article").onChange(id);
            setArticle(article);
          }}
        />

        {!!article && (
          <div className="mt-2">
            <div className="m-grid-1">
              <Button
                data-tooltip="Numéro de série ou de lot"
                theme="outlined"
                icon={(p) => <QrCodeIcon {...p} />}
              >
                Aucun numéro de série ou de lot
              </Button>
              <Button
                data-tooltip="Quantité"
                theme="outlined"
                icon={(p) => <HashtagIcon {...p} />}
              >
                1 {article.unit || "unité"}
              </Button>
              <Button
                data-tooltip="Localisation"
                theme="outlined"
                icon={(p) => <MapPinIcon {...p} />}
              >
                Localisation
              </Button>
              <Button
                data-tooltip="Étiquettes"
                theme="invisible"
                icon={(p) => <TagIcon {...p} />}
              />
              <Button
                data-tooltip="Responsable"
                theme="invisible"
                icon={(p) => <UserCircleIcon {...p} />}
              />
            </div>
          </div>
        )}

        {!!article && (
          <div className="">
            <Section className="mt-6 mb-2">Origine et affectation</Section>
            <div className="m-grid-1 flex items-center">
              <RestDocumentsInput
                label="Commande d'origine"
                placeholder="Sélectionner une commande"
                entity="invoices"
                filter={{ type: "supplier_quotes" } as Partial<Invoices>}
                icon={(p) => <ShoppingCartIcon {...p} />}
                size="lg"
                value={ctrl("from_rel_supplier_quote").value}
                onChange={ctrl("from_rel_supplier_quote").onChange}
              />

              <ArrowRightIcon className="h-12 w-12" />

              <RestDocumentsInput
                label="Pour le devis"
                placeholder="Sélectionner un devis"
                entity="invoices"
                filter={{ type: "quotes" } as Partial<Invoices>}
                icon={(p) => <DocumentIcon {...p} />}
                size="lg"
                value={ctrl("for_rel_quote").value}
                onChange={ctrl("for_rel_quote").onChange}
              />
              <RestDocumentsInput
                label="Chez le contact"
                placeholder="Sélectionner un contact"
                entity="contacts"
                icon={(p) => <MapPinIcon {...p} />}
                size="lg"
                value={ctrl("client").value}
                onChange={ctrl("client").onChange}
              />
            </div>
          </div>
        )}

        {!!article && (
          <div>
            <Section className="mt-6 mb-2">Documents et notes</Section>
            <EditorInput
              key={readonly ? ctrl("notes").value : undefined}
              placeholder={
                readonly ? "Aucune note" : "Cliquez pour ajouter des notes"
              }
              disabled={readonly}
              value={ctrl("notes").value || ""}
              onChange={(e) => ctrl("notes").onChange(e)}
            />
            <div className="mt-2" />
            <FilesInput
              value={(ctrl("documents").value as any) || []}
              onChange={ctrl("documents").onChange}
              rel={{
                table: "stock_items",
                id: draft.id || "",
                field: "documents",
              }}
            />
          </div>
        )}

        {!!article && (
          <div>
            <Section className="mt-6 mb-2">Actions</Section>
            <Button theme="outlined">Subdiviser le lot</Button>

            <Section className="mt-6 mb-2">Traçabilité</Section>
            <Section className="mt-6 mb-2">Commentaires et historique</Section>
          </div>
        )}

        {false && (
          <>
            <Section className="mt-6 mb-2">Autre informations</Section>
            <Section>Réception</Section>
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
            <Section>Usage</Section>
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
          </>
        )}
      </FormContext>
    </div>
  );
};
