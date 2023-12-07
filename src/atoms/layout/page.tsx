import { ErrorBoundary } from "@views/error-boundary";
import { ReactNode } from "react";

export const Page = (props: { children: ReactNode }) => {
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
