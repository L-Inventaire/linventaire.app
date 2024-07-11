import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { Tags } from "./types/types";

export const useTagDefaultModel: () => Partial<Tags> = () => ({});

export const useTagConfiguration = () => {
  registerCtrlKRestEntity<Tags>("tags", {
    onCreate: (query: string) => {
      return {
        callback: async () => {
          return "";
        },
        label: query ? `Créer "${query}"` : undefined,
      };
    },
    renderResult: (item) => (
      <div className="flex items-center">
        <div
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: item.color }}
        />
        <span>{item.name}</span>
      </div>
    ),
    viewRoute: ROUTES.SettingsTags,
  });
};
