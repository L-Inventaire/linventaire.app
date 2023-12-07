import { ReactNode } from "react";
import * as Text from "@atoms/text";

export const Card = (props: {
  className?: string;
  prefix?: ReactNode;
  title?: ReactNode | string;
  text: ReactNode | string;
  button?: ReactNode;
}) => {
  return (
    <div
      className={
        "bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center p-3 " +
        (props.className || "")
      }
    >
      {props.prefix}
      <div className="grow">
        {props.title && (
          <>
            <Text.Base>{props.title}</Text.Base>
            <br />
          </>
        )}
        <Text.Info>{props.text}</Text.Info>
      </div>
      {props.button}
    </div>
  );
};

export default Card;
