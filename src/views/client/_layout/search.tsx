import { Button } from "@atoms/button/button";
import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { Input } from "@atoms/input/input-text";
import { Info } from "@atoms/text";
import { CtrlKAtom } from "@features/ctrlk/store";
import { showShortCut } from "@features/utils/shortcuts";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSetRecoilState } from "recoil";

export const Search = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const openCtrlK = useSetRecoilState(CtrlKAtom);

  return (
    <div className="md:relative z-10 w-full">
      <InputDecorationIcon
        className="w-full relative z-20 whitespace-nowrap"
        prefix={(p) => <MagnifyingGlassIcon {...p} />}
        suffix={(p) => (
          <Info className={p.className + " mr-1"}>
            {showShortCut(["cmd+K"])}
          </Info>
        )}
        input={({ className }) => (
          <Input
            className="w-full"
            size="md"
            onFocus={(e) => {
              e.preventDefault();
              openCtrlK((state) => ({
                ...state,
                path: [
                  {
                    mode: "action",
                  },
                ],
              }));
            }}
            inputClassName={"!rounded-md text-black " + className}
            placeholder={t("header.search.placeholder")}
          />
        )}
      />
      <div className="hidden">
        <Button
          btnRef={buttonRef}
          shortcut={["cmd+k"]}
          onClick={() => {
            openCtrlK((state) => ({
              ...state,
              path: [
                {
                  mode: "action",
                },
              ],
            }));
          }}
        >
          .
        </Button>
      </div>
    </div>
  );
};
