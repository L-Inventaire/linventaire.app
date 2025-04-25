import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Info } from "@atoms/text";
import { RestDocumentTag } from "@components/deprecated-rest-tags/components/document";
import { FormInput } from "@components/form/fields";
import { useFormController } from "@components/form/formcontext";
import { useHasAccess } from "@features/access";
import { useFields } from "@features/fields/hooks/use-fields";
import { Fields } from "@features/fields/types/types";
import { normalizeStringToKey } from "@features/utils/format/strings";
import {
  BriefcaseIcon,
  CubeIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { Table } from "@molecules/table";
import { Heading } from "@radix-ui/themes";
import _ from "lodash";
import { useState } from "react";
import { Page } from "../../_layout/page";

const tables = [
  {
    label: "Contacts",
    value: "contacts",
    icon: (p: any) => <UserIcon {...p} />,
  },
  {
    label: "Factures, Devis, Bons de commandes et Avoirs",
    value: "invoices",
    icon: (p: any) => <DocumentTextIcon {...p} />,
  },
  {
    label: "Articles",
    value: "articles",
    icon: (p: any) => <CubeIcon {...p} />,
  },
  {
    label: "Services",
    value: "service_items",
    icon: (p: any) => <BriefcaseIcon {...p} />,
  },
  {
    label: "Stock",
    value: "stock_items",
    icon: (p: any) => <ViewColumnsIcon {...p} />,
  },
];

export const tableToIcons = (table: string) =>
  tables.find((a) => a.value === table) || {
    label: table,
    value: table,
    icon: (p: any) => <DocumentTextIcon {...p} />,
  };

export const FieldsPage = () => {
  const { fields, remove, upsert } = useFields();
  const [edit, setEdit] = useState<Partial<Fields> | null>(null);
  const { ctrl } = useFormController(edit || {}, setEdit);
  const hasAccess = useHasAccess();

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Champs personnalisés" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        {hasAccess("FIELDS_MANAGE") && (
          <Button
            size="md"
            className="float-right"
            onClick={() => setEdit({})}
            shortcut={["shift+a"]}
          >
            Ajouter
          </Button>
        )}
        <Modal open={!!edit} onClose={() => setEdit(null)}>
          {!!edit && (
            <ModalContent
              title={
                edit?.id
                  ? "Modifier un champ personnalisé"
                  : "Ajouter un champ personnalisé"
              }
            >
              <div className="space-y-4">
                <FormInput
                  disabled={!!edit?.id}
                  label="Document"
                  placeholder="Choisir un document"
                  type="select"
                  ctrl={ctrl("document_type")}
                  options={tables}
                />
                <FormInput
                  disabled={!!edit?.id}
                  label="Type"
                  placeholder="Choisir un type de champ"
                  type="select"
                  ctrl={ctrl("type")}
                  options={[
                    // "tags" | "text" | "select" | "date" | "boolean" | "number" | "formatted" | "multiselect" | "phone" | "color" | "scan"
                    { label: "Selection", value: "select" },
                    { label: "Selection (multiple)", value: "multiselect" },
                    { label: "Texte", value: "text" },
                    { label: "Nombre", value: "number" },
                    { label: "Booléen", value: "boolean" },
                    { label: "Date", value: "date" },
                    { label: "Users", value: "[type:users]" },
                    { label: "Étiquettes", value: "[type:tags]" },
                    { label: "Fichiers", value: "[type:files]" },
                  ]}
                />
                {ctrl("type").value === "select" && (
                  <FormInput
                    disabled={!!edit?.id}
                    label="Valeurs possibles (séparées par des virgules)"
                    placeholder="Téléphone, Email, Adresse"
                    type="text"
                    ctrl={ctrl("options")}
                  />
                )}
                <hr />
                <FormInput
                  label="Nom de l'attribut"
                  value={edit.name}
                  onChange={(n) => {
                    const codeVersion = normalizeStringToKey(edit.name || "");
                    const newCodeVersion = normalizeStringToKey(n);
                    if ((edit.code || "") === codeVersion) {
                      setEdit({ ...edit, code: newCodeVersion, name: n });
                    } else {
                      setEdit({ ...edit, name: n });
                    }
                  }}
                  autoFocus
                />
                <FormInput
                  disabled={!!edit?.id}
                  label="Code de l'attribut"
                  placeholder="nom_de_l_attribut"
                  type="formatted"
                  format="code"
                  ctrl={ctrl("code")}
                />
                <Button
                  disabled={
                    !edit?.name ||
                    !edit?.code ||
                    !edit?.type ||
                    !edit?.document_type
                  }
                  shortcut={["enter"]}
                  onClick={async () => {
                    await upsert.mutate(edit || {});
                    setEdit(null);
                  }}
                >
                  Enregistrer
                </Button>
              </div>
            </ModalContent>
          )}
        </Modal>

        <Heading size="6">Champs personnalisés</Heading>
        <Info>
          Les champs personnalisés vous permettent de personnaliser les
          informations attachés aux objects de votre inventaire.
        </Info>

        {_.uniq((fields.data?.list || []).map((f) => f.document_type)).map(
          (document) => (
            <div className="mt-6">
              <RestDocumentTag
                label={tableToIcons(document)?.label}
                size="md"
                icon={tableToIcons(document)?.icon}
              />
              <Table
                className="mt-2"
                data={_.sortBy(
                  (fields.data?.list || []).filter(
                    (a) => a.document_type === document
                  ),
                  "name"
                )}
                columns={[
                  {
                    title: "Code",
                    render: (field) => (
                      <Tag
                        icon={<></>}
                        noColor
                        className="font-mono bg-white dark:bg-slate-900"
                      >
                        {field.code}
                      </Tag>
                    ),
                  },
                  {
                    title: "Nom",
                    thClassName: "w-1/2 whitespace-nowrap",
                    render: (field) => <>{field.name}</>,
                  },
                  {
                    hidden: !hasAccess("FIELDS_MANAGE"),
                    title: "Actions",
                    thClassName: "w-1 whitespace-nowrap",
                    render: (field) => {
                      return (
                        <div className="text-right space-x-2 whitespace-nowrap flex items-center">
                          <Button
                            theme="outlined"
                            size="md"
                            onClick={() => setEdit(field)}
                            icon={(p) => <PencilIcon {...p} />}
                          />
                          <ButtonConfirm
                            theme="danger"
                            size="md"
                            onClick={() => remove.mutate(field.id)}
                            icon={(p) => <TrashIcon {...p} />}
                          />
                        </div>
                      );
                    },
                  },
                ]}
              />
            </div>
          )
        )}
      </div>
    </Page>
  );
};
