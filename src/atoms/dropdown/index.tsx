import { AnimatedHeight } from "@atoms/animated-side/height";
import { Button, ButtonProps } from "@atoms/button/button";
import { Info } from "@atoms/text";
import {
  Shortcut,
  showShortCut,
  useShortcuts,
  useToggleShortcuts,
} from "@features/utils/shortcuts";
import { DropdownMenu } from "@radix-ui/themes";
import _ from "lodash";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { atom, useRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { MenuItem, MenuSection } from "./components";

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
  position?: "top" | "bottom" | "left" | "right"; //Default to bottom
  refreshTime?: number;
}>({
  key: "dropdown",
  default: {
    target: null,
    position: "bottom",
    menu: [],
    refreshTime: 0,
  },
});

export const DropdownButton = (
  props: {
    menu: DropDownMenuType;
    position?: "top" | "left" | "bottom" | "right";
  } & ButtonProps
) => {
  const [open, setOpen] = useState(false);

  const { pause, resume } = useToggleShortcuts();

  useEffect(() => {
    if (open) {
      pause();
    } else {
      resume();
    }
    return () => {
      resume();
    };
  }, [open]);

  return (
    <DropdownMenu.Root
      open={open && !props.disabled && !props.readonly}
      onOpenChange={(a) => setOpen(a)}
    >
      <DropdownMenu.Trigger>
        <div>
          <Button onClick={() => setOpen(true)} {..._.omit(props, ["menu"])}>
            {props.children}
          </Button>
        </div>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {props.menu.map((m, i) => {
          return m.type === "divider" ? (
            <DropdownMenu.Separator key={i} />
          ) : m.type === "label" ? (
            <DropdownMenu.Label key={i}>{m.label}</DropdownMenu.Label>
          ) : m.type === "title" ? (
            <MenuSection key={i} label={m.label} />
          ) : (
            <DropdownMenu.Item
              onClick={
                m.onClick
                  ? (e: any) => {
                      m.onClick?.(e);
                    }
                  : undefined
              }
              className={twMerge(
                "my-1",
                m.type === "danger" &&
                  "bg-red-500 text-red-500 dark:text-red-500"
              )}
              color={m.type === "danger" ? "crimson" : undefined}
              key={i}
              shortcut={m.shortcut && showShortCut(m.shortcut)}
            >
              {m.icon && m.icon({ className: "w-4 h-4" })}
              {m.label}
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

let lastTarget: HTMLElement | null = null;
let autoHeightTrigger: (() => void) | null = null;
let timeout: any = 0;
let backToInitialSizeTimeout: any = 0;

export const DropDownMenu = () => {
  const location = useLocation();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [query] = useState("");
  const [state, setState] = useRecoilState(DropDownAtom);
  const [menu, setMenu] = useState<DropDownMenuType>(
    typeof state.menu === "function" ? [] : state.menu
  );
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenu([]);
  }, [location]);

  const updatePosition = useCallback(() => {
    clearTimeout(timeout);
    clearTimeout(backToInitialSizeTimeout);

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
        let windowWidth = window.innerWidth;
        if (windowWidth - (targetRect.x + targetRect.width) < 256) {
          windowWidth = targetRect.x + targetRect.width;
        }
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
          windowWidth - 256
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
        const targetRect = state.target?.getBoundingClientRect?.();

        if (height && ref.current) {
          let windowHeight = window.innerHeight;
          if (targetRect?.y && windowHeight - targetRect?.y < height) {
            windowHeight = targetRect.y;
          }

          ref.current.style.transition = "all 0.1s ease-in-out";
          ref.current.style.pointerEvents = "all";

          const currentTransform =
            ref.current?.style.transform.match(/[\d.]+/g);
          ref.current.style.transform = `translate(${
            currentTransform ? currentTransform[0] : 0
          }px, ${Math.max(
            Math.min(
              windowHeight - height,
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
  }, [query, state.menu, state.target]);

  useEffect(() => {
    if (!state.target) {
      backToInitialSizeTimeout = setTimeout(() => {
        setMenu([]);
      }, 1000);
    }
  }, [state.target]);

  return (
    <div
      ref={ref}
      style={{
        pointerEvents: state.target ? "all" : "none",
        opacity: state.target && menu.length > 0 ? 1 : 0,
      }}
      className="z-90 transition-all fixed sm:bottom-auto bottom-0 h-auto shadow-xl border border-slate-50 dark:border-slate-700 sm:rounded-lg max-w-3xl w-full sm:w-64 bg-white dark:bg-slate-900 overflow-hidden"
    >
      <AnimatedHeight
        trigger={(cb) => (autoHeightTrigger = cb)}
        className="px-2 py-1"
      >
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
