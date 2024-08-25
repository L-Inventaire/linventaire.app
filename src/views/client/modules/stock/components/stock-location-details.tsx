import { FormContext } from "@components/form/formcontext";

export const StockLocationsDetailsPage = ({
  readonly,
}: {
  readonly?: boolean;
  id: string;
}) => {
  /*
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { isPending, ctrl, draft, setDraft } = useReadDraftRest<StockLocations>(
    "stock_locations",
    id || "new",
    readonly
  );*/

  return (
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        TODO
      </FormContext>
    </div>
  );
};
