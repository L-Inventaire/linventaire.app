import { InputOutlinedDefaultBorders } from "@atoms/styles/inputs";
import { FormContextContext } from "@components/form/formcontext";
import "quill-mention";
import { useContext, useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";

import "react-quill/dist/quill.snow.css";
import { twMerge } from "tailwind-merge";
import { Mention, MentionBlot } from "../../lib/quill-mentions";
import "./index.css";

import { ResetProps } from "@components/form/fields";
import { getFullName } from "@features/auth/utils";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useClients } from "@features/clients/state/use-clients";
import { PublicCustomer } from "@features/customers/types/customers";
import "quill-mention/autoregister";

const ColorAttributor = ReactQuill.Quill.import("attributors/style/color");
ColorAttributor.whitelist = [];
ReactQuill.Quill.register(ColorAttributor);

ReactQuill.Quill.register({
  "blots/mention": MentionBlot,
  "modules/mention": Mention,
});

type EditorInputProps = {
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: string) => void;
  resetProps?: ResetProps;
  className?: string;
};

let mentionableUsers: {
  id: string;
  value: string;
}[] = [];

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
  mention: {
    allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
    mentionDenotationChars: ["@", "#"],
    source: function (
      searchTerm: string,
      renderList: any,
      mentionChar: string
    ) {
      let values: any = [];

      if (mentionChar === "@") {
        values = mentionableUsers;
      }

      if (searchTerm.length === 0) {
        renderList(values, searchTerm);
      } else {
        const matches = [];
        for (let i = 0; i < values.length; i++)
          if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase()))
            matches.push(values[i]);
        renderList(matches, searchTerm);
      }
    },
  },
};

export const EditorInputMentionHelper = () => {
  const { client } = useClients();
  const { users } = useClientUsers(client?.client_id || "");

  useEffect(() => {
    mentionableUsers = users.map((user) => ({
      id: "mention:" + user.user_id, // mention: is used for backend to find the user to mention
      value: getFullName(user?.user as PublicCustomer),
    }));
  }, [users]);

  return <></>;
};

export const EditorInput = (props: EditorInputProps) => {
  const formContext = useContext(FormContextContext);

  const ref = useRef<ReactQuill>(null);
  const [focused, setFocused] = useState(false);

  const disabled =
    props.disabled ?? (formContext.disabled || formContext.readonly || false);

  const onEditorChange = (value: any) => {
    // Test if there is content (remove all html tags)
    const hasContent = value.replace(/<[^>]+>/g, "").trim().length > 0;
    props.onChange?.(hasContent ? value : "");
  };

  return (
    <div className="relative">
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
        placeholder={props.placeholder ?? "Cliquer pour ajouter une note"}
        className={twMerge(
          "editor-input",
          disabled && "is-disabled",
          !disabled && "p-2 bg-white dark:bg-slate-950",
          !disabled && InputOutlinedDefaultBorders,
          focused && "has-focus",
          props.className
        )}
        theme="snow"
        value={props.value || ""}
        onChange={onEditorChange}
        modules={modules}
      />
    </div>
  );
};
