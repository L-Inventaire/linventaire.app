import { Button, ButtonProps } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { AnimatedHeight } from "@components/animated-height";
import {
  Shortcut,
  showShortCut,
  useShortcuts,
} from "@features/utils/shortcuts";
import _ from "lodash";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { atom, useRecoilState, useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { MenuItem, MenuSection } from "./components";
import { Input } from "@atoms/input/input-text";

export type DropDownMenuType = {
  type?: "divider" | "danger" | "menu" | "label" | "title"; // default to menu
  icon?: (p: any) => React.ReactNode;
  label?: string | React.ReactNode;
  shortcut?: Shortcut[];
  onClick?: (e: MouseEvent) => void;
  to?: string;
  active?: boolean;
  className?: string;
}[];

export const DropDownAtom = atom<{
  target: HTMLElement | null;
  menu: DropDownMenuType | ((query: string) => Promise<DropDownMenuType>);
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
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useRecoilState(DropDownAtom);
  const [menu, setMenu] = useState<DropDownMenuType>(
    typeof state.menu === "function" ? [] : state.menu
  );
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

  useShortcuts(["esc"], () => {
    clickOutside();
  });

  useEffect(() => {
    if (typeof state.menu === "function") {
      searchRef.current?.focus();
      state.menu(query).then((m) => {
        setMenu(m);
      });
    } else {
      setMenu(state.menu);
    }
  }, [query, state.menu]);

  return (
    <div
      ref={ref}
      style={{
        pointerEvents: state.target ? "all" : "none",
        opacity: state.target && menu.length > 0 ? 1 : 0,
      }}
      className="z-50 transition-all fixed sm:bottom-auto bottom-0 h-auto shadow-xl border border-slate-50 dark:border-slate-700 sm:rounded-lg max-w-2xl w-full sm:w-64 bg-white dark:bg-slate-900 overflow-hidden"
    >
      <AnimatedHeight
        trigger={(cb) => (autoHeightTrigger = cb)}
        className="px-2 py-1"
      >
        {!!state.target && !!menu.length && (
          <Button
            className="hidden"
            shortcut={["esc"]}
            onClick={() => {
              clickOutside();
            }}
          />
        )}
        {typeof state.menu === "function" && (
          <Input
            inputRef={searchRef}
            size="sm"
            autoFocus
            className="w-full p-2 mt-1"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                clickOutside();
              }
            }}
          />
        )}
        <Menu menu={menu} clickItem={() => clickOutside()} />
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
        let active = false || m.active;
        if (m.to && location.pathname.indexOf(m.to) === 0) {
          active = true;
        }
        return m.type === "divider" ? (
          <Divider key={i} />
        ) : m.type === "label" ? (
          <Fragment key={i}>{m.label}</Fragment>
        ) : m.type === "title" ? (
          <MenuSection key={i} label={m.label} />
        ) : (
          <MenuItem
            className={twMerge(
              "my-1",
              m.type === "danger" && "bg-red-500 text-red-500 dark:text-red-500"
            )}
            key={i}
            active={active}
            onClick={
              m.onClick
                ? (e: MouseEvent) => {
                    m.onClick?.(e);
                    clickItem?.();
                  }
                : undefined
            }
            to={m.to}
            icon={m.icon}
            label={m.label}
            suffix={m.shortcut && <Info>{showShortCut(m.shortcut)}</Info>}
          />
        );
      })}
    </>
  );
};

const Divider = () => (
  <div className="my-2 -mx-2 h-px bg-slate-50 dark:bg-slate-700" />
);
