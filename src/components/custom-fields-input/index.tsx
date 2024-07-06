import { InputLabel } from "@atoms/input/input-decoration-label";
import { Info } from "@atoms/text";
import { FilesInput } from "@components/input-rest/files";
import { FormInput } from "@components/form/fields";
import { FormControllerType } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { UsersInput } from "@components/deprecated-users-input";
import { useTableFields } from "@features/fields/hooks/use-fields";
import { Fragment } from "react/jsx-runtime";
import { TagsInput } from "@components/input-rest/tags";

export const CustomFieldsInput = ({
  table,
  ctrl,
  entityId,
  readonly,
  emptyText,
}: {
  table: string;
  ctrl: FormControllerType;
  entityId: string;
  readonly?: boolean;
  emptyText?: React.ReactNode;
}) => {
  const { fields } = useTableFields(table);
  const { value: _value, onChange } = ctrl;
  const value = _value || {};
  return (
    <div className="space-y-4">
      {fields.length === 0 &&
        (emptyText || <Info>Aucun champ disponible</Info>)}
      {fields.map((f) => {
        const type = f.type.replace(/(^\[|\]$)/gm, "");
        const isArray = type.length !== f.type.length;
        return (
          <Fragment key={f.code}>
            {!["type:tags", "type:users", "type:files"].includes(type) && (
              <FormInput
                label={f.name}
                type={type as any}
                value={value[f.code]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [f.code]: e,
                  })
                }
              />
            )}
            {["type:tags", "type:users", "type:files"].includes(type) && (
              <InputLabel
                label={f.name}
                labelClassName={readonly ? "opacity-50" : ""}
                input={
                  <>
                    {type === "type:files" && (
                      <FilesInput
                        disabled={readonly}
                        max={isArray ? undefined : 1}
                        value={value[f.code] || []}
                        onChange={(files) =>
                          onChange({
                            ...value,
                            [f.code]: files,
                          })
                        }
                        rel={{
                          table: "contacts",
                          id: entityId || "",
                          field: "fields." + f.code,
                        }}
                      />
                    )}
                    {type === "type:tags" && (
                      <TagsInput
                        disabled={readonly}
                        max={isArray ? undefined : 1}
                        value={value[f.code] || []}
                        onChange={(tags) =>
                          onChange({
                            ...value,
                            [f.code]: tags,
                          })
                        }
                      />
                    )}
                    {type === "type:users" && (
                      <UsersInput
                        disabled={readonly}
                        max={isArray ? undefined : 1}
                        value={value[f.code] || []}
                        onChange={(users) =>
                          onChange({
                            ...value,
                            [f.code]: users,
                          })
                        }
                      />
                    )}
                    {!["type:users", "type:files", "type:tags"].includes(
                      type
                    ) && (
                      <RestDocumentsInput
                        disabled={readonly}
                        max={isArray ? undefined : 1}
                        value={value[f.code] || isArray ? ([] as any) : ""}
                        onChange={(users: any) =>
                          onChange({
                            ...value,
                            [f.code]: users,
                          })
                        }
                        entity={type.replace("type:", "")}
                      />
                    )}
                  </>
                }
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
};
