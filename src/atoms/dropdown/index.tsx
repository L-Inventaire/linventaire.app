import { Button, ButtonProps } from "@atoms/button/button";
import { ChevronDownIcon } from "@heroicons/react/outline";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { atom, useRecoilState } from "recoil";

type OptionsType = {
  label: React.ReactNode;
  className?: string;
  icon?: (props: { className?: string }) => React.ReactNode;
  onClick?: () => void;
};

type DropdownProps = {
  options: OptionsType[];
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export const DropdownRoot = () => {
  return <div id="dropdown-root" />;
};

const CurrentlyActiveDropdownAtom = atom({
  key: "CurrentlyActiveDropdownAtom",
  default: "",
});

let i = 1;
const getId = () => {
  i += 1;
  return `dropdown-${i}`;
};

export const Dropdown = ({ options, children, ...props }: DropdownProps) => {
  const [currentlyActiveDropDown, setCurrentlyActiveDropDown] = useRecoilState(
    CurrentlyActiveDropdownAtom
  );
  const refId = useRef<string | null>(getId());
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = (e: any) => {
    if (props.onClick) props.onClick(e);
    const isVisibleAndCurrentlyActive =
      isVisible && currentlyActiveDropDown === refId.current;
    if (!isVisibleAndCurrentlyActive)
      setCurrentlyActiveDropDown(refId.current || "");
    setIsVisible(!isVisibleAndCurrentlyActive);
  };

  const onClick = (item: OptionsType, e: any) => {
    if (item.onClick) {
      item.onClick();
      setIsVisible(false);
    }
  };

  const closeDropdown = (e: any) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", closeDropdown);
    document.addEventListener("mousewheel", closeDropdown);
    return () => {
      document.removeEventListener("click", closeDropdown);
      document.removeEventListener("mousewheel", closeDropdown);
    };
  }, []);

  useEffect(() => {
    if (
      isVisible &&
      currentlyActiveDropDown &&
      dropdownRef.current &&
      buttonRef.current
    ) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = dropdownRef.current.offsetWidth;

      let top = rect.bottom;
      let left = rect.left;

      // Ensure dropdown doesn't go beyond the window's right edge
      if (left + dropdownWidth > window.innerWidth) {
        left = rect.right - dropdownWidth; // Align to the right of the button
      }

      dropdownRef.current.style.top = `${top}px`;
      dropdownRef.current.style.left = `${left}px`;
    }
  }, [isVisible, currentlyActiveDropDown]);

  const dropdownContent = (
    <div
      className="absolute bg-white dark:bg-wood-950 border rounded-sm shadow"
      style={{ zIndex: 999 }}
      ref={dropdownRef}
    >
      {options.map((item, index) => {
        return (
          <div
            key={index}
            className={
              "text-sm w-40 p-2 flex flex-row items-center " +
              item.className +
              " " +
              (item.onClick
                ? "cursor-pointer hover:bg-gray-500 hover:bg-opacity-10 "
                : "")
            }
            onClick={(e) => onClick(item, e)}
          >
            {item.icon &&
              item.icon({ className: "w-4 h-4 inline mr-1 shrink-0" })}
            {item.label}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        onClick={toggleDropdown}
        ref={buttonRef}
        {..._.omit(props, "children", "onClick")}
      >
        {children}
      </div>
      {isVisible &&
        currentlyActiveDropDown === refId.current &&
        ReactDOM.createPortal(
          dropdownContent,
          document.getElementById("dropdown-root")!
        )}
    </>
  );
};

export const DropdownButton = ({
  children,
  options,
  className,
  ...props
}: ButtonProps & {
  options: OptionsType[];
}) => {
  return (
    <Dropdown
      options={options}
      className={className}
      onClick={props.onClick as any}
    >
      <Button
        theme="primary"
        size="sm"
        {..._.omit(props, "children", "className", "options", "onClick")}
      >
        {children}
        <ChevronDownIcon className="w-4 h-4 ml-1 -mr-1" />
      </Button>
    </Dropdown>
  );
};
