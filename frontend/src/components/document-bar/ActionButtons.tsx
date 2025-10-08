import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenuType } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
import { getRoute } from "@features/routes";
import { copyToClipboard } from "@features/utils/clipboard";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  ArrowsPointingOutIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { useSetRecoilState } from "recoil";
import { getDuplicateDocumentData } from "./utils";

interface ActionButtonsProps {
  document: any;
  mode: "read" | "write";
  isModal: boolean;
  isRevision: boolean;
  isDeleted: boolean;
  hasWriteAccess: boolean;
  hasManageAccess: boolean;
  editRoute?: string;
  viewRoute?: string;
  onPrint?: () => Promise<void>;
  onRemove?: () => Promise<void>;
  onChangeMode?: (mode: "write" | "read") => void;
}

/**
 * ActionButtons Component
 *
 * Renders the main action buttons in the document bar based on context:
 * - Duplicate: Creates a new document with copied data
 * - Copy Link: Copies the current document URL to clipboard
 * - Expand: Opens modal document in full page (modal only)
 * - Print: Triggers print functionality (if provided)
 * - Edit: Switches to edit mode or navigates to edit page
 * - More Actions Menu: Shows additional actions like delete
 *
 * Button visibility depends on permissions, document state, and mode.
 */
export const ActionButtons = ({
  document,
  mode,
  isModal,
  isRevision,
  isDeleted,
  hasWriteAccess,
  hasManageAccess,
  editRoute,
  viewRoute,
  onPrint,
  onRemove,
  onChangeMode,
}: ActionButtonsProps) => {
  const navigate = useNavigateAlt();
  const setMenu = useSetRecoilState(DropDownAtom);

  const actionMenu = [
    ...(onRemove && hasManageAccess
      ? [
          {
            type: "danger" as const,
            label: "Supprimer",
            onClick: () => {
              onRemove?.();
            },
          },
        ]
      : []),
  ] as DropDownMenuType;

  return (
    <>
      {/* Duplicate button */}
      {document?.id && editRoute && hasWriteAccess && (
        <Button
          data-tooltip="Dupliquer"
          size="xs"
          theme="invisible"
          shortcut={["cmd+d"]}
          icon={(p) => <DocumentDuplicateIcon {...p} />}
          onClick={(e: any) =>
            navigate(
              withModel(getRoute(editRoute, { id: "new" }), {
                ...getDuplicateDocumentData(document),
              }),
              { event: e }
            )
          }
        />
      )}

      {/* Copy link button */}
      {document?.id && viewRoute && (
        <Button
          data-tooltip="Copier le lien"
          size="xs"
          theme="invisible"
          shortcut={["shift+u"]}
          icon={(p) => <LinkIcon {...p} />}
          onClick={() =>
            copyToClipboard(
              window.document.location.origin +
                getRoute(viewRoute, { id: document.id }),
              "Lien copié dans le presse-papier"
            )
          }
        />
      )}

      {/* Expand in full page (modal only) */}
      {isModal && document?.id && viewRoute && (
        <Button
          data-tooltip="Ouvrir en pleine page"
          size="xs"
          className="m-0.5"
          theme="invisible"
          to={getRoute(viewRoute, { id: document.id })}
          icon={(p) => <ArrowsPointingOutIcon {...p} />}
        />
      )}

      {/* Print button */}
      {onPrint && (
        <Button
          data-tooltip="Imprimer"
          size="xs"
          theme="invisible"
          icon={(p) => <PrinterIcon {...p} />}
          onClick={onPrint}
        />
      )}

      {/* Edit button */}
      {!isRevision &&
        !isDeleted &&
        mode === "read" &&
        document?.id &&
        editRoute &&
        hasWriteAccess && (
          <Button
            data-tooltip="Modifier"
            size="xs"
            theme="invisible"
            shortcut={["e"]}
            onClick={async () =>
              isModal
                ? onChangeMode?.("write")
                : navigate(getRoute(editRoute, { id: document.id }))
            }
            icon={(p) => <PencilSquareIcon {...p} />}
          />
        )}

      {/* More actions menu */}
      {!isRevision && !isDeleted && !!actionMenu.length && (
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
    </>
  );
};
