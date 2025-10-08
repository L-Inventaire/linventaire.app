import { Articles } from "@features/articles/types/types";
import { Contacts } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { TablePropsType } from "@molecules/table";
import { QueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext } from "react";
import { useParams } from "react-router-dom";
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
  renderResult?: TablePropsType<T>["columns"];
  viewRoute?: string; // Where we can view the entity

  // When we want to not use rest entities but custom data (replace all results)
  resultList?: (query: string) => Promise<{ total: number; list: T[] }>;

  // Allow to create a new entity
  renderDocumentBar?: (props: {
    id: string;
    readonly?: boolean;
    onClose?: () => void;
    onSave?: () => Promise<void>;
    onChangeMode?: (mode: "write" | "read") => void;
  }) => ReactNode;
  renderActionsBar?: (props: { id: string; readonly?: boolean }) => ReactNode;
  renderEditor?: (props: { id: string; readonly?: boolean }) => ReactNode;
  renderPage?: (props: { id: string; readonly?: boolean }) => ReactNode;
  useDefaultData?: () => Partial<T>;
  onCreate?: (query: string) => {
    callback: (query: string) => Promise<string | void | false>; // Returns the query we want after the creation
    label?: string | ReactNode;
  };

  orderBy?: string;
  orderDesc?: boolean;
  groupBy?: string;
  groupByRender?: (group: T) => ReactNode;

  actions?: (rows: T[], client: QueryClient) => CtrlkAction[];
};

export type CtrlkAction = {
  label: string;
  keywords?: string[];
  icon?: (p: any) => ReactNode;
  className?: string;
  action: () => Promise<void>;
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

export const ContextId = createContext<string | undefined>(undefined);

export const useParamsOrContextId = () => {
  const { id } = useParams<{ id: string }>();
  const contextId = useContext(ContextId);
  return { id: contextId || id };
};
