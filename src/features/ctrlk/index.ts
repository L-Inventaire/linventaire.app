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
  viewRoute?: string;
  useDefaultData?: () => Partial<T>;
  renderEditor: (props: { id: string }) => ReactNode;
  renderResult?: (props: T) => ReactNode;
};

export let CtrlKRestEntities: { [key: string]: RestEntityForCtrlK<any> } = {};
export const registerCtrlKRestEntity = <T>(
  entity: string,
  renderEditor: (props: { id: string }) => ReactNode,
  renderResult?: (props: T) => ReactNode,
  useDefaultData?: () => Partial<T>,
  viewRoute?: string
) => {
  CtrlKRestEntities = {
    ...CtrlKRestEntities,
    [entity]: { viewRoute, renderEditor, renderResult, useDefaultData },
  };
};
