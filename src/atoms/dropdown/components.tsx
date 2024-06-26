import Link from "@atoms/link";
import { Base, Info } from "@atoms/text";
import { registerRootNavigation } from "@components/ctrl-k";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";

export const MenuSection = ({
  label,
  children,
  suffix,
  show,
  closable,
  className,
}: {
  label: string | React.ReactNode;
  children?: React.ReactNode;
  suffix?: React.ReactNode;
  show?: boolean;
  closable?: boolean;
  className?: string;
}) => {
  if (show === false) return null;
  return (
    <>
      <div
        className={twMerge(
          "py-px pl-2 pr-1 h-7 w-60 rounded text-black flex items-center space-x-2",
          className
        )}
      >
        <Info className="mt-px font-medium">{label}</Info>
        {closable && <ChevronDownIcon className="!-ml-0 h-4 w-4 opacity-25" />}
        <div className="grow" />
        {suffix}
      </div>
      {children}
    </>
  );
};

export const MenuItem = ({
  active,
  icon,
  to,
  onClick,
  label,
  show,
  className,
  suffix,
}: {
  active?: boolean;
  icon?: (p: any) => React.ReactNode;
  to?: string;
  onClick?: (e: MouseEvent) => void;
  label?: string | React.ReactNode;
  show?: boolean;
  className?: string;
  suffix?: React.ReactNode;
}) => {
  const autoScrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  if (active === undefined && to && location.pathname.indexOf(to) === 0) {
    active = true;
  }

  useEffect(() => {
    if (active && autoScrollRef.current)
      autoScrollRef.current.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest",
      });
  }, [active]);

  if (show === false) return null;

  return (
    <Link
      onClick={onClick}
      to={to}
      noColor
      className={twMerge(
        "relative py-px px-2 h-7 w-full rounded text-black dark:text-white bg-gray-500 bg-opacity-0 hover:bg-opacity-15 active:bg-opacity-25 cursor-pointer flex items-center space-x-2",
        active && "bg-opacity-15 dark:bg-opacity-25 ",
        className
      )}
    >
      <div ref={autoScrollRef} className="h-24 absolute" />
      {icon &&
        icon({
          className: "h-4 w-4 opacity-80",
        })}
      <Base noColor className="grow mt-px whitespace-nowrap">
        {label}
      </Base>
      {suffix}
    </Link>
  );
};
