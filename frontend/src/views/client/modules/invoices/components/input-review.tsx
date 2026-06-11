import { Button as AtomButton } from "@atoms/button/button";
import { Base, Info, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { getNextReviewDate, getPrevReviewDate } from "@shared/invoices";
import { Invoices, ReviewReminder } from "@features/invoices/types/types";
import {
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Badge } from "@radix-ui/themes";
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
  const review = invoice.review;
  const enabled = !!review?.enabled;
  const reminders = review?.reminders || [];
  const nextReviewDate = invoice.next_review_date || null;
  const now = Date.now();
  const overdue = enabled && !!nextReviewDate && nextReviewDate <= now;

  // Keep the read-only "next review date" in sync with the configuration
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
    // Initialize/refresh the next review date when missing or still in the future
    if (!nextReviewDate || nextReviewDate > now) {
      const next = getNextReviewDate(review, now);
      if (next && next !== nextReviewDate) {
        ctrl("next_review_date").onChange(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(reminders)]);

  const onVerified = () => {
    ctrl("next_review_date").onChange(getNextReviewDate(review, now));
  };

  const onNotVerified = () => {
    ctrl("next_review_date").onChange(
      getPrevReviewDate(review, now) ?? now - 1000 * 60 * 60 * 24,
    );
  };

  const updateReminder = (index: number, patch: Partial<ReviewReminder>) => {
    const next = reminders.map((r, i) =>
      i === index ? { ...r, ...patch } : r,
    );
    ctrl("review.reminders").onChange(next);
  };

  return (
    <InputButton
      btnKey={btnKey}
      placeholder="Vérification"
      icon={(p) => <ClockIcon {...p} />}
      readonly={readonly}
      content={() => (
        <div className="space-y-4">
          <FormInput
            type="boolean"
            placeholder="Activer un rappel de vérification"
            ctrl={ctrl("review.enabled")}
          />
          {enabled && (
            <>
              <Info className="block">
                Ajoutez un ou plusieurs rappels pour être alerté lorsqu'il faut
                vérifier ce devis (par exemple pour renouveler un abonnement
                auprès du fournisseur).
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
                        ctrl("review.reminders").onChange(
                          reminders.filter((_, j) => j !== i),
                        )
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
                    ctrl("review.reminders").onChange([
                      ...reminders,
                      { day: "first", month: "every" },
                    ])
                  }
                >
                  Ajouter un rappel
                </AtomButton>
              </div>

              {!!reminders?.length && (
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
                        onClick={onVerified}
                      >
                        Marquer vérifié
                      </AtomButton>
                    ) : (
                      <AtomButton
                        theme="outlined"
                        size="sm"
                        icon={(p) => <ClockIcon {...p} />}
                        onClick={onNotVerified}
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
      )}
      value={"true"}
    >
      {enabled ? (
        <div className="space-y-0 w-max flex flex-col text-left">
          <Base>
            {reminders.length
              ? reminders.map(reminderLabel).join(" / ")
              : "Vérification activée"}
            {overdue && (
              <Badge color="red" className="ml-2">
                À vérifier
              </Badge>
            )}
          </Base>
          <Info>
            Prochaine vérification{" "}
            {nextReviewDate ? "le " + format(nextReviewDate, "eee PP") : "—"}
          </Info>
        </div>
      ) : (
        <Info>Aucune vérification</Info>
      )}
    </InputButton>
  );
};
