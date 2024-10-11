import { Button } from "@atoms/button/button";
import { Section } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { RestTable } from "@components/table-rest";
import { useArticle } from "@features/articles/hooks/use-articles";
import { useAuth } from "@features/auth/state/use-auth";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { Invoices } from "@features/invoices/types/types";
import { ServiceTimesColumns } from "@features/service/configuration";
import { useServiceItems } from "@features/service/hooks/use-service-items";
import { useServiceTimes } from "@features/service/hooks/use-service-times";
import { ServiceItems } from "@features/service/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { ClockIcon, CubeIcon } from "@heroicons/react/16/solid";
import { UserIcon } from "@heroicons/react/20/solid";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { EditorInput } from "@molecules/editor-input";
import { InvoiceRestDocument } from "../../invoices/components/invoice-lines-input/invoice-input-rest-card";
import { ServiceItemStatus } from "./service-item-status";
import { Contacts } from "@features/contacts/types/types";
import { Unit } from "@atoms/input/input-unit";
import { useInvoice } from "@features/invoices/hooks/use-invoices";

export const ServiceItemsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { user } = useAuth();

  const {
    isPending,
    ctrl,
    draft,
    save: _save,
  } = useReadDraftRest<ServiceItems>("service_items", id || "new", readonly);

  const { article } = useArticle(draft.article);

  const { invoice: quote } = useInvoice(draft.for_rel_quote || "");
  const { service_items: otherServiceItems } = useServiceItems({
    query: { for_rel_quote: draft.for_rel_quote },
  });

  const createTime = useEditFromCtrlK();
  const { service_times: serviceTimes } = useServiceTimes({
    query: { service: draft.id },
  });

  if (isPending) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <Section>
          <div className="float-right space-x-2 items-center flex-row flex">
            <TagsInput ctrl={ctrl("tags")} />
            <UsersInput ctrl={ctrl("assigned")} />
            <ServiceItemStatus
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
          Service
        </Section>

        <div className="mt-4">
          <FormInput size="lg" label="Titre" type="text" ctrl={ctrl("title")} />
        </div>

        <div className="mt-4">
          <div className="space-y-2 mt-2">
            <EditorInput
              key={readonly ? ctrl("notes").value : undefined}
              placeholder={
                readonly ? "Aucune note" : "Cliquez pour ajouter des notes"
              }
              disabled={readonly}
              value={ctrl("notes").value || ""}
              onChange={(e) => ctrl("notes").onChange(e)}
            />
            {(!readonly || ctrl("documents").value?.length) && (
              <FilesInput
                disabled={readonly}
                ctrl={ctrl("documents")}
                rel={{
                  table: "invoices",
                  id: draft.id || "",
                  field: "documents",
                }}
              />
            )}
          </div>
        </div>

        <div className="w-full border-t my-6" />

        <div className="mt-4 space-x-2 items-center flex-row flex">
          <RestDocumentsInput
            size="xl"
            entity="articles"
            ctrl={ctrl("article")}
            label="Article"
            placeholder="Sélectionner un article"
            filter={{ type: "service" } as any}
            icon={(p) => <CubeIcon {...p} />}
          />
          <InputButton
            label={ctrl("quantity_spent").value || "Temps estimé"}
            icon={(p) => <ClockIcon {...p} />}
            placeholder={"Nombre de '" + (article?.unit || "unités") + "'"}
            ctrl={ctrl("quantity_expected")}
          >
            {(ctrl("quantity_spent").value || 0) +
              " / " +
              (ctrl("quantity_expected").value || 0)}{" "}
            <Unit unit={article?.unit} />
          </InputButton>
        </div>

        <div className="w-full border-t my-6" />

        <div className="flex space-x-2 items-center my-2">
          <RestDocumentsInput
            size="xl"
            entity="contacts"
            ctrl={ctrl("client")}
            label="Client"
            placeholder="Sélectionner un client"
            icon={(p) => <UserIcon {...p} />}
            filter={
              {
                is_client: true,
                ...(quote ? { id: [quote.contact, quote.client] } : {}),
              } as Partial<Contacts>
            }
          />

          <InvoiceRestDocument
            size="xl"
            ctrl={ctrl("for_rel_quote")}
            label="Devis associé"
            placeholder="Sélectionner le devis associé"
            icon={(p) => <DocumentIcon {...p} />}
            filter={
              {
                type: "quotes",
                state: ["draft", "purchase_order", "completed"] as any,
                ...(draft.article ? { "articles.all": draft.article } : {}),
                ...(quote ? { client: [quote.client, quote.contact] } : {}),
              } as Partial<Invoices>
            }
          />
        </div>

        <div className="w-full border-t my-6" />

        <CustomFieldsInput
          className="mt-8"
          table={"invoices"}
          ctrl={ctrl("fields")}
          readonly={readonly}
          entityId={draft.id || ""}
        />

        <div className="mt-8">
          <Section className="mb-2">
            <Button
              theme="primary"
              size="sm"
              className="float-right"
              onClick={() =>
                createTime("service_times", "new", {
                  service: draft.id,
                  assigned: user?.id ? [user?.id] : [],
                  date: Date.now(),
                  quantity: 1,
                })
              }
            >
              Ajouter
            </Button>
            Temps passé
          </Section>
          <RestTable
            entity="service_times"
            data={serviceTimes}
            columns={ServiceTimesColumns}
          />
        </div>

        <div className="mt-8">
          <Section className="mb-2">Autres taches pour ce devis</Section>
          <RestTable
            entity="service_items"
            data={otherServiceItems}
            columns={[{ title: "id", render: (i) => i.id }]}
          />
        </div>
      </FormContext>
    </div>
  );
};
