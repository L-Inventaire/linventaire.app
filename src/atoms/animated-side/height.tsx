import _ from "lodash";
import {
  InputHTMLAttributes,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";

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

    useEffect(() => {
      if (el.current) {
        const observer = new MutationObserver(updateSize);
        observer.observe(el.current, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });

        // Initial update
        updateSize();

        return () => {
          observer.disconnect();
        };
      }
    }, [el, updateSize]);

    // Trigger updateSize if props.trigger is provided
    useEffect(() => {
      if (props.trigger) {
        props.trigger(updateSize);
      }
    }, [props.trigger, updateSize]);
    return (
      <div className="transition-all px-1 -mx-1">
        <div
          {..._.omit(props, "children", "trigger")}
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
