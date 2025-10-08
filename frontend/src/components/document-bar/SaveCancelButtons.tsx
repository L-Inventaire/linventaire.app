import { Button } from "@atoms/button/button";

interface SaveCancelButtonsProps {
  mode: "read" | "write";
  document: any;
  isRevision: boolean;
  isDeleted: boolean;
  hasWriteAccess: boolean;
  incomplete?: boolean;
  onSave?: () => Promise<any>;
  onCancel: () => void;
  onChangeMode?: (mode: "write" | "read") => void;
}

export const SaveCancelButtons = ({
  mode,
  document,
  isRevision,
  isDeleted,
  hasWriteAccess,
  incomplete,
  onSave,
  onCancel,
  onChangeMode,
}: SaveCancelButtonsProps) => {
  // Only show save/cancel buttons in write mode for non-deleted, non-revision documents
  if (!onSave || isRevision || isDeleted || mode !== "write") {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        theme="outlined"
        onClick={() => {
          if (onChangeMode && document.id) {
            return onChangeMode("read");
          }
          onCancel();
        }}
      >
        Annuler
      </Button>
      {hasWriteAccess && (
        <Button
          size="sm"
          onClick={onSave}
          shortcut={["cmd+s"]}
          disabled={incomplete}
        >
          Sauvegarder
        </Button>
      )}
    </>
  );
};
