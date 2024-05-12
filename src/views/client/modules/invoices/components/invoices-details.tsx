import { Checkbox } from "@atoms/input/input-checkbox";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { AddressInput } from "@components/address-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { PageLoader } from "@components/page-loader";
import { RestDocumentsInput } from "@components/rest-documents-input";
import { Invoices } from "@features/invoices/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  PageColumns,
  PageBlock,
  PageBlockHr,
} from "@views/client/_layout/page";

export const InvoicesDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { isPending, ctrl, draft, setDraft } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new",
    readonly
  );

  if (isPending || (id && draft.id !== id)) return <PageLoader />;

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow">
            <PageBlock title="Devis">
              <div className="space-y-2">
                <PageColumns>
                  <FormInput
                    type="rest_documents"
                    rest={{ table: "invoices", column: "client" }}
                    label="Client"
                    ctrl={ctrl("client")}
                    max={1}
                  />
                  <FormInput
                    type="rest_documents"
                    rest={{ table: "invoices", column: "contact" }}
                    label="Contact (optionnel)"
                    ctrl={ctrl("contact")}
                    max={1}
                  />
                </PageColumns>

                <PageBlockHr />

                <PageColumns>
                  <FormInput ctrl={ctrl("reference")} label="Référence" />
                  <FormInput
                    ctrl={ctrl("name")}
                    label="Titre"
                    placeholder="Titre interne"
                  />
                </PageColumns>
                <PageColumns>
                  <FormInput
                    ctrl={ctrl("tags")}
                    label="Étiquettes"
                    type="tags"
                  />
                  <FormInput
                    ctrl={ctrl("assigned")}
                    label="Assigné à"
                    type="users"
                  />
                </PageColumns>
              </div>
            </PageBlock>
            <PageBlock title="Prestation">
              Lignes <br />
              Réduction globale
              <br />
              Résumé (total TVA / HT etc)
            </PageBlock>
            <PageBlock closable title="Informations additionelles">
              <div className="space-y-2">
                <FormInput
                  type="date"
                  label="Date d'émission"
                  ctrl={ctrl("emit_date")}
                />
                <FormInput
                  type="files"
                  label="Pièces jointes partagées avec le client"
                  ctrl={ctrl("attachments")}
                />

                <PageBlockHr />

                {!ctrl(["delivery_date"]).value && !readonly && (
                  <FormInput
                    placeholder="Ajouter une date de livraison"
                    type="boolean"
                    value={ctrl(["delivery_date"]).value}
                    onChange={(e) =>
                      ctrl(["delivery_date"]).onChange(
                        e ? Date.now() + 1000 * 60 * 60 * 24 * 7 : 0
                      )
                    }
                  />
                )}
                {!!ctrl(["delivery_date"]).value && (
                  <FormInput
                    type="date"
                    label="Date de livraison"
                    ctrl={ctrl("delivery_date")}
                  />
                )}

                {!readonly && (
                  <FormInput
                    placeholder="Ajouter une adresse de livraison"
                    type="boolean"
                    value={ctrl(["delivery_address"]).value}
                    onChange={(e) =>
                      ctrl(["delivery_address"]).onChange(e ? {} : null)
                    }
                  />
                )}
                {ctrl(["delivery_address"]).value !== null && (
                  <>
                    <AddressInput ctrl={ctrl("delivery_address")} />
                  </>
                )}
              </div>
            </PageBlock>
            <PageBlock closable title="Paiement">
              Currency
              <br />
              Informations de paiement
            </PageBlock>
            <PageBlock closable title="Format">
              Langue
              <br />
              Format
            </PageBlock>
            <PageBlock closable title="Rappels">
              Rappels
            </PageBlock>
            <PageBlock closable title="Récurrence">
              Récurrence
            </PageBlock>
            <PageBlock closable title="Notes et documents">
              Notes et documents
            </PageBlock>
            <PageBlock closable title="Champs additionels">
              Custom
            </PageBlock>
          </div>
          <div className="grow">
            <PageBlock title="Status">
              state
              <br />
              related items
            </PageBlock>
            <div className="p-8">
              <div className="w-full bg-white shadow-md h-80"></div>
            </div>
          </div>
        </PageColumns>
      </FormContext>
    </>
  );
};
