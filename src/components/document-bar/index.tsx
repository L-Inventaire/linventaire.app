import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
import { getRoute } from "@features/routes";
import { copyToClipboard } from "@features/utils/clipboard";
import { useNavigateAlt } from "@features/utils/navigate";
import { RestEntity } from "@features/utils/rest/types/types";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import {
  ClockIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import _ from "lodash";
import { useSetRecoilState } from "recoil";

export const DocumentBar = ({
  mode,
  document,
  onSave,
  prefix,
  suffix,
  loading,
  onClose,
  ...props
}: {
  loading?: boolean;
  mode: "read" | "write";
  document: any & RestEntity;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onClose?: () => void;
  backRoute?: string;
  viewRoute?: string;
  editRoute?: string;
  onPrint?: () => Promise<void>;
  onSave?: () => Promise<void>;
  onRemove?: () => Promise<void>;
}) => {
  const setMenu = useSetRecoilState(DropDownAtom);

  const navigate = useNavigateAlt();

  const cancel = async () => {
    if (onClose) return onClose();
    // Get previous route
    navigate(
      !document.id || mode === "read"
        ? getRoute(props.backRoute || "/")
        : getRoute(props.viewRoute || "/", { id: document.id })
    );
  };

  const actionMenu = [
    ...(props.onRemove
      ? [
          {
            type: "danger",
            label: "Supprimer",
            onClick: props.onRemove,
          },
        ]
      : []),
  ] as DropDownMenuType;

  return (
    <div className="items-center flex grow space-x-2 px-3 text-base">
      <div className="flex items-center space-x-1">
        <Button
          data-tooltip="Retour"
          size="xs"
          theme="outlined"
          shortcut={["esc"]}
          icon={
            onClose
              ? (p) => <XMarkIcon {...p} />
              : (p) => <ArrowLeftIcon {...p} />
          }
          onClick={cancel}
        />
        {mode === "read" && (
          <>
            <Button
              data-tooltip="Précédent"
              size="xs"
              theme="outlined"
              shortcut={["k"]}
              icon={(p) => <ChevronUpIcon {...p} />}
            />
            <Button
              data-tooltip="Suivant"
              size="xs"
              theme="outlined"
              shortcut={["j"]}
              icon={(p) => <ChevronDownIcon {...p} />}
            />
          </>
        )}
      </div>
      {!loading && (
        <>
          {prefix}
          <div className="grow" />
          {props.editRoute && (
            <Button
              data-tooltip="Dupliquer"
              size="xs"
              theme="invisible"
              shortcut={["cmd+d"]}
              icon={(p) => <DocumentDuplicateIcon {...p} />}
              onClick={(e: any) =>
                navigate(
                  withModel(getRoute(props.editRoute || "", { id: "new" }), {
                    ..._.omit(document, "id"),
                  }),
                  {
                    event: e,
                  }
                )
              }
            />
          )}
          <Button
            data-tooltip="Copier le lien"
            size="xs"
            theme="invisible"
            shortcut={["shift+u"]}
            icon={(p) => <LinkIcon {...p} />}
            onClick={() =>
              copyToClipboard(
                window.location.href,
                "Lien copié dans le presse-papier"
              )
            }
          />
          {props.onPrint && (
            <Button
              data-tooltip="Imprimer"
              size="xs"
              theme="invisible"
              icon={(p) => <PrinterIcon {...p} />}
              onClick={props.onPrint}
            />
          )}
          <Button
            data-tooltip="Historique"
            size="xs"
            theme="invisible"
            icon={(p) => <ClockIcon {...p} />}
          />
          {mode === "read" && (
            <Button
              data-tooltip="Modifier"
              size="xs"
              theme="invisible"
              shortcut={["e"]}
              onClick={async () =>
                navigate(getRoute(props.editRoute || "", { id: document.id }))
              }
              icon={(p) => <PencilSquareIcon {...p} />}
            />
          )}
          {!!actionMenu.length && (
            <Button
              size="xs"
              theme="invisible"
              icon={(p) => <EllipsisHorizontalIcon {...p} />}
              onClick={(e) => {
                setMenu({
                  target: e.currentTarget,
                  position: "bottom",
                  menu: actionMenu,
                });
              }}
            />
          )}
          {mode === "write" && (
            <>
              <Button size="xs" theme="outlined" onClick={cancel}>
                Annuler
              </Button>
              <Button size="xs" onClick={onSave} shortcut={["cmd+s"]}>
                Sauvegarder
              </Button>
            </>
          )}
          {suffix}
        </>
      )}
    </div>
  );
};
