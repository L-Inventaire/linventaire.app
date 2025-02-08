import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
import { useRegisterActiveSelection } from "@features/ctrlk/use-register-current-selection";
import { getRoute } from "@features/routes";
import { copyToClipboard } from "@features/utils/clipboard";
import { formatTime } from "@features/utils/format/dates";
import { useLastLocations } from "@features/utils/hooks/use-navigation-history";
import { useNavigateAlt } from "@features/utils/navigate";
import { RestEntity } from "@features/utils/rest/types/types";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import {
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Badge, Separator } from "@radix-ui/themes";
import _ from "lodash";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useSetRecoilState } from "recoil";
import { DocumentBarNav } from "./nav";

export const DocumentBar = ({
  mode,
  entity,
  document,
  onSave,
  onSaveDisabled,
  prefix,
  suffix,
  loading,
  onClose,
  ...props
}: {
  loading?: boolean;
  mode: "read" | "write";
  entity: string;
  document: any & RestEntity;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onClose?: () => void;
  backRoute?: string;
  viewRoute?: string;
  editRoute?: string;
  onPrint?: () => Promise<void>;
  onSave?: () => Promise<any>;
  onSaveDisabled?: boolean;
  onRemove?: () => Promise<void>;
  onRestore?: () => Promise<void>;
}) => {
  const isRevision = document?.id?.includes("~");
  const revision = document?.id?.split("~")[1];

  const setMenu = useSetRecoilState(DropDownAtom);

  const navigate = useNavigateAlt();

  const { getLastLocations } = useLastLocations();

  const cancel = async () => {
    if (onClose) return onClose();
    // Get previous route that is not the form nor the viewer
    const previousPage = _.last(
      getLastLocations().filter(
        (a) =>
          !(
            props.viewRoute &&
            (a.includes(getRoute(props.viewRoute, { id: document.id })) ||
              a.includes(getRoute(props.viewRoute, { id: "new" })))
          ) &&
          !(
            props.editRoute &&
            (a.includes(getRoute(props.editRoute, { id: document.id })) ||
              a.includes(getRoute(props.editRoute, { id: "new" })))
          )
      )
    );
    const backToView = document.id && mode !== "read";
    navigate(
      backToView
        ? getRoute(props.viewRoute || "/", { id: document.id })
        : previousPage || getRoute(props.backRoute || "/")
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

  const registerActiveSelection = useRegisterActiveSelection();
  useEffect(() => {
    setTimeout(() => {
      registerActiveSelection(entity, [document]);
    }, 100);
    return () => registerActiveSelection(entity, []);
  }, []);

  if (!document) return null;

  return (
    <div className="items-center flex grow space-x-2 px-3 text-base h-12">
      <div className="flex items-center space-x-1">
        <Button
          data-tooltip="Retour"
          size="xs"
          theme={onClose ? "invisible" : "outlined"}
          shortcut={["esc"]}
          icon={
            onClose
              ? (p) => <XMarkIcon {...p} />
              : (p) => <ArrowLeftIcon {...p} />
          }
          onClick={cancel}
        />
        {mode === "read" &&
          window.document.location.host.indexOf("localhost") > -1 && (
            <DocumentBarNav
              entity={entity}
              id={document?.id}
              getRoute={(id) => {
                return getRoute(props.viewRoute || "/", { id });
              }}
            />
          )}
      </div>
      {!loading && (
        <>
          {!document.is_deleted && !isRevision && prefix}
          <div className="grow" />
          {isRevision && (
            <>
              <Badge color="bronze" size="2">
                Vous consultez une version antérieure ({formatTime(revision)})
              </Badge>
              {props?.onRestore && (
                <Button
                  color="green"
                  data-tooltip="Restaurer cette version"
                  size="xs"
                  theme="invisible"
                  icon={(p) => <ArchiveBoxArrowDownIcon {...p} />}
                  onClick={async () => {
                    try {
                      await props.onRestore?.();
                      navigate(
                        getRoute(props.viewRoute || "/", {
                          id: document.id.split("~")[0],
                        })
                      );
                    } catch {
                      toast.error("Impossible de restaurer le document");
                    }
                  }}
                />
              )}
              {props.viewRoute && (
                <Button
                  color="green"
                  data-tooltip="Revenir à la dernière version"
                  size="xs"
                  theme="invisible"
                  icon={(p) => <ArrowUturnLeftIcon {...p} />}
                  onClick={() => {
                    navigate(
                      getRoute(props.viewRoute || "/", {
                        id: document.id.split("~")[0],
                      })
                    );
                  }}
                />
              )}
              <Separator orientation="vertical" />
            </>
          )}
          {document.is_deleted && !isRevision && (
            <>
              <Badge color="red" size="2">
                Document supprimé
              </Badge>
              {props?.onRestore && (
                <Button
                  data-tooltip="Restaurer"
                  size="xs"
                  theme="invisible"
                  icon={(p) => <ArchiveBoxArrowDownIcon {...p} />}
                  onClick={async () => {
                    try {
                      await props.onRestore?.();
                      navigate(
                        getRoute(props.viewRoute || "/", {
                          id: document.id.split("~")[0],
                        })
                      );
                    } catch {
                      toast.error("Impossible de restaurer le document");
                    }
                  }}
                />
              )}
              <Separator orientation="vertical" />
            </>
          )}
          {document?.id && props.editRoute && (
            <Button
              data-tooltip="Dupliquer"
              size="xs"
              theme="invisible"
              shortcut={["cmd+d"]}
              icon={(p) => <DocumentDuplicateIcon {...p} />}
              onClick={(e: any) =>
                navigate(
                  withModel(getRoute(props.editRoute || "", { id: "new" }), {
                    ..._.omit(document, "id", "state", "emit_date"),
                  }),
                  {
                    event: e,
                  }
                )
              }
            />
          )}
          {document?.id && (
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
          )}
          {props.onPrint && (
            <Button
              data-tooltip="Imprimer"
              size="xs"
              theme="invisible"
              icon={(p) => <PrinterIcon {...p} />}
              onClick={props.onPrint}
            />
          )}
          {!isRevision && !document.is_deleted && mode === "read" && (
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
          {!isRevision && !document.is_deleted && !!actionMenu.length && (
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
          {!!onSave &&
            !isRevision &&
            !document.is_deleted &&
            mode === "write" && (
              <>
                <Button size="sm" theme="outlined" onClick={cancel}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  shortcut={["cmd+s"]}
                  disabled={onSaveDisabled}
                >
                  Sauvegarder
                </Button>
              </>
            )}
          {!isRevision && !document.is_deleted && suffix}
        </>
      )}
    </div>
  );
};
