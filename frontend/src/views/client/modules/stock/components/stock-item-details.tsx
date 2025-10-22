import { Button } from "@atoms/button/button";
import { Card } from "@atoms/card";
import { Unit } from "@atoms/input/input-unit";
import { PageLoader } from "@atoms/page-loader";
import { SectionSmall } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext, FormContextContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { Articles } from "@features/articles/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { Contacts } from "@features/contacts/types/types";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { StockItems } from "@features/stock/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { DivideIcon, TruckIcon } from "@heroicons/react/16/solid";
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
import { Timeline } from "@molecules/timeline";
import { Callout } from "@radix-ui/themes";
import { PageBlockHr } from "@views/client/_layout/page";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { InvoiceRestDocument } from "../../invoices/components/invoice-lines-input/invoice-input-rest-card";
import { QuotesCheckers, SerialNumberCheckers } from "./create-from/checkers";
import { StockItemStatus } from "./stock-item-status";
import { SubdivideStockModalAtom } from "./subdivide-modal";
import { Tracability } from "./tracability";

export const StockItemsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const navigate = useNavigate();
  const setSubdivideModal = useSetRecoilState(SubdivideStockModalAtom);

  const {
    isPending,
    ctrl,
    draft,
    setDraft,
    save: _save,
  } = useReadDraftRest<StockItems>("stock_items", id || "new", readonly);

  const [article, setArticle] = useState<Articles | null>(null);
  const { invoice: quote } = useInvoice(draft.for_rel_quote);
  const { invoice: order } = useInvoice(draft.from_rel_supplier_quote);

  useEffect(() => {
    if (!isPending && draft)
      setDraft((draft: StockItems) => {
        // Set auto computed values and defaults
        return {
          ...draft,
          state: draft?.state || "stock",
        };
      });
  }, [JSON.stringify(draft), isPending]);

  useEffect(() => {
    setDraft((draft: StockItems) => {
      // Set auto computed values and defaults
      return {
        ...draft,
        client: quote?.client || "",
      };
    });
  }, [quote?.id]);

  if (isPending || (id && draft.id !== id) || !client) return <PageLoader />;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <div className="flex flex-row mt-4 mb-2 items-center space-x-2">
          <SectionSmall className="grow m-0">Réception</SectionSmall>
          <TagsInput
            size="md"
            value={ctrl("tags").value}
            onChange={ctrl("tags").onChange}
          />
          <UsersInput
            size="md"
            value={ctrl("assigned").value}
            onChange={ctrl("assigned").onChange}
          />
          <StockItemStatus
            value={draft.state}
            onChange={(e) => {
              if (readonly) {
                _save({ state: e });
              } else {
                ctrl("state").onChange(e);
              }
            }}
          />
        </div>

        <Card
          show={!ctrl("article").value}
          title="Choisissez comment démarrer la réception"
          wrapperClassName="mb-4"
          icon={(p) => <InformationCircleIcon {...p} />}
        >
          Vous pouvez réceptionner un article unique, à partir d'un fournisseur,
          ou d'une commande.
        </Card>

        <div className="space-y-4">
          <RestDocumentsInput
            label="Article"
            placeholder="À partir d'un article"
            entity="articles"
            icon={(p) => <CubeIcon {...p} />}
            size="xl"
            value={ctrl("article").value}
            filter={
              {
                type: ["product", "consumable"],
              } as any
            }
            onChange={(id, article: Articles | null) => {
              ctrl("article").onChange(id);
              ctrl("quantity").onChange(
                article?.suppliers_details?.[0]?.delivery_quantity || 1
              );
            }}
            onEntityChange={(article) => setArticle(article)}
          />

          {!ctrl("article").value && !draft.id && (
            <RestDocumentsInput
              label="Fournisseur"
              placeholder="À partir d'un fournisseur"
              entity="contacts"
              icon={(p) => <TruckIcon {...p} />}
              size="xl"
              filter={
                {
                  is_supplier: true,
                } as Partial<Contacts>
              }
              onChange={(id) => {
                navigate(
                  getRoute(ROUTES.StockEditFrom, { from: "supplier", id })
                );
              }}
            />
          )}

          {!ctrl("article").value && !draft.id && (
            <RestDocumentsInput
              label="Commande"
              placeholder="À partir d'une commande"
              entity="invoices"
              icon={(p) => <ShoppingCartIcon {...p} />}
              size="xl"
              filter={
                {
                  type: "supplier_quotes",
                  state: ["sent", "purchase_order", "accepted"],
                } as any
              }
              onChange={(id) => {
                navigate(getRoute(ROUTES.StockEditFrom, { from: "order", id }));
              }}
            />
          )}
        </div>

        {!article && (
          <>
            <RestDocumentsInput
              disabled={true}
              data-tooltip="Bientôt disponible"
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
              disabled={true}
              data-tooltip="Bientôt disponible"
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
            <div className="m-grid-1 flex items-center flex-row">
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
                {ctrl("quantity").value || 1} <Unit unit={article.unit} />
              </InputButton>
              {(!readonly || ctrl("location").value) && (
                <RestDocumentsInput
                  entity="stock_locations"
                  size="lg"
                  label="Localisation"
                  placeholder="Non renseigné"
                  icon={(p) => <MapPinIcon {...p} />}
                  ctrl={ctrl("location")}
                />
              )}
              <div className="grow" />
              {(!readonly ||
                !!ctrl("from_rel_original_stock_items").value?.length) && (
                <RestDocumentsInput
                  entity="stock_items"
                  size="lg"
                  label="Élément d'origine"
                  placeholder="Aucun élément d'origine"
                  icon={(p) => <DivideIcon {...p} />}
                  max={1}
                  value={ctrl("from_rel_original_stock_items").value}
                  onChange={ctrl("from_rel_original_stock_items").onChange}
                />
              )}
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
                filter={
                  {
                    type: "supplier_quotes",
                    "articles.all": draft.article,
                  } as Partial<Invoices>
                }
                icon={(p) => <ShoppingCartIcon {...p} />}
                size="xl"
                value={ctrl("from_rel_supplier_quote").value}
                onChange={ctrl("from_rel_supplier_quote").onChange}
              />

              <ArrowRightIcon className="h-5 w-5 shrink-0" />

              <div className="flex flex-col items-center space-y-2 grow w-full">
                <InvoiceRestDocument
                  label="Pour le devis"
                  placeholder="Sélectionner un devis"
                  filter={
                    {
                      type: "quotes",
                      "articles.all": draft.article,
                    } as Partial<Invoices>
                  }
                  icon={(p) => <DocumentIcon {...p} />}
                  size="xl"
                  value={ctrl("for_rel_quote").value}
                  onChange={ctrl("for_rel_quote").onChange}
                />
                <QuoteLineSelector
                  quote={quote}
                  article={article}
                  onChange={ctrl("for_rel_quote_content_index").onChange}
                  value={ctrl("for_rel_quote_content_index").value}
                />
              </div>
              <RestDocumentsInput
                label="Chez le contact"
                placeholder="Sélectionner un contact"
                filter={
                  quote || order
                    ? ({
                        id: [
                          quote?.client,
                          quote?.contact,
                          order?.supplier,
                        ].filter(Boolean),
                      } as any)
                    : {}
                }
                entity="contacts"
                icon={(p) => <MapPinIcon {...p} />}
                size="xl"
                value={ctrl("client").value}
                onChange={ctrl("client").onChange}
              />
            </div>
          </div>
        )}

        {!!ctrl("article").value && (
          <div className="space-y-2 mt-4">
            <QuotesCheckers items={[draft]} />
            <SerialNumberCheckers items={[draft]} />
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

        {!!article && readonly && (
          <div>
            <SectionSmall className="mt-8 mb-2">Traçabilité</SectionSmall>
            <Callout.Root size={"1"} className="mb-2">
              Retrouvez l'historique d'utilisation de la pièce, lot d'origine ou
              article d'origine en cas de pièce détachée.
            </Callout.Root>
            <div className="space-x-2">
              <Button
                theme="outlined"
                size="sm"
                onClick={() => {
                  setSubdivideModal({
                    open: true,
                    item: draft,
                  });
                }}
              >
                Subdiviser le lot
              </Button>
            </div>
            {!!article && readonly && (
              <div className="mt-4">
                <Tracability id={draft.id} />
              </div>
            )}
          </div>
        )}

        {false && !!article && readonly && (
          <div>
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

        {readonly && (
          <div className="mt-8">
            <Timeline
              entity="stock_items"
              id={draft.id}
              viewRoute={ROUTES.StockView}
            />
          </div>
        )}
      </FormContext>
    </div>
  );
};

export const QuoteLineSelector = ({
  quote,
  article,
  value,
  onChange,
  ...props
}: {
  quote: Invoices | null;
  article: Articles | null;
  value: number;
  onChange: (e: number) => void;
  disabled?: boolean;
}) => {
  const formContext = useContext(FormContextContext);
  const disabled =
    props.disabled === undefined
      ? formContext.disabled || formContext.readonly
      : props.disabled || false;

  if (!value && disabled) return <></>;

  return (
    <>
      {!!article &&
        !!quote &&
        (quote?.content?.filter((a) => a.article === article?.id)?.length ||
          0) > 1 && (
          <FormInput
            type="select"
            value={(value || 0).toString()}
            onChange={(e) => onChange(parseInt(e))}
            options={(() => {
              let counter = 1;
              return (
                quote?.content?.map((c, i) => {
                  return {
                    value: (i + 1).toString(),
                    label:
                      (c.type !== "separation" ? `${counter++} - ` : "") +
                        c.name || "",
                    disabled: c.article !== article.id,
                  };
                }) || []
              );
            })()}
          />
        )}
    </>
  );
};
