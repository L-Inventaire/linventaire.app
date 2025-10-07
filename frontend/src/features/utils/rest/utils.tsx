import { ArchiveBoxArrowDownIcon, TrashIcon } from "@heroicons/react/16/solid";
import { QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CtrlkAction } from "../../ctrlk";
import { getRestApiClient } from "./hooks/use-rest";
import { RestEntity } from "./types/types";

export const setDefaultRestActions = (
  actions: CtrlkAction[],
  table: string,
  rows: RestEntity[],
  queryClient: QueryClient
) => {
  if (rows.every((a) => !a.is_deleted)) {
    actions.push({
      label: "Supprimer",
      icon: (p) => <TrashIcon {...p} />,
      action: async () => {
        const rest = getRestApiClient(table);
        for (const row of rows) {
          try {
            await rest.delete(row.client_id, row.id);
          } catch (e) {
            toast.error("Erreur lors de la mise à jour de la facture");
          }
        }
        queryClient.invalidateQueries({ queryKey: [table] });
      },
    } as CtrlkAction);
  }

  if (rows.every((a) => a.is_deleted)) {
    actions.push({
      label: "Restaurer",
      icon: (p) => <ArchiveBoxArrowDownIcon {...p} />,
      action: async () => {
        const rest = getRestApiClient(table);
        for (const row of rows) {
          try {
            await rest.restore(row.client_id, row.id);
          } catch (e) {
            toast.error("Erreur lors de la mise à jour de la facture");
          }
        }
        queryClient.invalidateQueries({ queryKey: [table] });
      },
    } as CtrlkAction);
  }
};
