import { copyToClipboard } from "@features/utils/clipboard";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Input } from "./input-text";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function InputCopiable(props: InputProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(copiedTimeout.current), []);

  const cc = useCallback(() => {
    copyToClipboard(props.value as string);
    setCopied(true);
    clearTimeout(copiedTimeout.current);
    copiedTimeout.current = setTimeout(() => setCopied(false), 1500);
  }, [props.value]);

  return (
    <div className="mt-1 flex w-full rounded-md shadow-sm">
      <Input
        className={twMerge(
          "w-full min-w-0 grow rounded-r-none px-2 shadow-none focus:z-10",
          props.className,
        )}
        {...(_.omit(
          props,
          "onCopy",
          "size",
          "label",
          "inputClassName",
          "className",
        ) as any)}
      />
      <button
        type="button"
        onClick={cc}
        className="-ml-px inline-flex h-9 shrink-0 items-center gap-1.5 rounded-r-md border border-black border-opacity-15 bg-slate-50 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
        ) : (
          <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" />
        )}
        <span aria-live="polite">{copied ? "Copié" : "Copier"}</span>
      </button>
    </div>
  );
}
