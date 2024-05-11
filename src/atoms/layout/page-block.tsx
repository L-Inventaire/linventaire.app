import { ErrorBoundary } from "@views/error-boundary";
import _ from "lodash";

export const PageBlock = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <ErrorBoundary>
      <div
        className={
          "bg-white dark:bg-wood-700 border border-wood-200 dark:border-wood-600 py-2 rounded px-4" +
          (props.className ? " " + props.className : "")
        }
        {..._.omit(props, "className", "children")}
      >
        {props.children}
      </div>
    </ErrorBoundary>
  );
};

export const PageBlockHr = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <hr
      className={"!my-4 -mx-4" + (props.className ? " " + props.className : "")}
      {..._.omit(props, "className", "children")}
    />
  );
};
