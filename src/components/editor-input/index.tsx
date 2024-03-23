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

export const EditorInput = (props: { placeholder?: string }) => {
  const ReactEditorJS = createReactEditorJS();
  return (
    <ReactEditorJS placeholder={props.placeholder} tools={EDITOR_JS_TOOLS} />
  );
};
