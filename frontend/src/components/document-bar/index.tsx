import { Button } from "@atoms/button/button";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { Separator } from "@radix-ui/themes";
import { useReadDraftRest } from "../../features/utils/rest/hooks/use-draft-rest";

// Import our new components and utilities
import { ActionButtons } from "./ActionButtons";
import { NavigationButtons } from "./NavigationButtons";
import { SaveCancelButtons } from "./SaveCancelButtons";
import { StatusBadges } from "./StatusBadges";
import { useCancelNavigation, useDocumentSelection } from "./hooks";
import { DocumentBarProps } from "./types";
import { getDocumentState, getDefaultRoutes, useDocumentAccess } from "./utils";

/**
 * DocumentBar Component
 *
 * A comprehensive document header that handles complex user journeys for document management.
 * Supports both modal and full-page contexts with different navigation behaviors.
 *
 * USER JOURNEYS:
 *
 * Full Page Mode:
 * - Create element → save → navigate to view page
 * - View element → click edit → navigate to edit page
 * - Edit element → cancel/save → navigate to view page
 * - Delete/restore element → navigate to view page
 *
 * Modal Mode:
 * - Create element → save → return created element ID or call onClose
 * - Create element → cancel → call onClose
 * - View element → click edit → switch to edit mode (no navigation)
 * - Edit element → cancel/save → back to view mode (no navigation)
 * - Delete/restore element → back to view mode (no navigation)
 *
 * Special behaviors:
 * - Duplicate, expand actions always cause navigation
 * - Modal mode: back button calls onClose instead of navigating
 * - Modal mode: no prev/next navigation arrows
 * - Modal mode: includes expand button to open in full page
 *
 * Document States:
 * - Normal: Full functionality available
 * - Deleted: Shows restore option, limited actions
 * - Revision: Shows version info and restore option, read-only
 */
export const DocumentBar = (props: DocumentBarProps) => {
  const {
    mode,
    entity,
    document,
    onSave,
    incomplete,
    prefix,
    suffix,
    loading,
    onClose,
    onPrint,
    onRemove,
    onRestore,
    onChangeMode,
    backRoute,
    viewRoute,
    editRoute,
  } = props;

  // Get document state and routes
  const documentState = getDocumentState(entity, document);
  const { isRevision, revision, isDeleted, entityRoleName } = documentState;
  const routes = getDefaultRoutes(entity, { editRoute, viewRoute });

  // Get access permissions
  const { hasManageAccess, hasWriteAccess } = useDocumentAccess(entityRoleName);

  // Handle navigation and cancellation
  const { cancel, isModal } = useCancelNavigation(document, mode, onClose, {
    ...routes,
    backRoute,
  });

  // Enable among other things the navigation confirm prompt when editing a document
  useReadDraftRest(entity, document.id || "", mode !== "write");

  // Register document for global keyboard shortcuts
  useDocumentSelection(entity, document);

  if (!document) return null;

  return (
    <div className="items-center flex grow space-x-2 px-3 text-base h-12 draggable-handle">
      {/* Navigation buttons (back/close and prev/next) */}
      <NavigationButtons
        isModal={isModal}
        mode={mode}
        entity={entity}
        document={document}
        onClose={onClose}
        onCancel={cancel}
        viewRoute={routes.viewRoute}
      />

      {/* Prefix content (shown when not deleted and not revision) */}
      {!isDeleted && !isRevision && prefix}

      {/* Spacer */}
      <div className="grow" />

      {!loading && (
        <>
          {/* Status badges and restoration buttons */}
          <StatusBadges
            isRevision={isRevision}
            revision={revision}
            isDeleted={isDeleted}
            document={document}
            viewRoute={routes.viewRoute}
            onRestore={onRestore}
            onChangeMode={onChangeMode}
            isModal={isModal}
          />

          {/* Separator after status badges */}
          {(isRevision || isDeleted) && <Separator orientation="vertical" />}

          {/* Action buttons (duplicate, copy link, expand, print, edit, menu) */}
          <ActionButtons
            document={document}
            mode={mode}
            isModal={isModal}
            isRevision={isRevision}
            isDeleted={isDeleted}
            hasWriteAccess={hasWriteAccess}
            hasManageAccess={hasManageAccess}
            editRoute={routes.editRoute}
            viewRoute={routes.viewRoute}
            onPrint={onPrint}
            onRemove={onRemove}
            onChangeMode={onChangeMode}
          />

          {/* Save/Cancel buttons (shown in write mode) */}
          <SaveCancelButtons
            mode={mode}
            document={document}
            isRevision={isRevision}
            isDeleted={isDeleted}
            hasWriteAccess={hasWriteAccess}
            incomplete={incomplete}
            onSave={onSave}
            onCancel={cancel}
            onChangeMode={onChangeMode}
          />

          {/* Suffix content (shown when not deleted and not revision) */}
          {!isRevision && !isDeleted && suffix}
        </>
      )}

      {/* Modal close button */}
      {isModal && onClose && (
        <>
          <Separator orientation="vertical" />
          <Button
            data-tooltip="Fermer"
            size="xs"
            theme="invisible"
            shortcut={["esc"]}
            icon={(p) => <XMarkIcon {...p} />}
            onClick={cancel}
          />
        </>
      )}
    </div>
  );
};
