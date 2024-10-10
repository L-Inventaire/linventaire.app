import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import { InputUnit } from "@atoms/input/input-unit";
import { PageLoader } from "@atoms/page-loader";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { UsersInput } from "@components/input-rest/users";
import { Articles } from "@features/articles/types/types";
import { tvaOptions } from "@features/utils/constants";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { EditorInput } from "@molecules/editor-input";
import { PageBlock, PageColumns } from "@views/client/_layout/page";
import { ArticleSuppliersInput } from "./article-suppliers-input";

export const frequencyOptions = [
  { value: "", label: "Pas de renouvellement" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "yearly", label: "Annuel" },
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
                    size="md"
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
                    size="md"
                    type="scan"
                  />
                  <FormInput ctrl={ctrl("name")} label="Nom" size="md" />
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
                  <div className="w-1/3">
                    <InputLabel
                      label="Unité"
                      input={
                        <InputUnit
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
                    label="Renouvellement"
                    ctrl={ctrl("subscription")}
                    options={frequencyOptions}
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
            </PageBlock>
          </div>
          <div className="grow lg:max-w-xl">
            <CustomFieldsInput
              table={"articles"}
              ctrl={ctrl("fields")}
              readonly={readonly}
              entityId={draft.id || ""}
            />
          </div>
        </PageColumns>
      </FormContext>
    </>
  );
};
