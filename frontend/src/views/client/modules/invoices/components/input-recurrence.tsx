import { Modal, ModalContent } from "@atoms/modal/modal";
import { Base, Info } from "@atoms/text";
import {
  FormControllerFuncType,
  useFormController,
} from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { optionsDelays, RecurrenceInput } from "@components/recurring-input";
import { Contacts } from "@features/contacts/types/types";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { applyOffset } from "@features/invoices/utils";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { Button } from "@radix-ui/themes";
import { format } from "date-fns";
import _ from "lodash";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { atom, useRecoilState } from "recoil";
import { frequencyOptions } from "../../articles/components/article-details";

export const InvoiceRecurrenceInput = ({
  ctrl,
  invoice,
  readonly,
  btnKey,
  client,
  contact,
  noResetToDefault,
}: {
  ctrl: FormControllerFuncType<Pick<Invoices, "subscription">>;
  invoice: Invoices;
  readonly?: boolean;
  btnKey?: string;
  client?: Contacts;
  contact?: Contacts;
  noResetToDefault?: boolean;
}) => {
  const hasSubscription = !!invoice.content?.find((a) => a.subscription);
  const subscriptions = _.uniq(
    invoice.content?.map((a) => a.subscription)
  ).filter(Boolean) as string[];
  const minimalFrequency = _.minBy(subscriptions, (a) => {
    const t = new Date();
    applyOffset(t, a, 1);
    return t.getTime();
  });

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
    if (!invoice.subscription?.invoice_state) {
      ctrl("subscription.invoice_state").onChange("draft");
    }
    if (!invoice.subscription?.renew_in_advance) {
      ctrl("subscription.renew_in_advance").onChange("30");
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
      content={() => (
        <RecurrenceInput
          ctrl={ctrl("subscription")}
          invoice={invoice}
          client={client || undefined}
          contact={contact || undefined}
          baseConfiguration={noResetToDefault}
        />
      )}
      value={"true"}
    >
      <div className="space-y-0 w-max flex flex-col text-left">
        <Base>
          Début{" "}
          {
            (
              {
                after_first_invoice: "après la première facture",
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
              {" → "} fin le {format(invoice.subscription?.end, "eee PP")}
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
  client,
  contact,
}: {
  quoteId: string;
  onClose: () => void;
  client?: Contacts;
  contact?: Contacts;
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
        <RecurrenceInput
          invoice={draft}
          ctrl={ctrl("subscription")}
          onlyEnding
          client={client || undefined}
          contact={contact || undefined}
        />
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
