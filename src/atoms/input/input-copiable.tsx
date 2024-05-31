import { copyToClipboard } from "@features/utils/clipboard";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { useCallback, useState } from "react";
import { Button } from "../button/button";
import { Input, defaultInputClassName } from "./input-text";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

let copiedTimeout: any = 0;

export default function InputCopiable(props: InputProps) {
  const [copied, setCopied] = useState(false);

  //Function to copy to clipboard props.value
  const cc = useCallback(() => {
    setCopied(false);
    copyToClipboard(props.value as string);
    setCopied(true);
    clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    }, 500);
  }, [setCopied, props.value]);

  return (
    <div className="mt-1 flex rounded-lg shadow-sm">
      <div className="relative flex items-stretch flex-grow focus-within:z-10">
        <Input
          className={
            defaultInputClassName() +
            " rounded-r-none border px-2 " +
            props.className
          }
          {...(_.omit(
            props,
            "onCopy",
            "size",
            "label",
            "inputClassName",
            "className"
          ) as any)}
        />
      </div>
      <Button
        theme="outlined"
        className="-ml-px relative rounded-l-none inline-flex items-center space-x-2 border px-4 py-2"
        onClick={() => cc()}
      >
        {copied && <CheckIcon className="h-4 w-4" aria-hidden="true" />}
        {!copied && (
          <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}
