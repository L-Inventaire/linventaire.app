import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { EditorInput } from "@components/editor-input";
import { FilesInput } from "@components/files-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { PageLoader } from "@components/page-loader";
import { UsersInput } from "@components/users-input";
import { Articles } from "@features/articles/types/types";
import { tvaOptions, unitOptions } from "@features/utils/constants/taxes";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { PageBlock, PageColumns } from "@views/client/_layout/page";
import { ArticleSuppliersInput } from "./article-suppliers-input";

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

  if (isPending || (id && draft.id !== id)) return <PageLoader />;

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow">
            <PageBlock title="Article">
              <div className="space-y-4">
                <PageColumns>
                  <FormInput
                    className="lg:w-1/4"
                    ctrl={ctrl("type")}
                    label="Type"
                    size="lg"
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
                  />
                  <FormInput
                    className="lg:w-1/4"
                    ctrl={ctrl("internal_reference")}
                    label="Référence"
                    size="lg"
                    type="scan"
                  />
                  <FormInput ctrl={ctrl("name")} label="Nom" size="lg" />
                </PageColumns>
                <InputLabel
                  label="Description"
                  input={
                    <Input
                      className="w-full"
                      multiline
                      disabled={readonly}
                      value={ctrl("description").value || ""}
                      onChange={(e) =>
                        ctrl("description").onChange(e.target.value)
                      }
                    />
                  }
                />
                <FormInput ctrl={ctrl("tags")} label="Étiquettes" type="tags" />
                <InputLabel
                  label="Assignés"
                  input={
                    <UsersInput
                      disabled={readonly}
                      value={ctrl("assigned").value || []}
                      onChange={(e) => ctrl("assigned").onChange(e)}
                    />
                  }
                />
              </div>
            </PageBlock>
            <PageBlock title="Prix">
              <div className="space-y-4">
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
                  <FormInput
                    ctrl={ctrl("unit")}
                    label="Unité"
                    type="text"
                    options={unitOptions}
                  />
                </PageColumns>
              </div>
            </PageBlock>
            <PageBlock title="Fournisseurs">
              <ArticleSuppliersInput
                id={id}
                readonly={readonly}
                value={[
                  ctrl("suppliers").value || [],
                  ctrl("suppliers_details").value,
                ]}
                onChange={function (
                  suppliers: string[],
                  details: Articles["suppliers_details"]
                ): void {
                  ctrl("suppliers").onChange(suppliers);
                  ctrl("suppliers_details").onChange(details);
                }}
              />
            </PageBlock>
            <PageBlock title="Notes et documents">
              <div className="space-y-2 mt-4">
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
                <InputLabel
                  label="Documents"
                  input={
                    <FilesInput
                      disabled={readonly}
                      value={ctrl("documents").value || ""}
                      onChange={(e) => ctrl("documents").onChange(e)}
                      rel={{
                        table: "contacts",
                        id: draft.id || "",
                        field: "documents",
                      }}
                    />
                  }
                />
              </div>
            </PageBlock>
          </div>
          <div className="grow lg:max-w-xl">
            <PageBlock title="Stock" closable>
              <div className="space-y-4">
                <FormInput
                  ctrl={ctrl("stock_available")}
                  label="Stock disponible"
                  type="number"
                  size="lg"
                />
                <FormInput
                  ctrl={ctrl("stock_bought")}
                  label="Commandé"
                  type="number"
                />
                <FormInput
                  ctrl={ctrl("stock_reserved")}
                  label="Reservé"
                  type="number"
                />
                <FormInput
                  ctrl={ctrl("stock_delivered")}
                  label="Livré"
                  type="number"
                />
              </div>
            </PageBlock>
            <PageBlock closable title="Information complémentaire">
              <CustomFieldsInput
                table={"articles"}
                ctrl={ctrl("fields")}
                readonly={readonly}
                entityId={draft.id || ""}
              />
            </PageBlock>
          </div>
        </PageColumns>
      </FormContext>
    </>
  );
};
