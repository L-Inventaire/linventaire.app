import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { UsersInput } from "@components/input-rest/users";
import { useArticle } from "@features/articles/hooks/use-articles";
import { useServiceItem } from "@features/service/hooks/use-service-items";
import { ServiceTimes } from "@features/service/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { BriefcaseIcon } from "@heroicons/react/20/solid";
import { useEffect } from "react";

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

  useEffect(() => {
    if (article?.unit) {
      setDraft((d) => ({ ...d, unit: article.unit }));
    }
  }, [article?.unit]);

  return (
    <div className="w-full max-w-3xl mx-auto">
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

        <FormInput
          label={`Quantity (${article?.unit || "units"})`}
          type="number"
          ctrl={ctrl("quantity")}
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
