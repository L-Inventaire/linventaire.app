import { ReactNode } from "react";
import { CtrlKOptionsType } from "./types";
import { TablePropsType } from "@molecules/table";
import { Contacts } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { Articles } from "@features/articles/types/types";

export let RootNavigationItems: CtrlKOptionsType[] = [];
export const registerRootNavigation = (
  options: CtrlKOptionsType & { to: string }
) => {
  RootNavigationItems = [
    ...RootNavigationItems.filter((a) => a.to !== options.to),
    options,
  ];
};

type RestEntityForCtrlK<T> = {
  // How we render the result in the search list
  renderResult?: TablePropsType<T>["columns"];
  viewRoute?: string; // Where we can view the entity

  // When we want to not use rest entities but custom data (replace all results)
  resultList?: (query: string) => Promise<{ total: number; list: T[] }>;

  // Allow to create a new entity
  renderEditor?: (props: { id: string }) => ReactNode;
  useDefaultData?: () => Partial<T>;
  onCreate?: (query: string) => {
    callback: (query: string) => Promise<string | void | false>; // Returns the query we want after the creation
    label?: string | ReactNode;
  };
};

export let CtrlKRestEntities: {
  contacts: RestEntityForCtrlK<Contacts>;
  invoices: RestEntityForCtrlK<Invoices>;
  articles: RestEntityForCtrlK<Articles>;
  [key: string]: RestEntityForCtrlK<any>;
} = {} as any;
export const registerCtrlKRestEntity = <T>(
  entity: string,
  options: RestEntityForCtrlK<T>
) => {
  CtrlKRestEntities = {
    ...CtrlKRestEntities,
    [entity]: options,
  };
};
