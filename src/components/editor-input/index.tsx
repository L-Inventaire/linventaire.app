import CheckList from "@editorjs/checklist";
import Code from "@editorjs/code";
import EditorJS from "@editorjs/editorjs";
import Embed from "@editorjs/embed";
import InlineCode from "@editorjs/inline-code";
import List from "@editorjs/list";
import Marker from "@editorjs/marker";
import Table from "@editorjs/table";
import Underline from "@editorjs/underline";
import { useEffect, useId, useRef } from "react";
import { twMerge } from "tailwind-merge";
import "./index.css";

export const EDITOR_JS_TOOLS = {
  embed: Embed,
  table: Table,
  list: List,
  code: Code,
  marker: Marker,
  checklist: CheckList,
  inlineCode: InlineCode,
  underline: Underline,
};

type EditorInputProps = {
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: string) => void;
};

export const EditorInput = (props: EditorInputProps) => {
  const holder = useId();
  return (
    <EditorInputIn
      key={holder + (props.disabled ? "disabled" : "")}
      {...props}
    />
  );
};

export const EditorInputIn = (props: EditorInputProps) => {
  const holder = useId();
  const editor = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!editor.current) {
      editor.current = new EditorJS({
        data: JSON.parse(props.value || "{}"),
        holder,
        tools: EDITOR_JS_TOOLS,
        placeholder: props.placeholder,
        onChange: async (e) => {
          if (!props.disabled) {
            const val = JSON.stringify(await e.saver.save());
            props.onChange?.(val);
          }
        },
        readOnly: props.disabled,
      });
    }
    return () => {
      if (editor.current && editor.current.destroy) {
        try {
          editor.current.destroy();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  return (
    <div
      className={twMerge("w-full", props.disabled && "remove-first-line-hack")}
    >
      <div id={holder}></div>
    </div>
  );
};
