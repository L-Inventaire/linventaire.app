import CheckList from "@editorjs/checklist";
import Code from "@editorjs/code";
import Embed from "@editorjs/embed";
import InlineCode from "@editorjs/inline-code";
import List from "@editorjs/list";
import Marker from "@editorjs/marker";
import Table from "@editorjs/table";
import Underline from "@editorjs/underline";
import { createReactEditorJS } from "react-editor-js";
import "./index.css";
import { twMerge } from "tailwind-merge";

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

export const EditorInput = (props: {
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: string) => void;
}) => {
  const ReactEditorJS = createReactEditorJS();
  return (
    <div
      className={twMerge("w-full", props.disabled && "remove-first-line-hack")}
    >
      <ReactEditorJS
        readOnly={props.disabled}
        onChange={async (e) => {
          if (!props.disabled) {
            const val = JSON.stringify(await e.saver.save());
            props.onChange?.(val);
          }
        }}
        placeholder={props.placeholder}
        defaultValue={JSON.parse(props.value || "{}")}
        tools={EDITOR_JS_TOOLS}
      />
    </div>
  );
};
