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
    setActions(props.actions || <></>);
    setTitle(props.title || []);
  }, [location.pathname, props.actions, props.title]);

  return (
    <ErrorBoundary>
      <div className="p-6 w-full mx-auto text-black dark:text-white">
        {props.children}
      </div>
    </ErrorBoundary>
  );
};

export const MaxWidthPage = (props: { children: ReactNode }) => {
  return (
    <ErrorBoundary>
      <div className="p-6 max-w-7xl mx-auto text-black dark:text-white">
        {props.children}
      </div>
    </ErrorBoundary>
  );
};

export const FullScreenPage = (props: { children: ReactNode }) => {
  return (
    <ErrorBoundary>
      <div className="w-full h-full text-black dark:text-white">
        {props.children}
      </div>
    </ErrorBoundary>
  );
};
