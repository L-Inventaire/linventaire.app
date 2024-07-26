import { Tag } from "@atoms/badge/tag";
import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { Invoices } from "@features/invoices/types/types";
import { formatTime } from "@features/utils/format/dates";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { ModalHr, PageColumns } from "@views/client/_layout/page";

export const InvoiceRecurrenceInput = ({
  ctrl,
  invoice,
  readonly,
}: {
  ctrl: FormControllerFuncType<Invoices>;
  invoice: Invoices;
  readonly?: boolean;
}) => {
  const frequencyOptions = [
    { value: "weekly", label: "Hebdomadaire" },
    { value: "monthly", label: "Mensuelle" },
    { value: "yearly", label: "Annuelle" },
  ];

  const getAllDates = (max = 100) => {
    let hasMore = false;
    const dates = [];
    let date = Math.max(
      new Date(invoice.emit_date || 0).getTime(),
      new Date(invoice.subscription?.start || 0).getTime()
    );
    let end = Math.max(
      new Date(invoice.emit_date || 0).getTime(),
      new Date(invoice.subscription?.end || 0).getTime() + 1000 * 60 * 60 * 24 // Add a day for time zones issues
    );
    while (date <= end) {
      dates.push(date);
      const nextDate = new Date(date);
      if (invoice.subscription?.frequency === "weekly")
        nextDate.setDate(nextDate.getDate() + 7);
      else if (invoice.subscription?.frequency === "monthly")
        nextDate.setMonth(nextDate.getMonth() + 1);
      else nextDate.setFullYear(nextDate.getFullYear() + 1);
      if (dates.length > max) {
        hasMore = true;
        break;
      }
      date = nextDate.getTime();
    }
    return { dates, hasMore };
  };

  const { dates, hasMore } = getAllDates(25);

  return (
    <InputButton
      placeholder="Récurrence"
      icon={(p) => <ArrowPathIcon {...p} />}
      readonly={readonly}
      content={
        <>
          <Info>
            Activez la récurrence pour dupliquer cette facture automatiquement.
          </Info>
          <FormInput
            type="boolean"
            placeholder="Activer la récurrence"
            onChange={(e) => {
              ctrl("subscription").onChange({
                enabled: e,
                frequency: invoice?.subscription?.frequency || "monthly",
                start: invoice?.subscription?.start || Date.now(),
                end:
                  invoice?.subscription?.end ||
                  Date.now() + 1000 * 60 * 60 * 24 * 365,
                as_draft: true,
              });
            }}
            value={ctrl("subscription.enabled").value}
          />
          {ctrl("subscription.enabled").value && (
            <>
              <PageColumns>
                <FormInput
                  type="select"
                  label="Fréquence"
                  ctrl={ctrl("subscription.frequency")}
                  options={frequencyOptions}
                />
                <FormInput
                  type="date"
                  label="Début (inclus)"
                  ctrl={ctrl("subscription.start")}
                />
                <FormInput
                  type="date"
                  label="Fin (inclus)"
                  ctrl={ctrl("subscription.end")}
                />
              </PageColumns>

              <div className="mt-2" />
              <Info>
                Prochaines factures:
                <br />
                {(() => {
                  return [
                    ...dates.map((d) => (
                      <Tag
                        size="xs"
                        icon={<></>}
                        key={d}
                        noColor
                        className="bg-white mr-1 mb-1 text-slate-800"
                      >
                        {formatTime(d, {
                          keepDate: true,
                          hideTime: true,
                        })}
                      </Tag>
                    )),
                    ...(hasMore
                      ? [
                          <Tag
                            size="xs"
                            icon={<></>}
                            key={"..."}
                            noColor
                            className="bg-white mr-1 mb-1 text-slate-800"
                          >
                            ...
                          </Tag>,
                        ]
                      : []),
                  ];
                })()}
              </Info>

              <ModalHr />
              <FormInput
                type="boolean"
                placeholder="Dupliquer en tant que brouillon"
                ctrl={ctrl("subscription.as_draft")}
              />
              <Info>
                Par défaut les factures sont dupliquées et envoyées au client
                pour paiement (tacite reconduction).
              </Info>
            </>
          )}
        </>
      }
      value={invoice.subscription?.enabled}
    >
      <div className="space-y-0 w-max flex flex-col text-left">
        <Base>
          {invoice.subscription?.as_draft
            ? "Dupliquer la facture en brouillon"
            : "Dupliquer la facture et envoyer"}
        </Base>
        <Info>
          {dates.length} {hasMore ? "+" : ""} factures (
          {
            frequencyOptions.find(
              (a) => a.value === invoice.subscription?.frequency
            )?.label
          }
          )
        </Info>
        <Info>
          Début le{" "}
          {formatTime(invoice.subscription?.start || 0, {
            hideTime: true,
            keepDate: true,
          })}{" "}
          fin le{" "}
          {formatTime(invoice.subscription?.end || 0, {
            hideTime: true,
            keepDate: true,
          })}
          .
        </Info>
      </div>
    </InputButton>
  );
};
