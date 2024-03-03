import { Button, ButtonProps } from "@atoms/button/button";
import Link from "@atoms/link";
import { BaseSmall, Info, SectionSmall } from "@atoms/text";
import { AnimatedHeight } from "@components/animated-height";
import _ from "lodash";
import React, { Fragment, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { atom, useRecoilState, useSetRecoilState } from "recoil";

export type DropDownMenuType = {
  type?: "divider" | "danger" | "menu" | "label" | "title"; // default to menu
  icon?: (p: any) => React.ReactNode;
  label?: string | React.ReactNode;
  shortcut?: string[];
  onClick?: () => void;
  to?: string;
}[];

export const DropDownAtom = atom<{
  target: HTMLElement | null;
  menu: DropDownMenuType;
  position?: "bottom" | "left" | "right"; //Default to bottom
}>({
  key: "dropdown",
  default: {
    target: null,
    position: "bottom",
    menu: [],
  },
});

export const DropdownButton = (
  props: { menu: DropDownMenuType } & ButtonProps
) => {
  const setState = useSetRecoilState(DropDownAtom);

  return (
    <Button
      onClick={(e) => {
        setState({
          target: e.currentTarget,
          position: "bottom",
          menu: props.menu,
        });
      }}
      {..._.omit(props, ["menu"])}
    >
      {props.children}
    </Button>
  );
};

let lastTarget: HTMLElement | null = null;
let autoHeightTrigger: (() => void) | null = null;
let timeout: any = 0;

export const DropDownMenu = () => {
  const [state, setState] = useRecoilState(DropDownAtom);
  const ref = React.useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    clearTimeout(timeout);

    // Changed target: animate transition
    if (!lastTarget) {
      if (ref.current)
        ref.current.style.transition = "opacity 0.1s ease-in-out";
    }
    lastTarget = state.target;

    if (state.target) {
      //Get screen position and size
      const targetRect = state.target.getBoundingClientRect();
      if (ref.current) {
        ref.current.style.pointerEvents = "none";
        const position =
          window.screen.width < 640
            ? [0, 0]
            : state.position === "left"
            ? [targetRect.x - 256, targetRect.y]
            : state.position === "right"
            ? [targetRect.x + targetRect.width, targetRect.y]
            : [targetRect.x, targetRect.y + targetRect.height];
        ref.current.style.transform = `translate(${Math.min(
          Math.max(Math.ceil(position[0]), 0),
          window.innerWidth - 256
        )}px, ${Math.max(Math.ceil(position[1]), 0)}px)`;

        if (window.screen.width < 640) {
          ref.current.style.boxShadow =
            "0px 0px 0px 10000px rgba(0, 0, 0, 0.2)";
        } else {
          ref.current.style.boxShadow = "";
        }
      }

      // Trigger animated height now
      autoHeightTrigger?.();

      // For next time, we want to animate the transition
      // Also we want to make sure the menu is not outside the screen
      timeout = setTimeout(() => {
        const height = ref.current?.getBoundingClientRect().height;
        if (height && ref.current) {
          ref.current.style.transition = "all 0.1s ease-in-out";
          ref.current.style.pointerEvents = "all";

          const currentTransform = ref.current?.style.transform.match(/\d+/g);
          ref.current.style.transform = `translate(${
            currentTransform ? currentTransform[0] : 0
          }px, ${Math.max(
            Math.min(
              window.innerHeight - height,
              parseInt(currentTransform ? currentTransform[1] : "0")
            ),
            0
          )}px)`;
        }
      }, 200);
    }
  }, [state.target, state.position]);

  const clickOutside = useCallback(
    (e?: MouseEvent) => {
      if (
        !e ||
        (state.target &&
          !state.target.contains(e.target as Node) &&
          !ref.current?.contains(e.target as Node))
      ) {
        setState({ ...state, target: null });
      }
    },
    [state, setState]
  );

  useEffect(() => {
    updatePosition();
  }, [state.target, updatePosition]);

  useEffect(() => {
    window.addEventListener("resize", updatePosition);
    window.addEventListener("click", clickOutside);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("click", clickOutside);
    };
  }, [updatePosition, clickOutside]);

  return (
    <div
      ref={ref}
      style={{
        pointerEvents: state.target ? "all" : "none",
        opacity: state.target && state.menu.length > 0 ? 1 : 0,
      }}
      className="z-50 transition-all fixed sm:bottom-auto bottom-0 h-auto shadow-xl border border-slate-500 border-opacity-10 sm:rounded-lg max-w-2xl w-full sm:w-64 bg-white dark:bg-wood-900 overflow-hidden"
    >
      <AnimatedHeight
        trigger={(cb) => (autoHeightTrigger = cb)}
        className="px-2 py-1"
      >
        <Menu menu={state.menu} clickItem={() => clickOutside()} />
      </AnimatedHeight>
    </div>
  );
};

export const Menu = ({
  menu,
  clickItem,
}: {
  menu: DropDownMenuType;
  clickItem?: () => void;
}) => {
  const location = useLocation();
  return (
    <>
      {menu.map((m, i) => {
        let active = false;
        if (m.to && location.pathname.indexOf(m.to) === 0) {
          active = true;
        }
        return m.type === "divider" ? (
          <Divider key={i} />
        ) : m.type === "label" ? (
          <Fragment key={i}>{m.label}</Fragment>
        ) : m.type === "title" ? (
          <SectionSmall key={i} className="p-2 -mb-1">
            {m.label}
          </SectionSmall>
        ) : (
          <Link
            noColor
            key={i}
            onClick={() => {
              m.onClick?.();
              clickItem?.();
            }}
            to={m.to}
            className={
              "h-7 my-1 items-center hover:bg-opacity-25 hover:bg-opacity-25 px-2 py-1 rounded-md select-none cursor-pointer flex " +
              (m.type === "danger"
                ? "text-red-500 hover:bg-red-300 "
                : "hover:bg-wood-300 ") +
              (active ? " bg-wood-100 dark:bg-wood-800 " : "")
            }
          >
            {m.icon?.({
              className: "w-4 h-4 mr-1 text-slate-900 dark:text-slate-100",
            })}
            <BaseSmall noColor={m.type === "danger"} className="grow">
              {m.label}
            </BaseSmall>
            {m.shortcut && (
              <Info className="opacity-50">{showShortCut(m.shortcut)}</Info>
            )}
          </Link>
        );
      })}
    </>
  );
};

const Divider = () => (
  <div className="my-2 -mx-2 h-px bg-slate-500 bg-opacity-10" />
);

const showShortCut = (shortcut: string[]) => {
  return shortcut
    .filter((a) =>
      navigator.userAgent.indexOf("Mac OS X") !== -1
        ? true
        : a.indexOf("cmd") === -1
    )
    .map((a) =>
      a
        .replace("cmd", "⌘")
        .replace("ctrl", "ctrl+")
        .replace("alt", "⌥")
        .replace("shift", "⇧")
        .replace("del", "⌫")
        .replace(/\+/g, "")
    )[0];
};
