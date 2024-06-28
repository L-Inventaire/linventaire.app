import { Button } from "@atoms/button/button";
import { Stepper } from "@atoms/stepper";
import { Info, SectionSmall } from "@atoms/text";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { useCtrlKAsSelect } from "@features/ctrlk/use-ctrlk-as-select";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { Page } from "../_layout/page";

export const DevPage = () => {
  const [stepperVal, setStepperVal] = useState("bought");
  const [loading, setLoading] = useState(false);
  const select = useCtrlKAsSelect();
  const [supplier, setSupplier] = useState<Contacts>();

  return (
    <Page>
      <div className="space-y-4">
        <div className="space-y-2">
          <SectionSmall>Buttons</SectionSmall>
          {[true, false].map((withIcon) =>
            ["xs", "sm"].map((size) => (
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
            ["xs", "sm", "md", "lg"].map((size) => (
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
          TODO
        </div>

        <div className="space-y-2">
          <SectionSmall>Selector Card</SectionSmall>
          <Info>To use when </Info>
          <div
            onClick={() =>
              select<Contacts>("contacts", { is_supplier: true }, (item) => {
                setSupplier(item);
              })
            }
            className="border rounded p-4 w-max cursor-pointer hover:bg-slate-50"
          >
            {!supplier && "Choose a supplier"}
            {supplier && getContactName(supplier)}
          </div>
        </div>
      </div>
    </Page>
  );
};
