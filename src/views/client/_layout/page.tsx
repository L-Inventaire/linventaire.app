import {
  LayoutActionsAtom,
  LayoutTitleAtom,
} from "@views/client/_layout/header";
import { ErrorBoundary } from "@views/error-boundary";
import { ReactNode, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";

export const Page = (props: {
  children: ReactNode;
  actions?: ReactNode;
  title?: {
    label?: string;
    to?: string;
    href?: string;
  }[];
}) => {
  const setActions = useSetRecoilState(LayoutActionsAtom);
  const setTitle = useSetRecoilState(LayoutTitleAtom);
  const location = useParams();

  useEffect(() => {
    setActions(props.actions || null);
    setTitle(props.title || []);
    // Set title on window
    document.title = (props.title || []).map((t) => t.label).join(" - ");
  }, [location.pathname, props.actions, props.title]);

  return (
    <ErrorBoundary>
      <div className="p-4 w-full mx-auto text-black dark:text-white min-h-full sm:bg-transparent bg-white">
        {props.children}
      </div>
    </ErrorBoundary>
  );
};

export const PageBlock = (props: { children: ReactNode }) => {
  return (
    <div className="p-3 lg:p-4 sm:pt-3 lg:pt-4 pt-0 sm:border border-b sm:mx-0 -mx-4 rounded-md mb-4 bg-white dark:bg-slate-990 dark:border-slate-900">
      {props.children}
    </div>
  );
};

export const PageColumns = (props: { children: ReactNode }) => {
  return (
    <div className="flex flex-col space-y-2 lg:flex-row lg:space-x-2 lg:space-y-0 w-full">
      {props.children}
    </div>
  );
};
