import { Button } from "@atoms/button/button";
import Link from "@atoms/link";
import { FormContextContext } from "@components/form/formcontext";
import { TrashIcon } from "@heroicons/react/16/solid";
import { ReactNode, useContext } from "react";

/** This component will simply show a link "add XXX" and create as many inputs we want (+ a trash icon) */
export const MultiInput = (props: {
  render: (value: any, onChange: any) => ReactNode;
  value: any[];
  onChange: (values: any[]) => void;
  title?: string;
  readonly?: boolean;
}) => {
  const formContext = useContext(FormContextContext);

  const readonly = props.readonly ?? formContext.readonly;

  const { render, value, onChange, title } = props;
  return (
    <div className="flex flex-col space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex items-end space-x-2">
          {render(v, (v: any) => {
            const newValues = [...value];
            newValues[i] = v;
            onChange(newValues);
          })}
          {!readonly && (
            <Button
              className="m-0"
              size="sm"
              theme="invisible"
              danger
              icon={(p) => <TrashIcon {...p} />}
              onClick={() => {
                const newValues = [...value];
                newValues.splice(i, 1);
                onChange(newValues);
              }}
            />
          )}
        </div>
      ))}
      {!readonly && (
        <Link onClick={() => onChange([...value, null])}>
          {title || "Add another"}
        </Link>
      )}
    </div>
  );
};
