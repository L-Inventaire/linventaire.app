import { Title } from "@atoms/text";
import { LayoutTitleAtom } from "@views/client/_layout/header";
import { ErrorBoundary } from "@views/error-boundary";
import _ from "lodash";
import React, { ReactNode, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";

type HeaderFooterProps = {
  header?: ReactNode;
  footer?: ReactNode;
};

export const NewPage = (
  props: {
    children: ReactNode;
    bar?: ReactNode;
    title?: {
      items: {
        label?: string;
        to?: string;
        href?: string;
      }[];
      render?: ReactNode;
    } & HeaderFooterProps;
  } & Omit<React.ComponentProps<"div">, "title" | "children"> &
    HeaderFooterProps
) => {
  return (
    <ErrorBoundary>
      <div
        className={twMerge(
          "flex flex-col grow w-full text-black dark:text-white min-h-full sm:bg-transparent p-6 lg:p-9",
          props.className
        )}
        {..._.omit(props, "className", "children", "bar", "footer", "title")}
      >
        {props.header}
        <PageTitle title={props.title} />
        {props.footer}
      </div>
    </ErrorBoundary>
  );
};

export type PageTitleProps = {
  title?: {
    items: {
      label?: string;
      to?: string;
      href?: string;
    }[];
    render?: ReactNode;
  } & HeaderFooterProps;
} & Omit<React.ComponentProps<"div">, "title"> &
  HeaderFooterProps;

export const PageTitle = ({ title, ...props }: PageTitleProps) => {
  const setTitle = useSetRecoilState(LayoutTitleAtom);
  const location = useParams();

  const titleText = (title?.items || []).map((t) => t.label).join(" - ");

  useEffect(() => {
    setTitle(title?.items || []);
    // Set title on window
    document.title = titleText;
  }, [location.pathname, title]);

  return (
    <div
      {..._.omit(props, "className")}
      className={twMerge("flex flex-col w-full", props.className)}
    >
      {props.header}
      <div className="flex w-full">
        <Title className={"mr-0 w-max"}>{titleText}</Title>
        {title?.render}
      </div>
      {props.footer}
    </div>
  );
};

export type VerticalLineProps = React.ComponentProps<"div">;

export const VerticalLine = ({ ...props }) => {
  return (
    <div
      className={twMerge(
        "w-[1px] min-h-1 h-full bg-slate-200 mx-6",
        props.className
      )}
      {..._.omit(props, "className")}
    >
      ‎
    </div>
  );
};
