import { Modal, ModalContent } from "@atoms/modal/modal";
import { Base, Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormControllerFuncType,
  useFormController,
} from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { Blockquote, Button, Heading } from "@radix-ui/themes";
import { ModalHr, PageColumns } from "@views/client/_layout/page";
import { format } from "date-fns";
import _ from "lodash";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { atom, useRecoilState } from "recoil";
import { frequencyOptions } from "../../articles/components/article-details";

const optionsDelays = [
  {
    value: "1y",
    label: "1 an",
  },
  {
    value: "2y",
    label: "2 an",
  },
  {
    value: "3y",
    label: "3 an",
  },
];

const optionsStartDates = [
  {
    value: "after_first_invoice",
    label: "Lorsque les éléments non récurrents sont facturés",
  },
  {
    value: "acceptance_start",
    label: "Lorsque le devis est accepté",
  },
  {
    value: "date",
    label: "Date spécifique",
  },
];

const optionsEndDates = [
  {
    value: "none",
    label: "Ne pas définir de fin",
  },
  {
    value: "delay",
    label: "Délai",
  },
  {
    value: "date",
    label: "Date spécifique",
  },
];

const optionsInvoiceDate = [
  {
    value: "first_day",
    label: "Date de renouvellement",
  },
  {
    value: "first_workday",
    label: "Premier jour ouvré de la période",
  },
  {
    value: "monday",
    label: "Lundi suivant la date de renouvellement",
  },
  {
    value: "last_day",
    label: "Dernier jour de la période",
  },
  {
    value: "last_workday",
    label: "Dernier jour ouvré de la période",
  },
];

const optionsRenewAs = [
  {
    value: "draft",
    label: "Dupliquer le devis en brouillon",
  },
  {
    value: "sent",
    label: "Dupliquer le devis et l'envoyer au client",
  },
  {
    value: "closed",
    label: "Clôturer",
  },
];

export const InvoiceRecurrenceInput = ({
  ctrl,
  invoice,
  readonly,
  btnKey,
}: {
  ctrl: FormControllerFuncType<Invoices>;
  invoice: Invoices;
  readonly?: boolean;
  btnKey?: string;
}) => {
  const hasSubscription = !!invoice.content?.find((a) => a.subscription);
  const subscriptions = _.uniq(
    invoice.content?.map((a) => a.subscription)
  ).filter(Boolean) as string[];
  const frequencyOrder = ["daily", "weekly", "monthly", "yearly"];
  const minimalFrequency = _.minBy(subscriptions, (a) =>
    frequencyOrder.indexOf(a)
  );

  const getAllDates = (max = 100) => {
    let hasMore = false;
    const dates = [];
    const start =
      invoice.subscription?.start_type === "date"
        ? Math.max(
            new Date(invoice.emit_date || 0).getTime(),
            new Date(invoice.subscription?.start || 0).getTime()
          )
        : new Date(invoice.emit_date || 0).getTime();
    const end =
      invoice.subscription?.end_type === "date"
        ? Math.max(
            new Date(invoice.emit_date || 0).getTime(),
            new Date(invoice.subscription?.end || 0).getTime() +
              1000 * 60 * 60 * 24 // Add a day for time zones issues
          )
        : 100000000000000;
    let date = start;
    while (date <= end) {
      if (
        date > start ||
        invoice.subscription?.start_type === "acceptance_start"
      ) {
        // Update date to the next monday or first day of the month or (depends on the user choice)
        if (invoice.subscription?.invoice_date === "monday") {
          // Get next monday
          const nextMonday = new Date(date);
          nextMonday.setDate(
            new Date(date).getDate() + ((1 + 7 - new Date(date).getDay()) % 7)
          );
          date = nextMonday.getTime();
        } else if (invoice.subscription?.invoice_date === "first_workday") {
          // Get next workday
          const nextWorkday = new Date(date);
          while ([0, 6].includes(nextWorkday.getDay())) {
            nextWorkday.setDate(nextWorkday.getDate() + 1);
          }
          date = nextWorkday.getTime();
        } else if (invoice.subscription?.invoice_date === "last_workday") {
          // Get last workday
          const nextWorkday = new Date(date);
          while ([0, 6].includes(nextWorkday.getDay())) {
            nextWorkday.setDate(nextWorkday.getDate() - 1);
          }
          date = nextWorkday.getTime();
        }

        dates.push(date);
      }

      // Compute next date
      const nextDate = new Date(date);
      if (minimalFrequency === "daily")
        nextDate.setDate(nextDate.getDate() + 1);
      else if (minimalFrequency === "weekly")
        nextDate.setDate(nextDate.getDate() + 7);
      else if (minimalFrequency === "monthly")
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

  useEffect(() => {
    if (!invoice.subscription?.start_type) {
      ctrl("subscription.start_type").onChange("after_first_invoice");
    }
    if (!invoice.subscription?.end_type) {
      ctrl("subscription.end_type").onChange("none");
    }
    if (!invoice.subscription?.renew_as) {
      ctrl("subscription.renew_as").onChange("draft");
    }
    if (!invoice.subscription?.invoice_date) {
      ctrl("subscription.invoice_date").onChange("first_day");
    }
  }, [invoice.id]);

  if (!hasSubscription) return null;

  return (
    <InputButton
      btnKey={btnKey}
      placeholder="Récurrence"
      icon={(p) => <ArrowPathIcon {...p} />}
      readonly={readonly}
      content={<RecurrenceModalContent ctrl={ctrl} invoice={invoice} />}
      value={"true"}
    >
      <div className="space-y-0 w-max flex flex-col text-left">
        <Base>
          Début{" "}
          {
            (
              {
                after_first_invoice:
                  "après la facturation des éléments non récurrents",
                acceptance_start: "après l'acceptation",
                acceptance_end: "à la fin de la première période",
                date:
                  "le " +
                  format(new Date(invoice.subscription?.start || 0), "eee PP"),
              } as any
            )[invoice.subscription?.start_type || "date"]
          }
          {invoice.subscription?.end_type === "date" ? (
            <>
              {" "}
              {" → "} fin le {format(dates[dates.length - 1], "eee PP")}
            </>
          ) : invoice.subscription?.end_type === "delay" ? (
            <>
              {" → "}
              fin{" "}
              {
                optionsDelays.find(
                  (a) => a.value === invoice.subscription?.end_delay
                )?.label
              }{" "}
              plus tard
            </>
          ) : (
            " → pas de fin"
          )}
        </Base>
        <Info>
          {invoice.subscription?.renew_as === "draft"
            ? "Une fois terminé, dupliquer le devis en brouillon."
            : invoice.subscription?.renew_as === "sent"
            ? "Une fois terminé, dupliquer le devis et l'envoyer au client."
            : "Une fois terminé, clôturer ce devis."}
        </Info>
        <Info>
          {invoice.subscription?.invoice_date === "first_day"
            ? "Facturer à date de renouvellement."
            : invoice.subscription?.invoice_date === "monday"
            ? "Facturer le lundi."
            : invoice.subscription?.invoice_date === "first_workday"
            ? "Facturer le premier jour ouvré."
            : invoice.subscription?.invoice_date === "last_day"
            ? "Facturer le dernier jour de la période"
            : "Facturer le dernier jour ouvré de la période."}
        </Info>
        <Info>
          {invoice.subscription?.end_type === "date" && (
            <>
              {dates.length} {hasMore ? "+" : ""} factures{" "}
            </>
          )}
          (Facturation minimum:{" "}
          {frequencyOptions.find((a) => a.value === minimalFrequency)?.label})
        </Info>
      </div>
    </InputButton>
  );
};

export const RecurrenceModalAtom = atom({
  key: "RecurrenceModalAtom",
  default: "",
});

export const RecurrenceModal = () => {
  const [quoteId, setQuoteId] = useRecoilState(RecurrenceModalAtom);
  return (
    <Modal open={!!quoteId} onClose={() => setQuoteId("")}>
      {!!quoteId && (
        <ModalContent title="Modifier l'abonnement">
          <RecurrenceModalPreContent
            quoteId={quoteId}
            onClose={() => setQuoteId("")}
          />
        </ModalContent>
      )}
    </Modal>
  );
};

const RecurrenceModalPreContent = ({
  quoteId,
  onClose,
}: {
  quoteId: string;
  onClose: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [val, setVal] = useState<{ subscription: Invoices["subscription"] }>({
    subscription: undefined,
  });
  const { ctrl } = useFormController(val, setVal);
  const { invoice: draft, update } = useInvoice(quoteId);

  useEffect(() => {
    if (draft) {
      ctrl("subscription").onChange(draft.subscription);
    }
  }, [draft?.id]);

  if (!draft) return null;

  return (
    <>
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        <RecurrenceModalContent invoice={draft} ctrl={ctrl} onlyEnding />
      </div>
      <div className="flex space-between mt-4">
        <Button loading={loading} variant="outline" onClick={() => onClose()}>
          Annuler
        </Button>
        <div className="grow" />
        <Button
          loading={loading}
          onClick={async () => {
            setLoading(true);
            try {
              await update.mutateAsync({
                id: draft.id,
                subscription: ctrl("subscription").value,
              });
              onClose();
            } catch (e) {
              console.error(e);
              toast.error("Erreur lors de la modification de l'abonnement");
            } finally {
              setLoading(false);
            }
          }}
        >
          Modifier
        </Button>
      </div>
    </>
  );
};

const RecurrenceModalContent = ({
  ctrl,
  invoice,
  onlyEnding,
}: {
  ctrl: FormControllerFuncType<Pick<Invoices, "subscription">>;
  invoice: Invoices;
  onlyEnding?: boolean;
}) => {
  const subscriptions = _.uniq(
    invoice.content?.map((a) => a.subscription)
  ).filter(Boolean) as string[];
  return (
    <>
      <br />
      {subscriptions.length > 1 && (
        <Blockquote className="mb-4">
          Vous avez plusieurs articles avec des fréquences différentes, la
          facture sera dupliquée pour chaque groupes d'articles partageant la
          même fréquence à partir de la prochaine facture.
        </Blockquote>
      )}

      {!onlyEnding && (
        <>
          <div className="space-y-4">
            <PageColumns>
              <FormInput
                type="select"
                label="Début de la récurrence"
                options={optionsStartDates}
                ctrl={ctrl("subscription.start_type")}
              />
              {ctrl("subscription.start_type")?.value === "date" && (
                <FormInput
                  type="date"
                  label="Date (incluse)"
                  ctrl={ctrl("subscription.start")}
                />
              )}
            </PageColumns>
            <FormInput
              type="select"
              label="Facturer le"
              ctrl={ctrl("subscription.invoice_date")}
              options={optionsInvoiceDate}
            />
          </div>
          <ModalHr />
        </>
      )}
      <div className="space-y-4">
        <PageColumns>
          <FormInput
            type="select"
            label="Fin de la facturation"
            options={optionsEndDates}
            ctrl={ctrl("subscription.end_type")}
          />
          {ctrl("subscription.end_type")?.value === "delay" && (
            <FormInput
              type="select"
              label="Délai"
              ctrl={ctrl("subscription.end_delay")}
              options={optionsDelays}
            />
          )}
          {ctrl("subscription.end_type")?.value === "date" && (
            <FormInput
              type="date"
              label="Date (incluse)"
              ctrl={ctrl("subscription.end")}
            />
          )}
        </PageColumns>

        <div className="space-y-2">
          <Heading size="2" className="pb-0">
            Action en fin de récurrence
          </Heading>
          <FormInput
            type="select"
            ctrl={ctrl("subscription.renew_as")}
            options={optionsRenewAs}
          />
          <Info className="block">
            Une fois la période de facturation terminée, le devis peut être
            automatiquement dupliqué en brouillon, ou en devis envoyé au client,
            ou bien définitivement clôturé.
          </Info>
        </div>
      </div>
    </>
  );
};
