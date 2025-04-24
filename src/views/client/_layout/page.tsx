import { Button } from "@atoms/button/button";
import { InputOutlinedDefaultBorders } from "@atoms/styles/inputs";
import { Section } from "@atoms/text";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { ScrollArea, ScrollAreaProps } from "@radix-ui/themes";
import { LayoutTitleAtom } from "@views/client/_layout/header";
import { ErrorBoundary } from "@views/error-boundary";
import _ from "lodash";
import React, { ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export const Page = (
  props: {
    children: ReactNode;
    loading?: boolean;
    bar?: ReactNode;
    footer?: ReactNode;
    title?: {
      label?: string;
      to?: string;
      href?: string;
    }[];
    inset?: boolean;
    scrollAreaProps?: ScrollAreaProps;
    scrollAreaChildProps?: React.ComponentProps<"div">;
  } & Omit<React.ComponentProps<"div">, "title" | "children">
) => {
  const setTitle = useSetRecoilState(LayoutTitleAtom);
  const location = useParams();

  useEffect(() => {
    setTitle(props.title || []);
    // Set title on window
    document.title = (props.title || []).map((t) => t.label).join(" - ");
  }, [location.pathname, props.title]);

  // On loading set to true, unfocus everything
  useEffect(() => {
    if (props.loading) (document.activeElement as any)?.blur();
  }, [props.loading]);

  return (
    <ErrorBoundary>
      <div
        className={twMerge(
          "@container flex flex-col grow w-full text-black dark:text-white min-h-full sm:bg-transparent",
          props.className,
          props.loading ? "opacity-50 pointer-events-none" : ""
        )}
        {..._.omit(props, "className", "children", "bar", "footer", "title")}
      >
        {props.bar && (
          <div className="border-b flex min-h-12 border-slate-100 dark:border-slate-700 shrink-0">
            {props.bar}
          </div>
        )}
        <div className="grow relative">
          <ScrollArea
            className={twMerge(
              "!absolute left-0 top-0 w-full h-full",
              props?.scrollAreaProps?.className
            )}
            {...props?.scrollAreaProps}
          >
            <div
              className={twMerge(
                !props.inset && "p-3 h-full",
                !!props.inset && "h-full",
                props?.scrollAreaChildProps?.className
              )}
              {...props?.scrollAreaChildProps}
            >
              {props.children}
            </div>
          </ScrollArea>
        </div>
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
    <motion.div
      className="flex flex-col sm:space-y-3 lg:flex-row lg:space-x-2 lg:space-y-0 w-full"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {props.children}
    </motion.div>
  );
};
