import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { InputButton } from "@components/input-button";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { Invoices } from "@features/invoices/types/types";
import { formatTime } from "@features/utils/format/dates";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { VerticalLine } from "@views/client/_layout/new-page";

export type InvoiceTitleContentProps = {
  id: string | null;
  readonly?: boolean;
};

export const InvoiceTitleContent = ({
  id,
  ...props
}: InvoiceTitleContentProps) => {
  const { isPending, ctrl, draft, setDraft } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new",
    props.readonly
  );

  return (
    <div className="flex items-center justify-between flex-grow">
      <VerticalLine className={"h-5"} />
      {(!props.readonly || ctrl("emit_date").value) && (
        <>
          <div className="flex w-full items-center">
            <InputButton
              theme="invisible"
              className="m-0"
              data-tooltip={new Date(ctrl("emit_date").value).toDateString()}
              ctrl={ctrl("emit_date")}
              placeholder="Date d'emission"
              value={formatTime(ctrl("emit_date").value || 0)}
              content={<FormInput ctrl={ctrl("emit_date")} type="date" />}
              readonly={props.readonly}
            >
              <Info className="font-medium text-base">
                {"Émis le "}
                {formatTime(ctrl("emit_date").value || 0, {
                  hideTime: true,
                })}
              </Info>
            </InputButton>
            <VerticalLine className={"h-5"} />
            <TagsInput ctrl={ctrl("tags")} />
          </div>

          <UsersInput ctrl={ctrl("assigned")} className={"w-max"} />
        </>
      )}
    </div>
  );
};
