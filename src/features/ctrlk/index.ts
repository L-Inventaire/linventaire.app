import { ReactNode } from "react";
import { CtrlKOptionsType } from "./types";

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
  renderResult?: (props: T) => ReactNode;
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

export let CtrlKRestEntities: { [key: string]: RestEntityForCtrlK<any> } = {};
export const registerCtrlKRestEntity = <T>(
  entity: string,
  options: RestEntityForCtrlK<T>
) => {
  CtrlKRestEntities = {
    ...CtrlKRestEntities,
    [entity]: options,
  };
};
