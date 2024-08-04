import { FormContext } from "@components/form/formcontext";

export const StockLocationsDetailsPage = ({
  readonly,
}: {
  readonly?: boolean;
  id: string;
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        TODO
      </FormContext>
    </div>
  );
};
