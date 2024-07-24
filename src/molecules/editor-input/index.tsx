import { InputOutlinedDefaultBorders } from "@atoms/styles/inputs";
import { FormContextContext } from "@components/form/formcontext";
import { useContext, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { twMerge } from "tailwind-merge";
import "./index.css";

type EditorInputProps = {
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: string) => void;
};

const modules = {
  toolbar: [
    ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
  ],
};

export const EditorInput = (props: EditorInputProps) => {
  const formContext = useContext(FormContextContext);

  const ref = useRef<ReactQuill>(null);
  const [focused, setFocused] = useState(false);

  const disabled =
    props.disabled || formContext.disabled || formContext.readonly || false;

  const onEditorChange = (value: any) => {
    props.onChange?.(value);
  };

  return (
    <ReactQuill
      readOnly={disabled}
      ref={ref}
      onKeyDown={(e) => {
        // If escape key is pressed, blur the editor
        if (e.key === "Escape") {
          ref.current?.blur();
          setFocused(false);
        }
        // If contains ctrl key, don't stop propagation
        if (e.ctrlKey || e.metaKey) {
          return;
        }
        e.stopPropagation();
      }}
      onKeyUp={(e) => {
        e.stopPropagation();
      }}
      onKeyPress={(e) => {
        e.stopPropagation();
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={props.placeholder || "Cliquer pour ajouter une note"}
      className={twMerge(
        "editor-input",
        disabled && "is-disabled",
        !disabled && "p-2 bg-white dark:bg-slate-950",
        !disabled && InputOutlinedDefaultBorders,
        focused && "has-focus"
      )}
      theme="snow"
      value={props.value || ""}
      onChange={onEditorChange}
      modules={modules}
    />
  );
};
