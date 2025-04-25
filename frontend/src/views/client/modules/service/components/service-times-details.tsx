import InputTime from "@atoms/input/input-time";
import { getUnitLabel } from "@atoms/input/input-unit";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { UsersInput } from "@components/input-rest/users";
import { useArticle } from "@features/articles/hooks/use-articles";
import { useServiceItem } from "@features/service/hooks/use-service-items";
import { ServiceTimes } from "@features/service/types/types";
import {
  timeBase60ToDecimal,
  timeDecimalToBase60,
} from "@features/utils/format/dates";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { BriefcaseIcon } from "@heroicons/react/20/solid";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const ServiceTimesDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { ctrl, draft, setDraft } = useReadDraftRest<ServiceTimes>(
    "service_times",
    id || "new",
    readonly
  );

  const { service_item } = useServiceItem(draft.service);
  const { article } = useArticle(service_item?.article || "");
  const { t } = useTranslation();

  useEffect(() => {
    if (article?.unit) {
      setDraft((d) => ({ ...d, unit: article.unit || "h" }));
    }
  }, [article?.unit]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <UsersInput ctrl={ctrl("assigned")} />

        <br />
        <br />

        <RestDocumentsInput
          size="xl"
          entity="service_items"
          ctrl={ctrl("service")}
          label="Service"
          placeholder="Sélectionner un service"
          icon={(p) => <BriefcaseIcon {...p} />}
        />

        <br />
        <br />

        <FormInput
          label="Travail effectué"
          type="text"
          ctrl={ctrl("description")}
        />

        <br />

        <FormInput label="Date" type="date" ctrl={ctrl("date")} />

        <br />

        <InputTime
          label={"Temps passé en " + getUnitLabel(article?.unit || "h", t)}
          value={timeDecimalToBase60(ctrl("quantity").value)}
          onChange={(_, number) => {
            const quantity = timeBase60ToDecimal(number);
            ctrl("quantity").onChange(quantity);
          }}
        />

        <br />

        <CustomFieldsInput
          className="mt-8"
          table={"invoices"}
          ctrl={ctrl("fields")}
          readonly={readonly}
          entityId={draft.id || ""}
        />
      </FormContext>
    </div>
  );
};
