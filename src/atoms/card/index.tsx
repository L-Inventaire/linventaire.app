import { ReactNode } from "react";
import * as Text from "@atoms/text";
import { twMerge } from "tailwind-merge";
import { AnimatedHeight } from "@components/animated-side/height";
import { CardDefault } from "@atoms/styles/cards";

export const Card = (props: {
  children?: ReactNode;
  className?: string;
  wrapperClassName?: string;
  icon?: (p: any) => ReactNode;
  title: ReactNode | string;
  show?: boolean;
}) => {
  return (
    <div
      className={props.show !== false ? props.wrapperClassName || "my-4" : ""}
    >
      <AnimatedHeight>
        {props.show !== false && (
          <div
            className={twMerge(
              CardDefault,
              "p-2 flex items-center",
              props.className
            )}
          >
            {props.icon && props.icon({ className: "w-4 h-4 mr-2" })}
            <div className="grow flex flex-col">
              {props.title && <Text.Base>{props.title}</Text.Base>}
              <Text.Info>{props.children}</Text.Info>
            </div>
          </div>
        )}
      </AnimatedHeight>
    </div>
  );
};
