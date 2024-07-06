import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Info, Section } from "@atoms/text";
import { Table } from "@molecules/table";
import { useTags } from "@features/tags/hooks/use-tags";
import { Tags } from "@features/tags/types/types";
import { useState } from "react";
import { Page, PageBlock } from "../../_layout/page";
import { FormInput } from "@components/form/fields";
import { useFormController } from "@components/form/formcontext";
import { Tag } from "@atoms/badge/tag";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { useHasAccess } from "@features/access";

export const TagsPage = () => {
  const { tags, remove, upsert } = useTags();
  const [edit, setEdit] = useState<Partial<Tags> | null>(null);
  const { ctrl } = useFormController(edit || {}, setEdit);
  const hasAccess = useHasAccess();

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Étiquettes" }]}>
      <PageBlock>
        {hasAccess("TAGS_MANAGE") && (
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
                edit?.id ? "Modifier une étiquette" : "Ajouter une étiquette"
              }
            >
              <div className="space-y-4">
                <FormInput label="Name" ctrl={ctrl("name")} autoFocus />
                <FormInput label="Color" type="color" ctrl={ctrl("color")} />
                <Button
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

        <Section>Étiquettes</Section>
        <Info>
          Les étiquettes sont des mots-clés qui vous permettent de classer
          n'importe quel élément de l'inventaire.
        </Info>

        <Table
          className="mt-4"
          data={_.sortBy(tags.data?.list || [], "name")}
          columns={[
            {
              title: "Étiquette",
              render: (tag) => (
                <Tag color={tag.color || "#000000"}>{tag.name}</Tag>
              ),
            },
            {
              hidden: !hasAccess("TAGS_MANAGE"),
              title: "Actions",
              thClassName: "w-1 whitespace-nowrap",
              render: (tag) => {
                return (
                  <div className="text-right space-x-2 whitespace-nowrap flex items-center">
                    <Button
                      theme="outlined"
                      size="md"
                      onClick={() => setEdit(tag)}
                      icon={(p) => <PencilIcon {...p} />}
                    />
                    <ButtonConfirm
                      theme="danger"
                      size="md"
                      onClick={() => remove.mutate(tag.id)}
                      icon={(p) => <TrashIcon {...p} />}
                    />
                  </div>
                );
              },
            },
          ]}
        />
      </PageBlock>
    </Page>
  );
};
