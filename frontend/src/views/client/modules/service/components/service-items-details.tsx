import { Button } from "@atoms/button/button";
import { InputSignature } from "@atoms/input/input-signature";
import InputTime from "@atoms/input/input-time";
import { PageLoader } from "@atoms/page-loader";
import { Section } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { RestTable } from "@components/table-rest";
import { useArticle } from "@features/articles/hooks/use-articles";
import { useAuth } from "@features/auth/state/use-auth";
import { useContactsRecursively } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { ROUTES } from "@features/routes";
import {
  ServiceItemsColumns,
  ServiceTimesColumns,
} from "@features/service/configuration";
import { useServiceItems } from "@features/service/hooks/use-service-items";
import { useServiceTimes } from "@features/service/hooks/use-service-times";
import { ServiceItems } from "@features/service/types/types";
import {
  timeBase60ToDecimal,
  timeDecimalToBase60,
} from "@features/utils/format/dates";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { CubeIcon } from "@heroicons/react/16/solid";
import { UserIcon } from "@heroicons/react/20/solid";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { EditorInput } from "@molecules/editor-input";
import { Timeline } from "@molecules/timeline";
import { Checkbox, Heading } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { InvoiceRestDocument } from "../../invoices/components/invoice-lines-input/invoice-input-rest-card";
import { InlineSpentTimeInput, SpentTime } from "./inline-spent-time-input";
import { ServiceItemStatus } from "./service-item-status";

export const ServiceItemsDetailsPage = ({
  readonly,
  id,
  onChangeSpentTime,
}: {
  readonly?: boolean;
  id: string;
  onChangeSpentTime?: (value: SpentTime[]) => void;
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

  const [onCreateAddSpentTime, setOnCreateAddSpentTime] = useState<SpentTime[]>(
    []
  );
  const [markAsDone, setMarkAsDone] = useState<boolean>(false);

  useEffect(() => {
    if (!readonly && !draft.id) {
      const e = onCreateAddSpentTime;
      if (markAsDone) {
        ctrl("state").onChange("done");
      } else if (
        e.reduce((a, b) => a + b.quantity, 0) >= ctrl("quantity_expected").value
      ) {
        ctrl("state").onChange("in_review");
      } else if (e.reduce((a, b) => a + b.quantity, 0) > 0) {
        ctrl("state").onChange("in_progress");
      } else {
        ctrl("state").onChange("todo");
      }
      onChangeSpentTime?.(e);
    }
  }, [onCreateAddSpentTime, ctrl("quantity_expected").value, markAsDone]);

  useEffect(() => {
    if (draft.state === "done") {
      setMarkAsDone(true);
    }
  }, [draft.state === "done"]);

  const quoteContacts = [
    ...useContactsRecursively(quote?.contact, 3),
    ...useContactsRecursively(quote?.client, 3),
  ].filter(Boolean);

  if (isPending || (id && draft.id !== id)) return <PageLoader />;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <Heading>
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
        </Heading>

        <div className="mt-4 flex space-x-2">
          <FormInput
            size="lg"
            label="Description"
            placeholder="Dépannage téléphonique"
            type="text"
            ctrl={ctrl("title")}
          />
          {(!article?.unit || article?.unit === "h") && (
            <InputTime
              size="lg"
              label={"Temps"}
              labelProps={{ className: "whitespace-nowrap" }}
              onChange={(_, number) => {
                const quantity = timeBase60ToDecimal(number);
                ctrl("quantity_expected").onChange(quantity);
              }}
              className={"!mx-3 flex-grow"}
              value={timeDecimalToBase60(ctrl("quantity_expected").value || 0)}
            />
          )}
        </div>

        <div className="mt-4">
          <RestDocumentsInput
            size="xl"
            entity="contacts"
            ctrl={ctrl("client")}
            label="Client"
            placeholder="Sélectionner un client"
            icon={(p) => <UserIcon {...p} />}
            filter={
              quote
                ? {
                    id: quoteContacts.map((q) => q.id) as unknown as string,
                  }
                : ({
                    is_client: true,
                  } as Partial<Contacts>)
            }
          />
        </div>

        {ctrl("title").value && ctrl("client").value && (
          <>
            <Heading size="4" className="mt-8">
              Facturation
            </Heading>

            {!!(!readonly || ctrl("for_no_quote").value) && (
              <label className="mt-1 flex space-x-2 items-center">
                <Checkbox
                  disabled={readonly}
                  size="2"
                  checked={ctrl("for_no_quote").value}
                  onCheckedChange={(checked: boolean) =>
                    ctrl("for_no_quote").onChange(checked)
                  }
                />
                <span>Non facturable / Contrat</span>
              </label>
            )}

            <div className="flex space-x-2 items-center my-2">
              {!ctrl("for_no_quote").value && (
                <div className={"w-1/2"}>
                  <InvoiceRestDocument
                    size="xl"
                    value={ctrl("for_rel_quote").value}
                    onChange={
                      ((e: any, val: Invoices) => {
                        ctrl("for_rel_quote").onChange(e);
                        if (
                          val?.client &&
                          val?.contact !== ctrl("client").value
                        ) {
                          ctrl("client").onChange(val.client);
                        }
                        const services =
                          val?.content?.filter((c) => c.type === "service") ||
                          [];
                        if (services.length && !draft.article) {
                          ctrl("article").onChange(services[0].article);
                          ctrl("quantity_expected").onChange(
                            services[0].quantity
                          );
                        }
                      }) as any
                    }
                    label="Devis associé"
                    placeholder="Sélectionner le devis associé"
                    icon={(p) => <DocumentIcon {...p} />}
                    filter={
                      {
                        type: "quotes",
                        state: [
                          "purchase_order",
                          "completed",
                          "recurring",
                        ] as any,
                        ...(draft.article
                          ? { "articles.all": draft.article }
                          : {}),
                        ...(ctrl("client").value &&
                        ctrl("client").value !== quote?.client
                          ? { client: [ctrl("client").value] }
                          : {}),
                      } as Partial<Invoices>
                    }
                  />
                </div>
              )}
              <div className={"w-1/2"}>
                <RestDocumentsInput
                  size="xl"
                  entity="articles"
                  ctrl={ctrl("article")}
                  label="Article"
                  placeholder="Sélectionner un article"
                  className="flex-grow"
                  filter={
                    {
                      type: "service",
                      ...(ctrl("for_rel_quote").value &&
                      quote?.content?.map((a) => a.article)?.length &&
                      !["completed", "closed", "recurring"].includes(
                        quote.state
                      )
                        ? { id: quote?.content?.map((a) => a.article) }
                        : {}),
                    } as any
                  }
                  icon={(p) => <CubeIcon {...p} />}
                />
              </div>
            </div>

            <CustomFieldsInput
              className="mt-8"
              table={"service_items"}
              ctrl={ctrl("fields")}
              readonly={readonly}
              entityId={draft.id || ""}
            />

            {draft?.id && (
              <div className="mt-12 space-y-4">
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
            )}

            {!draft?.id && (
              <div className="mt-12">
                <Heading size="4">Temps déjà effectué</Heading>
                <InlineSpentTimeInput
                  unit={article?.unit ?? "h"}
                  quantity={ctrl("quantity_expected").value}
                  value={onCreateAddSpentTime}
                  onChange={setOnCreateAddSpentTime}
                />
                {!!onCreateAddSpentTime.length && (
                  <label className="mt-4 flex space-x-2 items-center">
                    <Checkbox
                      size="3"
                      checked={markAsDone}
                      onCheckedChange={(checked: boolean) =>
                        setMarkAsDone(checked)
                      }
                    />
                    <span>Marquer la tache comme terminé</span>
                  </label>
                )}
              </div>
            )}

            <div className="mt-12">
              <Heading size="4">Signatures</Heading>
              <InputSignature
                disabled={readonly}
                value={ctrl("signatures").value || []}
                onChange={(e) => ctrl("signatures").onChange(e)}
                clientId={draft.client_id}
              />
            </div>

            <div className="mt-12">
              <Heading size="4">Notes et documents internes</Heading>
              <div className="mt-4">
                <div className="space-y-2 mt-2">
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
                  {(!readonly || !!ctrl("documents").value?.length) && (
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
            </div>
          </>
        )}

        {draft.id && draft.for_rel_quote && (
          <>
            <div className="w-full border-t my-6" />
            <div className="mt-8">
              <Section className="mb-2">Autres taches pour ce devis</Section>
              <RestTable
                entity="service_items"
                data={otherServiceItems}
                columns={ServiceItemsColumns}
              />
            </div>
          </>
        )}

        {draft.id && readonly && (
          <div className="mt-8">
            <Timeline
              entity="service_items"
              id={draft.id}
              viewRoute={ROUTES.ServiceItemsView}
            />
          </div>
        )}
      </FormContext>
    </div>
  );
};
