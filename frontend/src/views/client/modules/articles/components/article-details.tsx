import { InputLabel } from "@atoms/input/input-decoration-label";
import { InputUnit } from "@atoms/input/input-unit";
import { PageLoader } from "@atoms/page-loader";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { Articles } from "@features/articles/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { tvaOptions } from "@features/utils/constants";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { EditorInput } from "@molecules/editor-input";
import { Timeline } from "@molecules/timeline";
import { Heading } from "@radix-ui/themes";
import { PageColumns } from "@views/client/_layout/page";
import { ArticleSuppliersInput } from "./article-suppliers-input";
import { ArticlesFieldsNames } from "@features/articles/configuration";
import { useHasAccess } from "@features/access";
import { AccountingAccountInput } from "@components/accounting-account-input";
import Link from "@atoms/link";

export const frequencyOptions = [
  { value: "", label: "Pas de renouvellement", per_label: "en une fois" },
  { value: "daily", label: "Quotidien", per_label: "par jour" },
  { value: "weekly", label: "Hebdomadaire", per_label: "par semaine" },
  { value: "monthly", label: "Mensuel", per_label: "par mois" },
  { value: "3_monthly", label: "Trimestriel", per_label: "par trimestre" },
  { value: "6_monthly", label: "Tous les 6 mois", per_label: "par semestre" },
  { value: "yearly", label: "Annuel", per_label: "par an" },
  { value: "2_yearly", label: "Tous les 2 ans", per_label: "tous les 2 ans" },
  { value: "3_yearly", label: "Tous les 3 ans", per_label: "tous les 3 ans" },
];

export const ArticlesDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { draft, ctrl, isPending } = useReadDraftRest<Articles>(
    "articles",
    id || "new",
    readonly
  );

  const getInvoicesLink = (
    type:
      | "invoices"
      | "quotes"
      | "supplier_quotes"
      | "supplier_invoices" = "invoices"
  ) => {
    const query = [
      `q=${encodeURIComponent(`articles.all:"${draft.name}"`)}`,
      `map=${encodeURIComponent(
        JSON.stringify({ [`articles.all:${draft.name}`]: draft.id })
      )}`,
    ].join("&");
    return getRoute(ROUTES.Invoices, { type }) + "?" + query;
  };

  const hasAccess = useHasAccess();

  if (isPending || (id && draft.id !== id)) return <PageLoader />;

  return (
    <>
      <div className="grow @lg:w-full max-w-4xl mx-auto">
        <FormContext readonly={readonly} alwaysVisible>
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="space-x-2 flex items-center">
                <Heading className="grow">Article</Heading>
                <div className="space-x-2">
                  <TagsInput ctrl={ctrl("tags")} />
                  <UsersInput ctrl={ctrl("assigned")} />
                </div>
              </div>
              <PageColumns>
                <FormInput
                  className="lg:w-1/3"
                  ctrl={ctrl("type")}
                  label="Type"
                  size="md"
                  type="select"
                  options={[
                    {
                      value: "product",
                      label: "Stockable",
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
                />
                <FormInput
                  className="lg:w-1/3"
                  ctrl={ctrl("internal_reference")}
                  label="Référence interne"
                  size="md"
                  type="scan"
                />
                <FormInput
                  className="lg:w-1/3"
                  ctrl={ctrl("supplier_reference")}
                  label="Référence fournisseur"
                  size="md"
                  type="scan"
                />
              </PageColumns>
              <FormInput ctrl={ctrl("name")} label="Nom" size="lg" />
              <InputLabel
                label="Description"
                input={
                  <EditorInput
                    className="w-full"
                    disabled={readonly}
                    placeholder={readonly ? "Aucune description" : ""}
                    value={ctrl("description").value || ""}
                    onChange={(e) => ctrl("description").onChange(e)}
                  />
                }
              />
            </div>
            <div className="space-y-4">
              <Heading size="4">Prix de vente</Heading>

              <PageColumns>
                <FormInput
                  ctrl={ctrl("price")}
                  label="Prix"
                  type="formatted"
                  format="price"
                />
                <FormInput
                  ctrl={ctrl("tva")}
                  label="TVA"
                  type="select"
                  options={tvaOptions}
                />
                <div className="w-1/3">
                  <InputLabel
                    label="Unité"
                    input={
                      <InputUnit
                        disabled={readonly}
                        className="w-full"
                        value={ctrl("unit").value}
                        onValueChange={ctrl("unit").onChange}
                      />
                    }
                  />
                </div>
              </PageColumns>

              <PageColumns>
                <FormInput
                  type="select"
                  label="Récurrence"
                  ctrl={ctrl("subscription")}
                  options={frequencyOptions}
                />
              </PageColumns>

              {readonly && (
                <>
                  <Heading size="4">Accès rapide</Heading>
                  <Link href={getInvoicesLink("invoices")}>Factures</Link>
                  {", "}
                  <Link href={getInvoicesLink("quotes")}>Devis</Link>
                  {", "}
                  <Link href={getInvoicesLink("supplier_quotes")}>
                    Commandes
                  </Link>
                  {", "}
                  <Link href={getInvoicesLink("supplier_invoices")}>
                    Factures fournisseur
                  </Link>
                </>
              )}
            </div>
            <div className="space-y-4">
              <Heading size="4">Fournisseurs et prix d'achat</Heading>
              <ArticleSuppliersInput
                id={id}
                readonly={readonly}
                value={[
                  ctrl("suppliers").value || [],
                  ctrl("suppliers_details").value || {},
                ]}
                onChange={function (
                  suppliers: string[],
                  details: Articles["suppliers_details"]
                ): void {
                  ctrl("suppliers").onChange(suppliers);
                  ctrl("suppliers_details").onChange(details);
                }}
              />
            </div>

            {hasAccess("ACCOUNTING_READ") && (
              <div>
                <Heading size="4" className="mb-2">
                  Comptabilité
                </Heading>
                <PageColumns>
                  <InputLabel
                    className="w-1/4"
                    label="Compte d'achat"
                    input={
                      <AccountingAccountInput
                        value={ctrl("accounting.buy").value}
                        onChange={(value) =>
                          ctrl("accounting.buy").onChange(value)
                        }
                        placeholder="Compte d'achat"
                        readonly={readonly || !hasAccess("ACCOUNTING_WRITE")}
                      />
                    }
                  />
                  <InputLabel
                    className="w-1/4"
                    label="Compte de vente"
                    input={
                      <AccountingAccountInput
                        value={ctrl("accounting.sell").value}
                        onChange={(value) =>
                          ctrl("accounting.sell").onChange(value)
                        }
                        placeholder="Compte de vente"
                        readonly={readonly || !hasAccess("ACCOUNTING_WRITE")}
                      />
                    }
                  />
                </PageColumns>
              </div>
            )}

            <div className="space-y-4">
              <Heading size="4">Notes et documents internes</Heading>
              <InputLabel
                label="Notes"
                input={
                  <EditorInput
                    key={readonly ? ctrl("notes").value : undefined}
                    placeholder={
                      readonly
                        ? "Aucune note"
                        : "Cliquez pour ajouter des notes"
                    }
                    disabled={readonly}
                    value={ctrl("notes").value || ""}
                    onChange={(e) => ctrl("notes").onChange(e)}
                  />
                }
              />
              <FormInput
                type="files"
                label="Documents"
                ctrl={ctrl("documents")}
                rest={{
                  table: "articles",
                  id: draft.id || "",
                  column: "documents",
                }}
              />
            </div>
            <CustomFieldsInput
              table={"articles"}
              ctrl={ctrl("fields")}
              readonly={readonly}
              entityId={draft.id || ""}
            />
            <div>
              <Timeline
                entity="articles"
                id={draft.id}
                viewRoute={ROUTES.ProductsView}
                translations={ArticlesFieldsNames() as any}
              />
            </div>
          </div>
        </FormContext>
      </div>
    </>
  );
};
