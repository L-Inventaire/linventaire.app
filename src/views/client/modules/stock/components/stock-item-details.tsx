import { Button } from "@atoms/button/button";
import { Card } from "@atoms/card";
import { PageLoader } from "@atoms/page-loader";
import { SectionSmall } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { Articles } from "@features/articles/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { Invoices } from "@features/invoices/types/types";
import { StockItems } from "@features/stock/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  HashtagIcon,
  InformationCircleIcon,
  MapPinIcon,
  QrCodeIcon,
  ShoppingCartIcon,
} from "@heroicons/react/20/solid";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { CubeIcon } from "@heroicons/react/24/solid";
import { EditorInput } from "@molecules/editor-input";
import { PageBlockHr } from "@views/client/_layout/page";
import { useEffect, useState } from "react";
import { InvoiceRestDocument } from "../../invoices/components/invoice-lines-input/invoice-input-rest-card";
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
          <SectionSmall className="grow m-0">Élément du stock</SectionSmall>
          <StockItemStatus
            value={draft.state}
            onChange={(state) => setDraft({ ...draft, state })}
            size="md"
            readonly={readonly}
          />
        </div>

        <Card
          show={!ctrl("article").value}
          title="Choisissez comment démarrer l'ajout au stock"
          wrapperClassName="mb-4"
          icon={(p) => <InformationCircleIcon {...p} />}
        >
          Vous pouvez ajouter au stock à partir d'un article, d'un fournisseur,
          ou d'une commande.
        </Card>

        <RestDocumentsInput
          label="Article"
          placeholder="Sélectionner un article"
          entity="articles"
          icon={(p) => <CubeIcon {...p} />}
          size="xl"
          value={ctrl("article").value}
          onChange={(id, article: Articles | null) => {
            ctrl("article").onChange(id);
            ctrl("quantity").onChange(
              article?.suppliers_details?.[0]?.delivery_quantity || 1
            );
          }}
          onEntityChange={(article) => setArticle(article)}
        />

        {!article && (
          <>
            <RestDocumentsInput
              className="mt-4"
              label="Commande"
              placeholder="Sélectionner une commande"
              entity="invoices"
              icon={(p) => <ShoppingCartIcon {...p} />}
              filter={{ type: "supplier_quotes" } as Partial<Invoices>}
              size="xl"
              value={ctrl("from_rel_supplier_quote").value}
              onChange={ctrl("from_rel_supplier_quote").onChange}
            />
            <RestDocumentsInput
              className="mt-4"
              label="Fournisseur"
              placeholder="Sélectionner un fournisseur"
              entity="contacts"
              icon={(p) => <BuildingStorefrontIcon {...p} />}
              filter={{ is_supplier: true } as Partial<Invoices>}
              size="xl"
            />
          </>
        )}

        {!!article && (
          <div className="mt-2">
            <div className="m-grid-1">
              <InputButton
                data-tooltip="Numéro de série ou de lot"
                theme="outlined"
                empty="Aucun numéro de série ou de lot"
                icon={(p) => <QrCodeIcon {...p} />}
                value={ctrl("serial_number").value}
                onChange={ctrl("serial_number").onChange}
                placeholder="Numéro de série ou de lot"
              />
              <InputButton
                data-tooltip="Quantité"
                theme="outlined"
                icon={(p) => <HashtagIcon {...p} />}
                value={ctrl("quantity").value}
                onChange={ctrl("quantity").onChange}
                placeholder="Aucun"
                label="Quantité"
              >
                {ctrl("quantity").value || 1} {article.unit || "unité"}
              </InputButton>
              {(!readonly || ctrl("location").value) && (
                <Button
                  data-tooltip="Localisation"
                  theme="outlined"
                  icon={(p) => <MapPinIcon {...p} />}
                >
                  Localisation
                </Button>
              )}
              <TagsInput
                size="md"
                value={ctrl("tags").value}
                onChange={ctrl("tags").onChange}
              />
              <UsersInput
                size="md"
                value={ctrl("assignees").value}
                onChange={ctrl("assignees").onChange}
              />
            </div>
          </div>
        )}

        {!!article && (
          <div className="">
            <SectionSmall className="mt-8 mb-2">
              Origine et affectation
            </SectionSmall>
            <div className="m-grid-1 flex items-center">
              <InvoiceRestDocument
                label="Commande d'origine"
                placeholder="Sélectionner une commande"
                filter={{ type: "supplier_quotes" } as Partial<Invoices>}
                icon={(p) => <ShoppingCartIcon {...p} />}
                size="xl"
                value={ctrl("from_rel_supplier_quote").value}
                onChange={ctrl("from_rel_supplier_quote").onChange}
              />

              <ArrowRightIcon className="h-5 w-5 shrink-0" />

              <InvoiceRestDocument
                label="Pour le devis"
                placeholder="Sélectionner un devis"
                filter={{ type: "quotes" } as Partial<Invoices>}
                icon={(p) => <DocumentIcon {...p} />}
                size="xl"
                value={ctrl("for_rel_quote").value}
                onChange={ctrl("for_rel_quote").onChange}
              />
              <RestDocumentsInput
                label="Chez le contact"
                placeholder="Sélectionner un contact"
                entity="contacts"
                icon={(p) => <MapPinIcon {...p} />}
                size="xl"
                value={ctrl("client").value}
                onChange={ctrl("client").onChange}
              />
            </div>
          </div>
        )}

        {!!article && (
          <div>
            <SectionSmall className="mt-8 mb-2">
              Documents et notes
            </SectionSmall>
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
              disabled={readonly}
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
            <SectionSmall className="mt-8 mb-2">Actions</SectionSmall>
            <Button theme="outlined">Subdiviser le lot</Button>

            <RestDocumentsInput
              entity="stock_items"
              size="md"
              label="Élement d'origine"
              placeholder="Aucun élément d'origine"
            />

            <SectionSmall className="mt-8 mb-2">Traçabilité</SectionSmall>
            <SectionSmall className="mt-8 mb-2">
              Commentaires et historique
            </SectionSmall>
          </div>
        )}

        {false && (
          <>
            <SectionSmall className="mt-8 mb-2">
              Autre informations
            </SectionSmall>
            <SectionSmall>Réception</SectionSmall>
            <FormInput
              label="Article"
              type="rest_documents"
              rest={{
                table: "articles",
              }}
              ctrl={ctrl("article")}
              size="md"
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
              rest={{
                table: "invoices",
                filter: {
                  type: "quotes",
                },
              }}
              ctrl={ctrl("from_rel_supplier_quote")}
            />
            <PageBlockHr />
            <CustomFieldsInput
              table={"stock_items"}
              ctrl={ctrl("fields")}
              readonly={readonly}
              entityId={draft.id || ""}
            />
          </>
        )}
      </FormContext>
    </div>
  );
};
