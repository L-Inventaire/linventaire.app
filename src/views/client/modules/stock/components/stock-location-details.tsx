import { FormContext } from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import { StockLocations } from "@features/stock/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";

export const StockLocationsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { isPending, ctrl, draft, setDraft } = useReadDraftRest<StockLocations>(
    "stock_locations",
    id || "new",
    readonly
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        TODO
      </FormContext>
    </div>
  );
};
