import { InputLabel } from "@atoms/input/input-decoration-label";
import { Input } from "@atoms/input/input-text";
import { getUnitLabel } from "@atoms/input/input-unit";
import { UsersInput } from "@components/input-rest/users";
import { useAuth } from "@features/auth/state/use-auth";
import { ServiceTimes } from "@features/service/types/types";
import { TrashIcon } from "@heroicons/react/16/solid";
import { Button, Callout, IconButton } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export type SpentTime = Pick<
  ServiceTimes,
  "description" | "unit" | "quantity" | "assigned" | "date"
>;

export const InlineSpentTimeInput = (props: {
  quantity?: string;
  unit?: string;
  value: SpentTime[];
  onChange: (value: SpentTime[]) => void;
}) => {
  const { user } = useAuth();
  return (
    <>
      {!props.value.length && (
        <Callout.Root className="mt-4">
          Ajouter du temps passé pour marquer cette tâche comme terminée.
        </Callout.Root>
      )}
      {props.value.map((spentTime, index) => (
        <div className="mt-2 flex flex-row space-x-2 w-full items-center">
          <SpentTimeLine
            value={spentTime}
            onChange={(value) => {
              const newValue = [...props.value];
              newValue[index] = value;
              props.onChange(newValue);
            }}
          />
          <IconButton
            className="mt-3"
            variant="ghost"
            color="red"
            onClick={() => {
              const newValue = [...props.value];
              newValue.splice(index, 1);
              props.onChange(newValue);
            }}
          >
            <TrashIcon className="w-4 h-4" />
          </IconButton>
        </div>
      ))}
      <Button
        className="mt-4"
        variant="outline"
        onClick={() => {
          props.onChange([
            ...props.value,
            {
              date: new Date().getTime(),
              assigned: [user!.id],
              quantity: parseFloat(props.quantity || "0"),
              description: "",
              unit: props.unit || "h",
            },
          ]);
        }}
      >
        Ajouter un temps passé
      </Button>
    </>
  );
};

const SpentTimeLine = (props: {
  unit?: string;
  value: SpentTime;
  onChange: (value: SpentTime) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-row space-x-2 w-full items-start">
      <InputLabel
        label="Assigné"
        input={
          <div className="h-9 flex items-center">
            <UsersInput
              size="md"
              value={props.value.assigned}
              onChange={(e) => props.onChange({ ...props.value, assigned: e })}
            />
          </div>
        }
      />
      <Input
        label={"Temps passé en " + getUnitLabel(props.unit, t)}
        type="number"
        onChange={(e) =>
          props.onChange({
            ...props.value,
            quantity: parseFloat(e.target.value || "0"),
          })
        }
        value={props.value.quantity || ""}
      />
      <div className="grow">
        <Input
          className="w-full"
          label={"Détails"}
          type="text"
          placeholder="Tache effectuée"
          onChange={(e) =>
            props.onChange({ ...props.value, description: e.target.value })
          }
          value={props.value.description}
        />
      </div>
    </div>
  );
};
