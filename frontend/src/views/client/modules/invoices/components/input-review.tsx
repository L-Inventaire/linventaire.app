import { Button as AtomButton } from "@atoms/button/button";
import { Base, Info, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormControllerFuncType } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import {
  getNextReviewDate,
  getPrevReviewDate,
  getReviewAnchor,
} from "@features/invoices/utils";
import { Invoices } from "@features/invoices/types/types";
import {
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Badge } from "@radix-ui/themes";
import { format } from "date-fns";
import { useEffect } from "react";
import { frequencyOptions } from "../../articles/components/article-details";

const reviewFrequencyOptions = frequencyOptions.filter((a) => a.value);

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
  const anchor = getReviewAnchor(invoice);
  const nextReviewDate = invoice.next_review_date || null;
  const now = Date.now();
  const overdue = enabled && !!nextReviewDate && nextReviewDate <= now;

  // Keep the read-only "next review date" in sync with the configuration
  useEffect(() => {
    if (!enabled) {
      if (nextReviewDate) ctrl("next_review_date").onChange(null);
      return;
    }
    // Make sure we have a stable anchor to compute recurrences from
    if (!review?.anchor) {
      ctrl("review.anchor").onChange(invoice.emit_date || Date.now());
      return;
    }
    const hasConfig =
      (review?.frequencies?.length || 0) > 0 ||
      (review?.dates?.length || 0) > 0;
    if (!hasConfig) {
      if (nextReviewDate) ctrl("next_review_date").onChange(null);
      return;
    }
    // Initialize/refresh the next review date when missing or still in the future
    if (!nextReviewDate || nextReviewDate > now) {
      const next = getNextReviewDate(review, review.anchor, now);
      if (next && next !== nextReviewDate) {
        ctrl("next_review_date").onChange(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    review?.anchor,
    JSON.stringify(review?.frequencies),
    JSON.stringify(review?.dates),
  ]);

  const onVerified = () => {
    const next = getNextReviewDate(review, anchor, now);
    ctrl("next_review_date").onChange(next);
  };

  const onNotVerified = () => {
    const prev =
      getPrevReviewDate(review, anchor, now) ?? now - 1000 * 60 * 60 * 24;
    ctrl("next_review_date").onChange(prev);
  };

  const dates = review?.dates || [];

  const frequenciesLabel = (review?.frequencies || [])
    .map((f) => reviewFrequencyOptions.find((a) => a.value === f)?.label || f)
    .join(", ");

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
                Définissez une ou plusieurs dates récurrentes pour être alerté
                lorsqu'il faut vérifier ce devis (par exemple pour renouveler un
                abonnement auprès du fournisseur).
              </Info>
              <FormInput
                type="multiselect"
                label="Récurrences"
                placeholder="Tous les mois, tous les ans..."
                ctrl={ctrl("review.frequencies")}
                options={reviewFrequencyOptions}
              />

              <div className="space-y-2">
                <Section className="pb-0">Dates précises</Section>
                {dates.map((d, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <FormInput
                      type="date"
                      value={d}
                      onChange={(v: any) => {
                        const next = [...dates];
                        next[i] = new Date(v).getTime();
                        ctrl("review.dates").onChange(next);
                      }}
                    />
                    <AtomButton
                      theme="outlined"
                      size="sm"
                      onClick={() =>
                        ctrl("review.dates").onChange(
                          dates.filter((_, j) => j !== i)
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
                    ctrl("review.dates").onChange([...dates, Date.now()])
                  }
                >
                  Ajouter une date
                </AtomButton>
              </div>

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
                      Vérifié
                    </AtomButton>
                  ) : (
                    <AtomButton
                      theme="outlined"
                      size="sm"
                      icon={(p) => <ClockIcon {...p} />}
                      onClick={onNotVerified}
                    >
                      Pas encore vérifié
                    </AtomButton>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      value={"true"}
    >
      {enabled ? (
        <div className="space-y-0 w-max flex flex-col text-left">
          <Base>
            {frequenciesLabel || "Vérification activée"}
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
