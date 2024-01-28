import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import _ from "lodash";
import {
  InputHTMLAttributes,
  memo,
  ReactNode,
  useCallback,
  useRef,
} from "react";

let interval: any = null;

export const AnimatedHeight = memo(
  (
    props: {
      trigger?: (cb: () => void) => void;
      children: ReactNode;
    } & InputHTMLAttributes<HTMLDivElement>
  ) => {
    const el = useRef<HTMLDivElement>(null);

    const updateSize = useCallback(() => {
      if (el.current) {
        const contentHeight = el.current.scrollHeight;
        const parent = el.current.parentNode as HTMLDivElement;
        parent.style.height = `${contentHeight}px`;
        parent.style.overflow = `hidden`;
      }
    }, [el]);

    props.trigger?.(updateSize);

    useControlledEffect(() => {
      interval = setInterval(() => {
        updateSize();
      }, 200);
      return () => {
        clearInterval(interval);
      };
    }, []);

    return (
      <div className="transition-all px-1 -mx-1">
        <div
          {..._.omit(props, "children")}
          ref={el}
          style={{
            boxSizing: "border-box",
          }}
        >
          {props.children}
        </div>
      </div>
    );
  }
);
