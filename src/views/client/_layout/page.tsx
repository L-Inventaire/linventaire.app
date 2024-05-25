import { Button } from "@atoms/button/button";
import { Section } from "@atoms/text";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/outline";
import {
  LayoutActionsAtom,
  LayoutTitleAtom,
} from "@views/client/_layout/header";
import { ErrorBoundary } from "@views/error-boundary";
import { ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

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
      <div className="p-4 w-full mx-auto text-black dark:text-white min-h-full sm:bg-transparent bg-white dark:bg-slate-970">
        {props.children}
      </div>
    </ErrorBoundary>
  );
};

export const PageBlockHr = () => {
  return (
    <div className="-mx-4 border-solid border-b dark:border-slate-900 !my-4" />
  );
};

export const PageBlock = (props: {
  children: ReactNode;
  title?: string;
  closable?: boolean;
  open?: boolean;
  initOpen?: boolean;
  actions?: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(
    props.open ?? props.initOpen ?? true
  );

  useEffect(() => {
    if (props.open !== undefined) setIsOpen(props.open ?? true);
  }, [props.open]);

  return (
    <div
      className={twMerge(
        "p-3 lg:p-4 sm:pt-3 lg:pt-4 pt-0 sm:border border-b sm:mx-0 -mx-4 rounded-md mb-4 bg-slate-50 bg-opacity-50 dark:bg-slate-970 border-slate-100 dark:sm:border-slate-970 dark:border-slate-950",
        !isOpen && props.closable ? "cursor-pointer" : "",
        !props.title && "lg:pt-2 sm:pt-1 pt-1"
      )}
      onClick={() => props.closable && !isOpen && setIsOpen(!isOpen)}
    >
      <div
        className="float-right space-x-2"
        onClick={(e) => e.stopPropagation()}
      >
        {props.actions}
        {props.closable && (
          <Button
            data-tooltip="Plier / Déplier"
            size="sm"
            theme="invisible"
            onClick={() => setIsOpen(!isOpen)}
            icon={(p) =>
              isOpen ? <ChevronUpIcon {...p} /> : <ChevronDownIcon {...p} />
            }
          />
        )}
      </div>
      {props.title && <Section className="!mb-0">{props.title}</Section>}
      <div
        className={twMerge(
          "transition-all",
          isOpen
            ? "max-h-screen mt-2 opacity-1"
            : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        {props.children}
      </div>
    </div>
  );
};

export const PageColumns = (props: { children: ReactNode }) => {
  return (
    <div className="flex flex-col sm:space-y-4 lg:flex-row lg:space-x-4 lg:space-y-0 w-full">
      {props.children}
    </div>
  );
};
