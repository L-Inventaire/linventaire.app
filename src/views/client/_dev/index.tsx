import { Button } from "@atoms/button/button";
import { Stepper } from "@atoms/stepper";
import { Info, SectionSmall } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { Articles } from "@features/articles/types/types";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { formatAmount } from "@features/utils/format/strings";
import { PlusIcon } from "@heroicons/react/16/solid";
import {
  BuildingStorefrontIcon,
  CubeIcon,
  MapPinIcon,
  QrCodeIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { Page } from "../_layout/page";
import { InputButton } from "@components/input-button";
import { AddressInputButton } from "@components/input-button/address";

export const DevPage = () => {
  const [stepperVal, setStepperVal] = useState("bought");
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<string>("");
  const [article, setArticle] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [serial, setSerial] = useState<string>("");
  const [address, setAddress] = useState<any>(null);

  return (
    <Page>
      <div className="space-y-4">
        <div className="space-y-2">
          <SectionSmall>Buttons</SectionSmall>
          {[true, false].map((withIcon) =>
            ["sm", "md"].map((size) => (
              <div className="space-x-2">
                {[
                  "primary",
                  "secondary",
                  "default",
                  "outlined",
                  "danger",
                  "invisible",
                ].map((theme) =>
                  [true, false].map((readonly) => (
                    <Button
                      size={size as any}
                      disabled={readonly}
                      theme={theme as any}
                      loading={readonly && loading}
                      onClick={() => setLoading(!loading)}
                      icon={withIcon ? (p) => <PlusIcon {...p} /> : undefined}
                    >
                      {theme}
                    </Button>
                  ))
                )}
              </div>
            ))
          )}
        </div>
        <div className="space-y-2">
          <SectionSmall>Stepper</SectionSmall>
          {[true, false].map((readonly) =>
            ["sm", "md", "md", "lg"].map((size) => (
              <div>
                <Stepper
                  size={size as any}
                  readonly={readonly}
                  onChange={setStepperVal}
                  value={stepperVal}
                  options={[
                    [
                      { title: "Bought", color: "green", value: "bought" },
                      { title: "Draft", color: "gray", value: "draft" },
                    ],
                    [{ title: "Stock", color: "blue", value: "stock" }],
                    [{ title: "Sold", color: "red", value: "sold" }],
                  ]}
                />
              </div>
            ))
          )}
        </div>
        <div className="space-y-2">
          <SectionSmall>Input button</SectionSmall>
          <Info>A button that becomes an input when clicked</Info>
          <div>
            <AddressInputButton
              size="md"
              icon={(p) => <MapPinIcon {...p} />}
              value={address}
              onChange={setAddress}
            />
          </div>
          <div>
            <InputButton
              size="md"
              icon={(p) => <QrCodeIcon {...p} />}
              placeholder="Numéro de série"
              value={serial}
              onChange={setSerial}
            />
          </div>
        </div>
        <div className="space-y-2">
          <SectionSmall>Files input</SectionSmall>
          <FilesInput value={files} onChange={setFiles} size="md" />
        </div>
        <div className="space-y-2">
          <SectionSmall>Selector Card (tags / users)</SectionSmall>
          <Info>To use when selecting a rest entity</Info>

          <div className="space-x-1">
            <TagsInput value={tags} onChange={setTags} size="xs" />
          </div>
          <div className="space-x-1">
            <UsersInput withName value={users} onChange={setUsers} size="sm" />
            <TagsInput value={tags} onChange={setTags} size="sm" />
            <UsersInput value={users} onChange={setUsers} size="sm" max={1} />
          </div>

          <div className="space-x-2">
            <UsersInput withName value={users} onChange={setUsers} size="md" />
            <TagsInput value={tags} size="md" disabled />
            <UsersInput value={users} onChange={setUsers} size="md" max={1} />
          </div>
        </div>

        <div className="space-y-2">
          <SectionSmall>Selector Card</SectionSmall>
          <Info>To use when selecting a rest entity</Info>

          <div className="space-x-2">
            <RestDocumentsInput
              label="Fournisseur"
              placeholder="Aucun fournisseur"
              entity="contacts"
              filter={{ is_supplier: true } as Partial<Contacts>}
              value={supplier}
              onChange={(id) => setSupplier(id as string)}
              icon={(p) => <BuildingStorefrontIcon {...p} />}
              render={getContactName}
              size="md"
            />
            <Button
              size="md"
              theme="outlined"
              icon={(p) => <MapPinIcon {...p} />}
            >
              No address (classic md button)
            </Button>
          </div>
          <RestDocumentsInput
            size="lg"
            label="Article"
            placeholder="Sélectionner un article"
            entity="articles"
            value={article}
            onChange={(id) => setArticle(id as string)}
            icon={(p) => <CubeIcon {...p} />}
          />
          <br />
          <RestDocumentsInput
            size="xl"
            label="Article"
            placeholder="Sélectionner un article"
            entity="articles"
            value={article}
            onChange={(id) => setArticle(id as string)}
            icon={(p) => <CubeIcon {...p} />}
            render={(article: Articles) => (
              <div className="space-y-1 py-1">
                <div>{article.name}</div>
                <div className="space-x-1">
                  <Button size="sm" theme="outlined">
                    {article.type}
                  </Button>
                  <Button size="sm" theme="outlined">
                    {formatAmount(article.price)}
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </Page>
  );
};
