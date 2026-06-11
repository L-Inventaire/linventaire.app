import { Button as AtomButton } from "@atoms/button/button";
import { Base, Info, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormContext,
  FormControllerFuncType,
} from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import {
  InvoiceReview,
  Invoices,
  ReviewReminder,
} from "@features/invoices/types/types";
import {
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Badge, Text } from "@radix-ui/themes";
import { getNextReviewDate, getPrevReviewDate } from "@shared/invoices";
import { format } from "date-fns";
import { useEffect } from "react";

const SEPARATOR = { value: "__sep", label: "──────────", disabled: true };

const monthNames = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const dayOptions = [
  { value: "first", label: "Premier du mois" },
  { value: "middle", label: "Milieu du mois" },
  { value: "last", label: "Fin du mois" },
  SEPARATOR,
  ...Array.from({ length: 31 }, (_, i) => ({
    value: `${i + 1}`,
    label: `Le ${i + 1}`,
  })),
];

const monthOptions = [
  { value: "every", label: "Tous les mois" },
  SEPARATOR,
  ...monthNames.map((m, i) => ({ value: `${i + 1}`, label: `${m}` })),
];

const reminderLabel = (reminder: ReviewReminder) => {
  const day =
    dayOptions.find((a) => a.value === reminder.day)?.label || reminder.day;
  const month =
    monthOptions.find((a) => a.value === reminder.month)?.label ||
    reminder.month;
  return `${day} · ${month}`;
};

type ReviewChange = (review: InvoiceReview, nextReviewDate: number | null) => void;

// The editor panel (shown inside the popover), driven by a value + onChange so
// it can be wired either to the form draft (edit) or to a mutation (read mode).
const ReviewEditor = ({
  review,
  nextReviewDate,
  onChange,
}: {
  review?: InvoiceReview;
  nextReviewDate: number | null;
  onChange: ReviewChange;
}) => {
  const enabled = !!review?.enabled;
  const reminders = review?.reminders || [];
  const now = Date.now();
  const overdue = enabled && !!nextReviewDate && nextReviewDate <= now;

  // Apply a config change, recomputing the next review date when relevant
  const apply = (next: InvoiceReview) => {
    let nrd = nextReviewDate;
    if (!next.enabled || !next.reminders?.length) {
      nrd = null;
    } else if (!nrd || nrd > now) {
      nrd = getNextReviewDate(next, now);
    }
    onChange(next, nrd);
  };

  const updateReminder = (index: number, patch: Partial<ReviewReminder>) =>
    apply({
      enabled,
      reminders: reminders.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });

  return (
    <div className="space-y-4">
      <FormInput
        type="boolean"
        placeholder="Activer un rappel de vérification"
        value={enabled}
        onChange={(v: boolean) => apply({ enabled: v, reminders })}
      />
      {enabled && (
        <>
          <Info className="block">
            Ajoutez un ou plusieurs rappels pour être alerté lorsqu'il faut
            vérifier ce devis (par exemple pour renouveler un abonnement auprès
            du fournisseur).
          </Info>

          <div className="space-y-2">
            {reminders.map((reminder, i) => (
              <div key={i} className="flex items-center space-x-2">
                <FormInput
                  type="select"
                  className="w-full"
                  value={reminder.day}
                  onChange={(v: string) => updateReminder(i, { day: v })}
                  options={dayOptions}
                />
                <FormInput
                  type="select"
                  className="w-full"
                  value={reminder.month}
                  onChange={(v: string) => updateReminder(i, { month: v })}
                  options={monthOptions}
                />
                <AtomButton
                  theme="outlined"
                  size="sm"
                  onClick={() =>
                    apply({
                      enabled,
                      reminders: reminders.filter((_, j) => j !== i),
                    })
                  }
                  icon={(p) => <XMarkIcon {...p} />}
                />
              </div>
            ))}
            <AtomButton
              theme="outlined"
              size="sm"
              icon={(p) => <PlusIcon {...p} />}
              onClick={() =>
                apply({
                  enabled,
                  reminders: [...reminders, { day: "first", month: "every" }],
                })
              }
            >
              Ajouter un rappel
            </AtomButton>
          </div>

          {!!reminders.length && (
            <div className="space-y-1">
              <Section className="pb-0">Prochaine vérification</Section>
              <Base className="block">
                {nextReviewDate ? format(nextReviewDate, "eee PP") : "—"}
                {overdue && (
                  <Badge color="red" className="ml-2">
                    À vérifier
                  </Badge>
                )}
              </Base>
              <div className="flex pt-2">
                {overdue || !nextReviewDate ? (
                  <AtomButton
                    theme="primary"
                    size="sm"
                    icon={(p) => <CheckCircleIcon {...p} />}
                    onClick={() =>
                      onChange(
                        { enabled, reminders },
                        getNextReviewDate({ enabled, reminders }, now),
                      )
                    }
                  >
                    Marquer vérifié
                  </AtomButton>
                ) : (
                  <AtomButton
                    theme="outlined"
                    size="sm"
                    icon={(p) => <ClockIcon {...p} />}
                    onClick={() =>
                      onChange(
                        { enabled, reminders },
                        getPrevReviewDate({ enabled, reminders }, now) ??
                          now - 1000 * 60 * 60 * 24,
                      )
                    }
                  >
                    Marquer comme à vérifier
                  </AtomButton>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Compact, single-line clickable trigger (rendered next to "Émis le ...")
const ReviewButton = ({
  review,
  nextReviewDate,
  onChange,
  btnKey,
}: {
  review?: InvoiceReview;
  nextReviewDate: number | null;
  onChange: ReviewChange;
  btnKey?: string;
}) => {
  const enabled = !!review?.enabled;
  const reminders = review?.reminders || [];
  const overdue = enabled && !!nextReviewDate && nextReviewDate <= Date.now();

  return (
    <InputButton
      theme="invisible"
      className="m-0"
      btnKey={btnKey}
      placeholder="Vérification"
      value={"true"}
      content={() => (
        <ReviewEditor
          review={review}
          nextReviewDate={nextReviewDate}
          onChange={onChange}
        />
      )}
    >
      {overdue ? (
        <Badge color="red">À vérifier</Badge>
      ) : (
        <Text size="2" className="opacity-75" weight="medium">
          {enabled && reminders.length
            ? reminders.map(reminderLabel).join(" / ")
            : "Aucune vérification"}
        </Text>
      )}
    </InputButton>
  );
};

// Edit mode: bound to the form draft, saved with the rest of the document
const InvoiceReviewEditable = ({
  ctrl,
  invoice,
  btnKey,
}: {
  ctrl: FormControllerFuncType<Pick<Invoices, "review" | "next_review_date">>;
  invoice: Invoices;
  btnKey?: string;
}) => {
  const review = invoice.review;
  const enabled = !!review?.enabled;
  const reminders = review?.reminders || [];
  const nextReviewDate = invoice.next_review_date || null;
  const now = Date.now();

  // Keep the next review date in sync with the configuration
  useEffect(() => {
    if (!enabled) {
      if (nextReviewDate) ctrl("next_review_date").onChange(null);
      return;
    }
    const validReminders = reminders.filter((r) => r?.day && r?.month);
    if (!validReminders.length) {
      if (nextReviewDate) ctrl("next_review_date").onChange(null);
      return;
    }
    if (!nextReviewDate || nextReviewDate > now) {
      const next = getNextReviewDate(review, now);
      if (next && next !== nextReviewDate) ctrl("next_review_date").onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(reminders)]);

  return (
    <ReviewButton
      review={review}
      nextReviewDate={nextReviewDate}
      btnKey={btnKey}
      onChange={(r, n) => {
        ctrl("review").onChange(r);
        ctrl("next_review_date").onChange(n);
      }}
    />
  );
};

// Read mode: clickable too, persists immediately via a mutation so the user can
// quickly mark a quote as verified from the document view.
const InvoiceReviewReadonly = ({
  invoice,
  btnKey,
}: {
  invoice: Invoices;
  btnKey?: string;
}) => {
  const { invoice: fresh, update } = useInvoice(invoice.id);
  const source = fresh || invoice;
  return (
    <FormContext readonly={false} disabled={false}>
      <ReviewButton
        review={source.review}
        nextReviewDate={source.next_review_date || null}
        btnKey={btnKey}
        onChange={(review, next_review_date) =>
          update.mutateAsync({ id: invoice.id, review, next_review_date })
        }
      />
    </FormContext>
  );
};

export const InvoiceReviewInput = ({
  ctrl,
  invoice,
  readonly,
  btnKey,
}: {
  ctrl: FormControllerFuncType<Pick<Invoices, "review" | "next_review_date">>;
  invoice: Invoices;
  readonly?: boolean;
  btnKey?: string;
}) => {
  if (readonly) return <InvoiceReviewReadonly invoice={invoice} btnKey={btnKey} />;
  return <InvoiceReviewEditable ctrl={ctrl} invoice={invoice} btnKey={btnKey} />;
};
