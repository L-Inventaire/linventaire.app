/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from "react";

// @ts-ignore
interface TabsProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tabs: { value: string | number; label: JSX.Element | string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  parentClassName?: string;
}

const defaultTabClassName =
  " text-sm cursor-pointer h-10 px-3 flex items-center border-b-2 border-transparent hover:text-blue-500 transition-colors";
const activeTabClassName = " text-blue-400 border-blue-400 ";
const inactiveTabClassName = " text-zinc-500 ";

export default function Tabs(props: TabsProps) {
  return (
    <>
      <div
        className={`overflow-auto flex w-100 border-b border-zinc-200 dark:border-zinc-800 transition-all select-none ${props.className}`}
      >
        {props.tabs.map((tab) => {
          const cl =
            defaultTabClassName +
            (tab.value === props.value
              ? activeTabClassName
              : inactiveTabClassName) +
            props.parentClassName;
          return (
            <div
              key={tab.value}
              className={cl}
              onClick={() => props.onChange(tab.value)}
            >
              {tab.label}
            </div>
          );
        })}
      </div>
    </>
  );
}
