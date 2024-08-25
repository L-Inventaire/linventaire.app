import { Button } from "@atoms/button/button";
import { Section } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { RestTable } from "@components/table-rest";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { Invoices } from "@features/invoices/types/types";
import { useServiceItems } from "@features/service/hooks/use-service-items";
import { useServiceTimes } from "@features/service/hooks/use-service-times";
import { ServiceItems } from "@features/service/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { ClockIcon, CubeIcon } from "@heroicons/react/16/solid";
import { BriefcaseIcon, UserIcon } from "@heroicons/react/20/solid";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { EditorInput } from "@molecules/editor-input";
import { ServiceItemStatus } from "./service-item-status";
import { InvoiceRestDocument } from "../../invoices/components/invoice-lines-input/invoice-input-rest-card";
import { InputButton } from "@components/input-button";

export const ServiceItemsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { isPending, ctrl, draft } = useReadDraftRest<ServiceItems>(
    "service_items",
    id || "new",
    readonly
  );

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
        <div className="mt-4">
          <FormInput label="Titre" type="text" ctrl={ctrl("title")} />
        </div>

        <div className="mt-4 space-x-2">
          <ServiceItemStatus
            value={draft.state}
            onChange={ctrl("state").onChange}
          />
          <TagsInput ctrl={ctrl("tags")} />
          <UsersInput ctrl={ctrl("assigned")} />
          <InputButton
            label={ctrl("hours_spent").value || "Temps estimé"}
            icon={(p) => <ClockIcon {...p} />}
            placeholder={"Nombre d'unité en fonction de l'article"}
            ctrl={ctrl("hours_expected")}
          >
            {(ctrl("hours_spent").value || 0) +
              " / " +
              (ctrl("hours_expected").value || 0)}
          </InputButton>
        </div>

        <div className="mt-2">
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

        <div className="flex space-x-2 items-center my-2">
          <RestDocumentsInput
            size="xl"
            entity="contacts"
            ctrl={ctrl("client")}
            label="Client"
            placeholder="Sélectionner un client"
            icon={(p) => <UserIcon {...p} />}
          />

          <InvoiceRestDocument
            size="xl"
            ctrl={ctrl("for_rel_quote")}
            label="Devis associé"
            placeholder="Sélectionner le devis associé"
            icon={(p) => <DocumentIcon {...p} />}
            filter={{ type: "quotes" } as Partial<Invoices>}
          />

          <RestDocumentsInput
            size="xl"
            entity="articles"
            ctrl={ctrl("article")}
            label="Article"
            placeholder="Sélectionner un article"
            filter={{ type: "service" } as any}
            icon={(p) => <CubeIcon {...p} />}
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
              size="md"
              className="float-right"
              onClick={() => createTime("service_times")}
            >
              Ajouter
            </Button>
            Temps passé
          </Section>
          <RestTable
            entity="service_times"
            data={serviceTimes}
            columns={[
              { title: "id", render: (i) => i.id },
              { title: "time", render: (i) => i.hours },
            ]}
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
