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
  defaultData?: any;
  renderEditor: (props: { id: string }) => ReactNode;
  renderResult?: (props: T) => ReactNode;
};

export let RestEntities: { [key: string]: RestEntityForCtrlK<any> } = {};
export const registerRestEntity = <T>(
  entity: string,
  renderEditor: (props: { id: string }) => ReactNode,
  renderResult?: (props: T) => ReactNode,
  defaultData?: any,
  viewRoute?: string
) => {
  RestEntities = {
    ...RestEntities,
    [entity]: { viewRoute, renderEditor, renderResult, defaultData },
  };
};
