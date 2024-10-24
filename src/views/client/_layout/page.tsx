import { Button } from "@atoms/button/button";
import { InputOutlinedDefaultBorders } from "@atoms/styles/inputs";
import { Section } from "@atoms/text";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { ScrollArea } from "@radix-ui/themes";
import { LayoutTitleAtom } from "@views/client/_layout/header";
import { ErrorBoundary } from "@views/error-boundary";
import _ from "lodash";
import React, { ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

export const Page = (
  props: {
    children: ReactNode;
    bar?: ReactNode;
    footer?: ReactNode;
    title?: {
      label?: string;
      to?: string;
      href?: string;
    }[];
  } & Omit<React.ComponentProps<"div">, "title" | "children">
) => {
  const setTitle = useSetRecoilState(LayoutTitleAtom);
  const location = useParams();

  useEffect(() => {
    setTitle(props.title || []);
    // Set title on window
    document.title = (props.title || []).map((t) => t.label).join(" - ");
  }, [location.pathname, props.title]);

  return (
    <ErrorBoundary>
      <div
        className={twMerge(
          "flex flex-col grow w-full text-black dark:text-white min-h-full sm:bg-transparent",
          props.className
        )}
        {..._.omit(props, "className", "children", "bar", "footer", "title")}
      >
        {props.bar && (
          <div className="border-b flex min-h-12 border-slate-100 dark:border-slate-700 shrink-0">
            {props.bar}
          </div>
        )}
        <ScrollArea className="grow">
          <div className="p-3 h-full">{props.children}</div>
        </ScrollArea>
        {props.footer && (
          <div className="border-t border-solid border-slate-100 dark:border-slate-700 p-3">
            {props.footer}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export const PageBlockHr = () => {
  return (
    <div className="-mx-4 border-solid border-b dark:border-slate-700 !my-4" />
  );
};

export const ModalHr = () => {
  return (
    <div className="-mx-6 border-solid border-b dark:border-slate-700 !my-4" />
  );
};

export const PageHr = () => {
  return <div className="border-solid border-b dark:border-slate-700 !my-4" />;
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
        "text-base p-3 lg:p-4 sm:pt-3 lg:pt-4 pt-0 mb-4",
        InputOutlinedDefaultBorders,
        !isOpen && props.closable ? "cursor-pointer" : "",
        !props.title && "lg:pt-2 sm:pt-1 pt-1"
      )}
      onClick={() => props.closable && !isOpen && setIsOpen(!isOpen)}
    >
      <div
        className="float-right space-x-2 items-center flex"
        onClick={(e) => e.stopPropagation()}
      >
        {props.actions}
        {props.closable && (
          <Button
            data-tooltip="Plier / Déplier"
            size="md"
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
          isOpen ? "mt-2 opacity-1" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        {props.children}
      </div>
    </div>
  );
};

export const PageColumns = (props: { children: ReactNode }) => {
  return (
    <div className="flex flex-col sm:space-y-3 lg:flex-row lg:space-x-2 lg:space-y-0 w-full">
      {props.children}
    </div>
  );
};
