import { Button as AtomButton } from "@atoms/button/button";
import { Base, Info, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import {
  FormContext,
  FormControllerFuncType,
} from "@components/form/formcontext";
import { InputButton, InputButtonIsOpenAtom } from "@components/input-button";
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
import { useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";

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

type ReviewChange = (review: InvoiceReview, nextReviewDate: number | null) => void;

const emptyReview: InvoiceReview = { enabled: false, reminders: [] };

// The editor panel (shown inside the popover), driven by a value + onChange so
// it can edit a local working copy committed only on close.
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

// Compact, single-line clickable trigger (rendered next to "Émis le ...").
// Changes are kept in a local working copy and committed only when the popover
// is closed (so read mode does not hit the backend on every keystroke).
const ReviewButton = ({
  review,
  nextReviewDate,
  onChange,
  btnKey,
  hideEmpty,
}: {
  review?: InvoiceReview;
  nextReviewDate: number | null;
  onChange: ReviewChange;
  btnKey: string;
  hideEmpty?: boolean;
}) => {
  const open = useRecoilValue(InputButtonIsOpenAtom(btnKey));
  const [working, setWorking] = useState<{
    review: InvoiceReview;
    next: number | null;
  }>({ review: review || emptyReview, next: nextReviewDate });
  const prevOpen = useRef(open);

  useEffect(() => {
    if (!prevOpen.current && open) {
      // Just opened: seed the working copy from the latest value
      setWorking({ review: review || emptyReview, next: nextReviewDate });
    } else if (prevOpen.current && !open) {
      // Just closed: commit the working copy if it changed
      const changed =
        JSON.stringify([working.review, working.next]) !==
        JSON.stringify([review || emptyReview, nextReviewDate]);
      if (changed) onChange(working.review, working.next);
    }
    prevOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const enabled = !!review?.enabled;
  const overdue = enabled && !!nextReviewDate && nextReviewDate <= Date.now();
  const hasPlanned = enabled && !!nextReviewDate;

  if (!overdue && !hasPlanned && hideEmpty) return null;

  return (
    <InputButton
      theme="invisible"
      className="m-0"
      btnKey={btnKey}
      placeholder="Vérification"
      value={"true"}
      content={() => (
        <ReviewEditor
          review={working.review}
          nextReviewDate={working.next}
          onChange={(r, n) => setWorking({ review: r, next: n })}
        />
      )}
    >
      {overdue ? (
        <Badge color="red">À vérifier</Badge>
      ) : (
        <Text size="2" className="opacity-75" weight="medium">
          {hasPlanned
            ? "Vérification le " + format(nextReviewDate!, "dd/MM/yyyy")
            : "Pas de vérification planifiée"}
        </Text>
      )}
    </InputButton>
  );
};

// Edit mode: committed to the form draft (saved with the rest of the document)
const InvoiceReviewEditable = ({
  ctrl,
  invoice,
  btnKey,
}: {
  ctrl: FormControllerFuncType<Pick<Invoices, "review" | "next_review_date">>;
  invoice: Invoices;
  btnKey: string;
}) => (
  <ReviewButton
    review={invoice.review}
    nextReviewDate={invoice.next_review_date || null}
    btnKey={btnKey}
    onChange={(r, n) => {
      ctrl("review").onChange(r);
      ctrl("next_review_date").onChange(n);
    }}
  />
);

// Read mode: clickable too; persists via a mutation on close so a quote can be
// marked as verified without entering edit mode.
const InvoiceReviewReadonly = ({
  invoice,
  btnKey,
}: {
  invoice: Invoices;
  btnKey: string;
}) => {
  const { invoice: fresh, update } = useInvoice(invoice.id);
  const source = fresh || invoice;
  return (
    <FormContext readonly={false} disabled={false}>
      <ReviewButton
        review={source.review}
        nextReviewDate={source.next_review_date || null}
        btnKey={btnKey}
        hideEmpty
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
  const key = btnKey || "invoice-review";
  if (readonly) return <InvoiceReviewReadonly invoice={invoice} btnKey={key} />;
  return <InvoiceReviewEditable ctrl={ctrl} invoice={invoice} btnKey={key} />;
};
