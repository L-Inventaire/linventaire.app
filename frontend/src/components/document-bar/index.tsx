import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
import { useRegisterActiveSelection } from "@features/ctrlk/use-register-current-selection";
import { entityRoutes, getRoute } from "@features/routes";
import { copyToClipboard } from "@features/utils/clipboard";
import { formatTime } from "@features/utils/format/dates";
import { useLastLocations } from "@features/utils/hooks/use-navigation-history";
import { useNavigateAlt } from "@features/utils/navigate";
import { RestEntity } from "@features/utils/rest/types/types";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import {
  ArchiveBoxArrowDownIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { Badge, Separator } from "@radix-ui/themes";
import _ from "lodash";
import { useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { useSetRecoilState } from "recoil";
import { DraftContext } from "../../features/utils/rest/hooks/use-draft-rest";
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
  onChangeMode?: (mode: "write" | "read") => void;
}) => {
  const isRevision = document?.id?.includes("~");
  const revision = document?.id?.split("~")[1];
  const { isModal } = useContext(DraftContext);

  props.editRoute = props.editRoute || entityRoutes[entity]?.edit;
  props.viewRoute = props.viewRoute || entityRoutes[entity]?.view;

  const setMenu = useSetRecoilState(DropDownAtom);

  const navigate = useNavigateAlt();

  const { getLastLocations } = useLastLocations();

  const cancel = async () => {
    if (
      mode === "write" &&
      !confirm(
        "Voulez-vous vraiment quitter sans sauvegarder vos modifications ?"
      )
    ) {
      return;
    }

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
            onClick: () => {
              props.onRemove?.();
            },
          },
        ]
      : []),
  ] as DropDownMenuType;

  const { register, unregister } = useRegisterActiveSelection();
  useEffect(() => {
    setTimeout(() => {
      register(entity, [document]);
    }, 100);
    return () => unregister();
  }, []);

  if (!document) return null;

  return (
    <div className="items-center flex grow space-x-2 px-3 text-base h-12 draggable-handle">
      <div className="flex items-center space-x-1">
        {(!isModal || !onClose) && (
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
        )}
        {mode === "read" && !isModal && (
          <DocumentBarNav
            entity={entity}
            id={document?.id}
            getRoute={(id) => {
              return getRoute(props.viewRoute || "/", { id });
            }}
          />
        )}
      </div>
      {!document.is_deleted && !isRevision && prefix}
      <div className="grow" />
      {!loading && (
        <>
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
                    ..._.omit(
                      document,
                      "id",
                      "state",
                      "emit_date",
                      "reference_preferred_value",
                      "recipients"
                    ),
                  }),
                  {
                    event: e,
                  }
                )
              }
            />
          )}
          {document?.id && props.viewRoute && (
            <Button
              data-tooltip="Copier le lien"
              size="xs"
              theme="invisible"
              shortcut={["shift+u"]}
              icon={(p) => <LinkIcon {...p} />}
              onClick={() =>
                copyToClipboard(
                  window.document.location.origin +
                    getRoute(props.viewRoute!, { id: document.id }),
                  "Lien copié dans le presse-papier"
                )
              }
            />
          )}
          {isModal && document?.id && props.viewRoute && (
            <Button
              data-tooltip="Ouvrir en pleine page"
              size="xs"
              className="m-0.5"
              theme="invisible"
              to={getRoute(props.viewRoute, { id: document.id })}
              icon={(p) => <ArrowsPointingOutIcon {...p} />}
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
          {!isRevision &&
            !document.is_deleted &&
            mode === "read" &&
            !!props.editRoute && (
              <Button
                data-tooltip="Modifier"
                size="xs"
                theme="invisible"
                shortcut={["e"]}
                onClick={async () =>
                  isModal
                    ? props.onChangeMode?.("write")
                    : navigate(
                        getRoute(props.editRoute || "", { id: document.id })
                      )
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
                <Button
                  size="sm"
                  theme="outlined"
                  onClick={() => {
                    if (props.onChangeMode && document.id)
                      return props.onChangeMode("read");
                    cancel();
                  }}
                >
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

      {!!isModal && !!onClose && (
        <>
          <Separator orientation="vertical" />
          <Button
            data-tooltip="Fermer"
            size="xs"
            theme={"invisible"}
            shortcut={["esc"]}
            icon={(p) => <XMarkIcon {...p} />}
            onClick={cancel}
          />
        </>
      )}
    </div>
  );
};
